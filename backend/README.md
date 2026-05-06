# CV Parser Backend API

Production-grade backend for CV parsing using OpenAI GPT-3.5/GPT-4.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
# Copy the example .env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-proj-your-api-key-here
```

4. **Start the server:**
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

---

## 🔧 Configuration

### Environment Variables

Edit `backend/.env`:

```env
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-proj-your-key-here

# Optional: Choose AI model (default: gpt-3.5-turbo)
# Options: gpt-3.5-turbo, gpt-4, gpt-4-turbo
OPENAI_MODEL=gpt-3.5-turbo

# Optional: Server port (default: 3001)
PORT=3001

# Optional: Node environment
NODE_ENV=development

# Optional: Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### Model Selection Guide

| Model | Accuracy | Speed | Cost per CV | Best For |
|-------|----------|-------|-------------|----------|
| `gpt-3.5-turbo` | ~90% | Fast | $0.001-0.003 | Most users (recommended) |
| `gpt-4` | ~97% | Slower | $0.01-0.03 | Maximum accuracy |
| `gpt-4-turbo` | ~95% | Medium | $0.005-0.015 | Balance of speed & accuracy |

**Recommendation:** Start with `gpt-3.5-turbo` for best cost/performance ratio.

---

## 📡 API Endpoints

### 1. Health Check
**GET** `/api/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "CV Parser API is running",
  "model": "gpt-3.5-turbo"
}
```

### 2. Parse CV
**POST** `/api/parse-cv`

Upload and parse a CV file.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: File field named `file`
- Supported formats: `.pdf`, `.docx`, `.txt`
- Max file size: 10MB

**Response:**
```json
{
  "success": true,
  "data": {
    "personalInfo": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "location": "New York, NY",
      "linkedIn": "linkedin.com/in/johndoe",
      "portfolio": "johndoe.com"
    },
    "education": [
      {
        "school": "MIT",
        "degree": "Bachelor of Science",
        "field": "Computer Science",
        "startDate": "2015-09",
        "endDate": "2019-05",
        "description": "GPA: 3.8/4.0"
      }
    ],
    "experience": [
      {
        "company": "Google",
        "position": "Software Engineer",
        "startDate": "2019-06",
        "endDate": "present",
        "description": "Built scalable web applications..."
      }
    ],
    "skills": ["JavaScript", "Python", "React", "Node.js"]
  },
  "metadata": {
    "filename": "resume.pdf",
    "fileSize": 45632,
    "extractedTextLength": 3421,
    "estimatedTokens": 1245,
    "estimatedCost": 0.0024,
    "model": "gpt-3.5-turbo"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### 3. Test OpenAI Connection
**GET** `/api/test-openai`

Verify OpenAI API key is configured correctly.

**Response:**
```json
{
  "success": true,
  "message": "OpenAI API key is configured",
  "model": "gpt-3.5-turbo"
}
```

---

## 🧪 Testing

### Using cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Test OpenAI connection
curl http://localhost:3001/api/test-openai

# Parse a CV
curl -X POST http://localhost:3001/api/parse-cv \
  -F "file=@/path/to/your/resume.pdf"
```

### Using Postman

1. Create a new POST request to `http://localhost:3001/api/parse-cv`
2. Go to "Body" → "form-data"
3. Add a field named `file` with type "File"
4. Select your CV file
5. Send the request

---

## 💰 Cost Estimation

### GPT-3.5-turbo (Recommended)
- Input: $0.0015 per 1K tokens
- Output: $0.002 per 1K tokens
- **Average CV parse: $0.001 - $0.003**
- **Monthly (100 CVs): ~$12**

### GPT-4
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens
- **Average CV parse: $0.01 - $0.03**
- **Monthly (100 CVs): ~$20**

