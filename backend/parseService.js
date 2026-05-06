import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Configure for DeepSeek API
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.API_BASE_URL || 'https://api.deepseek.com',
});

/**
 * Parse CV text using OpenAI GPT
 * Returns structured CV data in the format expected by the frontend
 */
export async function parseCV(cvText) {
  try {
    const prompt = `You are a CV/Resume parser. Extract and structure the following CV information into JSON format.

CV Text:
${cvText}

Please extract and return a JSON object with the following structure:
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedIn": "",
    "portfolio": ""
  },
  "education": [
    {
      "school": "",
      "degree": "",
      "field": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or 'present'",
      "description": ""
    }
  ],
  "experience": [
    {
      "company": "",
      "position": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or 'present'",
      "description": ""
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

Important:
- Extract ALL information present in the CV
- Format dates as YYYY-MM (e.g., "2020-01" for January 2020)
- Use "present" for current positions/education
- If a field is not found, use an empty string or empty array
- Preserve the exact job descriptions and education details
- Extract all technical and soft skills mentioned
- Return ONLY valid JSON, no markdown or explanations`;

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a professional CV parser that extracts structured data from resumes. Always return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent, factual output
      response_format: { type: 'json_object' },
    });

    const parsedData = JSON.parse(response.choices[0].message.content);
    
    // Validate and ensure all required fields exist
    return {
      personalInfo: parsedData.personalInfo || {},
      education: parsedData.education || [],
      experience: parsedData.experience || [],
      skills: parsedData.skills || [],
    };
  } catch (error) {
    console.error('OpenAI parsing error:', error);
    throw new Error(`Failed to parse CV with OpenAI: ${error.message}`);
  }
}

/**
 * Estimate tokens for cost calculation
 */
export function estimateTokens(text) {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Calculate approximate cost for parsing
 */
export function estimateCost(inputTokens, outputTokens) {
  const model = process.env.AI_MODEL || 'deepseek-chat';
  
  const pricing = {
    'deepseek-chat': {
      input: 0.14 / 1000000,  // $0.14 per 1M tokens (cache miss)
      output: 0.28 / 1000000,  // $0.28 per 1M tokens
    },
    'deepseek-reasoner': {
      input: 0.55 / 1000000,   // $0.55 per 1M tokens (cache miss)
      output: 2.19 / 1000000,  // $2.19 per 1M tokens
    },
    'gpt-3.5-turbo': {
      input: 0.0015 / 1000,    // $0.0015 per 1K tokens
      output: 0.002 / 1000,    // $0.002 per 1K tokens
    },
    'gpt-4': {
      input: 0.03 / 1000,      // $0.03 per 1K tokens
      output: 0.06 / 1000,     // $0.06 per 1K tokens
    },
  };
  
  const rates = pricing[model] || pricing['deepseek-chat'];
  return (inputTokens * rates.input) + (outputTokens * rates.output);
}
