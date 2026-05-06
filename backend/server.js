import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { extractTextFromFile } from './fileExtractor.js';
import { parseCV, parseCVStream, estimateTokens, estimateCost } from './parseService.js';
import { appendParseLog } from './dataStore.js';
import authRouter from './routes/auth.js';
import cvsRouter from './routes/cvs.js';
import adminRouter from './routes/admin.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cvs', cvsRouter);
app.use('/api/admin', adminRouter);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CV Parser API is running',
    provider: process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'OpenAI',
    model: process.env.AI_MODEL || 'deepseek-chat',
  });
});

// CV parsing endpoint
app.post('/api/parse-cv', upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    filePath = req.file.path;
    console.log(`Processing file: ${req.file.originalname}`);

    // Step 1: Extract text from file
    const cvText = await extractTextFromFile(filePath);
    
    if (!cvText || cvText.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    console.log(`Extracted ${cvText.length} characters from CV`);

    // Step 2: Cap text to avoid sending huge documents to the AI.
    // CVs are typically 1–3 pages (~3 000–9 000 chars). Anything beyond
    // 15 000 chars is almost certainly not relevant CV content.
    const MAX_CV_CHARS = 15000;
    const textForAI = cvText.length > MAX_CV_CHARS
      ? cvText.slice(0, MAX_CV_CHARS)
      : cvText;

    if (cvText.length > MAX_CV_CHARS) {
      console.log(`Text truncated from ${cvText.length} to ${MAX_CV_CHARS} chars before AI call`);
    }

    // Step 3: Parse CV using DeepSeek
    const parsedData = await parseCV(textForAI);

    // Step 4: Calculate usage stats
    const inputTokens = estimateTokens(textForAI);
    const outputTokens = estimateTokens(JSON.stringify(parsedData));
    const estimatedCost = estimateCost(inputTokens, outputTokens);

    console.log(`Parsing complete. Estimated cost: $${estimatedCost.toFixed(4)}`);

    // Log the parse event for admin
    appendParseLog({
      timestamp: new Date().toISOString(),
      filename: req.file.originalname,
      fileSize: req.file.size,
      extractedTextLength: cvText.length,
      inputTokens,
      outputTokens,
      estimatedTokens: inputTokens + outputTokens,
      estimatedCost,
      model: process.env.AI_MODEL || 'deepseek-chat',
      success: true,
    });

    // Step 5: Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Step 6: Return parsed data
    res.json({
      success: true,
      data: parsedData,
      metadata: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        extractedTextLength: cvText.length,
        estimatedTokens: inputTokens + outputTokens,
        estimatedCost: estimatedCost,
        model: process.env.AI_MODEL || 'deepseek-chat',
      },
    });

  } catch (error) {
    console.error('Error parsing CV:', error);

    // Log the failed parse
    appendParseLog({
      timestamp: new Date().toISOString(),
      filename: req.file?.originalname || 'unknown',
      fileSize: req.file?.size || 0,
      extractedTextLength: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedTokens: 0,
      estimatedCost: 0,
      model: process.env.AI_MODEL || 'deepseek-chat',
      success: false,
      error: error.message,
    });

    // Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse CV',
    });
  }
});