**Cost Control Tips:**
- Use `gpt-3.5-turbo` for 90%+ accuracy at 1/10th the cost
- Monitor usage in [OpenAI Dashboard](https://platform.openai.com/usage)
- Set spending limits in OpenAI account settings

---

## 🏗️ Architecture

```
backend/
├── server.js           # Express app & routes
├── parseService.js     # OpenAI integration
├── fileExtractor.js    # PDF/DOCX/TXT extraction
├── package.json        # Dependencies
├── .env               # Environment variables (not in git)
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
└── uploads/           # Temporary file storage (auto-cleaned)
```

### How It Works

1. **File Upload**: Frontend sends CV file via multipart/form-data
2. **Text Extraction**: Backend extracts text using pdf-parse (PDF) or mammoth (DOCX)
3. **AI Parsing**: OpenAI GPT analyzes text and returns structured JSON
4. **Response**: Parsed data + metadata returned to frontend
5. **Cleanup**: Uploaded file deleted immediately after processing

---

## 🔒 Security

- ✅ CORS enabled for frontend origin only
- ✅ File type validation (PDF/DOCX/TXT only)
- ✅ File size limit (10MB max)
- ✅ Automatic file cleanup after processing
- ✅ Environment variables for sensitive data
- ✅ Error handling prevents data leaks

**Production Checklist:**
- [ ] Set `NODE_ENV=production` in .env
- [ ] Use HTTPS in production
- [ ] Rotate OpenAI API keys regularly
- [ ] Monitor API usage and set spending limits
- [ ] Add rate limiting (e.g., express-rate-limit)
- [ ] Add authentication if needed

---

## 🐛 Troubleshooting

### "OPENAI_API_KEY not set"
**Solution:** Create `.env` file and add your API key:
```bash
cp .env.example .env
# Edit .env and add: OPENAI_API_KEY=sk-proj-your-key-here
```

### "Failed to parse CV with OpenAI"
**Possible causes:**
- Invalid API key → Check key in OpenAI dashboard
- No credits → Add payment method in OpenAI billing
- Rate limit exceeded → Wait or upgrade plan
- Network issues → Check internet connection

**Debug:**
```bash
curl http://localhost:3001/api/test-openai
```

### "No text could be extracted from the file"
**Possible causes:**
- Scanned PDF (image-based) → Use OCR tool first
- Corrupted file → Try different file
- Password-protected PDF → Remove password

### CORS Errors
**Solution:** Update `FRONTEND_URL` in `.env`:
```env
FRONTEND_URL=http://localhost:5173
```

### Port 3001 already in use
**Solution:** Change port in `.env`:
```env
PORT=3002
```

---

## 📊 Monitoring

### Check Server Logs
The server logs important events:
```
✅ CV Parser API running on http://localhost:3001
📊 Using OpenAI model: gpt-3.5-turbo
🌐 Accepting requests from: http://localhost:5173
```

### Track Costs
- View real-time usage: [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Set up billing alerts: [OpenAI Billing](https://platform.openai.com/account/billing)
- Check cost per request in API response metadata

---

## 🚀 Deployment

### Deploy to Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway add
railway up
```

3. Add environment variables in Railway dashboard:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `FRONTEND_URL` (your deployed frontend URL)

### Deploy to Heroku

1. Install Heroku CLI and login
2. Create app:
```bash
heroku create your-cv-parser-api
```

3. Set environment variables:
```bash
heroku config:set OPENAI_API_KEY=sk-proj-your-key
heroku config:set OPENAI_MODEL=gpt-3.5-turbo
heroku config:set FRONTEND_URL=https://your-frontend.com
```

4. Deploy:
```bash
git push heroku main
```

### Deploy to DigitalOcean/AWS/GCP
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📝 License

MIT

---

## 🆘 Support

**Need help?**
- Check troubleshooting section above
- Review OpenAI [API documentation](https://platform.openai.com/docs)
- Check server logs for detailed error messages

**Common Issues:**
1. ❌ Backend not starting → Check Node.js version (18+)
2. ❌ OpenAI errors → Verify API key and credits
3. ❌ CORS errors → Update FRONTEND_URL in .env
4. ❌ File upload fails → Check file size (<10MB) and type (PDF/DOCX/TXT)