// ─── Streaming CV parse endpoint (SSE) ───────────────────────────────────────
// Sends Server-Sent Events so the frontend can show a real-time progress bar.
// Event shapes:
//   { type:'progress', stage:'uploading'|'extracting'|'parsing'|'done', progress:0-100, message:'' }
//   { type:'token',    content: '<chunk>' }   ← one per AI token
//   { type:'done',     data: {...}, metadata: {...} }
//   { type:'error',    message: '' }
app.post('/api/parse-cv/stream', upload.single('file'), async (req, res) => {
  // Set SSE headers BEFORE writing anything
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  let filePath = null;

  try {
    if (!req.file) {
      send({ type: 'error', message: 'No file uploaded' });
      return res.end();
    }

    filePath = req.file.path;
    console.log(`\n[Stream] ── New upload: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // Stage 1 – extracting text
    send({ type: 'progress', stage: 'extracting', progress: 15, message: 'Extracting text from file…' });
    console.log('[Stream] Stage 1: extracting text…');

    const cvText = await extractTextFromFile(filePath);

    if (!cvText || cvText.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    const MAX_CV_CHARS = 15000;
    const textForAI = cvText.length > MAX_CV_CHARS ? cvText.slice(0, MAX_CV_CHARS) : cvText;

    console.log(`[Stream] Extracted ${cvText.length} chars${cvText.length > MAX_CV_CHARS ? ` (truncated to ${MAX_CV_CHARS})` : ''}`);
    send({ type: 'progress', stage: 'parsing', progress: 30, message: 'Sending to DeepSeek AI…' });

    // Stage 2 – streaming AI response
    console.log('[Stream] Stage 2: AI streaming — tokens below:');
    console.log('─'.repeat(60));

    // Tokens stream in; progress bar climbs from 30 → 85 asymptotically
    let tokenCount = 0;
    const parsedData = await parseCVStream(textForAI, (chunk, total) => {
      tokenCount = total;
      // Asymptotic progress: climbs quickly early, slows near 85%
      const aiProgress = Math.round(30 + 55 * (1 - Math.exp(-total / 120)));
      send({ type: 'token', content: chunk, progress: Math.min(aiProgress, 85) });
    });

    console.log('─'.repeat(60));

    // Stage 3 – finalising
    send({ type: 'progress', stage: 'finalising', progress: 92, message: 'Finalising…' });

    const inputTokens  = estimateTokens(textForAI);
    const outputTokens = estimateTokens(JSON.stringify(parsedData));
    const estimatedCost = estimateCost(inputTokens, outputTokens);

    console.log(`[Stream] Complete — ${tokenCount} stream chunks | est. cost $${estimatedCost.toFixed(5)}`);

    appendParseLog({
      timestamp: new Date().toISOString(),
      filename: req.file.originalname,
      fileSize: req.file.size,
      extractedTextLength: cvText.length,
      inputTokens,
      outputTokens,
      estimatedTokens: inputTokens + outputTokens,
      estimatedCost,
      model: process.env.AI_MODEL || 'deepseek-chat',
      success: true,
    });

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    send({
      type: 'done',
      data: parsedData,
      metadata: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        extractedTextLength: cvText.length,
        estimatedTokens: inputTokens + outputTokens,
        estimatedCost,
        model: process.env.AI_MODEL || 'deepseek-chat',
      },
    });

  } catch (error) {
    console.error('[Stream] Error:', error.message);

    appendParseLog({
      timestamp: new Date().toISOString(),
      filename: req.file?.originalname || 'unknown',
      fileSize: req.file?.size || 0,
      extractedTextLength: 0,
      inputTokens: 0, outputTokens: 0, estimatedTokens: 0, estimatedCost: 0,
      model: process.env.AI_MODEL || 'deepseek-chat',
      success: false,
      error: error.message,
    });

    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    send({ type: 'error', message: error.message });
  }

  res.end();
});

// Test endpoint for checking API connectivity
app.get('/api/test-api', async (req, res) => {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const provider = process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'OpenAI';
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    res.json({
      success: true,
      message: `${provider} API key is configured`,
      provider: provider,
      model: process.env.AI_MODEL || 'deepseek-chat',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File is too large. Maximum size is 10MB.',
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  const provider = process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'OpenAI';
  const model = process.env.AI_MODEL || 'deepseek-chat';
  
  console.log(`✅ CV Parser API running on http://localhost:${PORT}`);
  console.log(`🤖 Using ${provider} with model: ${model}`);
  console.log(`🌐 Accepting requests from: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  
  if (!apiKey) {
    console.warn('⚠️  WARNING: API key not set! Please configure .env file.');
  } else {
    console.log(`🔑 ${provider} API key configured`);
  }
});

export default app;
