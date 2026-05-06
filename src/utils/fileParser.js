import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import cvSectionsSchema from './cvSections.json';

// Set up PDF.js worker with multiple fallback options
// This ensures the worker loads correctly in different environments
const setupPdfWorker = () => {
  const version = pdfjsLib.version;
  
  // Try multiple CDN sources in order
  const workerSources = [
    `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`
  ];
  
  // Use the first available source
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];
  
  console.log('PDF.js worker configured:', workerSources[0]);
};

setupPdfWorker();

/**
 * Extract text from a TXT file
 */
export const extractTextFromTxt = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read TXT file'));
    reader.readAsText(file);
  });
};

/**
 * Extract text from a DOCX file using mammoth
 */
export const extractTextFromDocx = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(new Error('Failed to parse DOCX file: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read DOCX file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extract text from a PDF file using pdf.js
 */
export const extractTextFromPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({
          data: typedArray,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true
        });
        
        const pdf = await loadingTask.promise;
        let fullText = '';

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }

        resolve(fullText);
      } catch (error) {
        console.error('PDF parsing error:', error);
        reject(new Error('Failed to parse PDF file: ' + error.message + '. Try converting to DOCX or TXT format.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Main function to extract text from any supported file type
 */
export const extractTextFromFile = async (file) => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await extractTextFromTxt(file);
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return await extractTextFromDocx(file);
  } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPdf(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }
};

/**
 * Detect CV sections using keyword matching
 */
const detectSections = (text) => {
  const lines = text.split('\n');
  const sections = {};
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim().toLowerCase();
    
    // Check each section type
    Object.keys(cvSectionsSchema).forEach(sectionKey => {
      const section = cvSectionsSchema[sectionKey];
      
      // Check if any keyword matches the line
      section.keywords.forEach(keyword => {
        if (trimmedLine === keyword.toLowerCase() || 
            trimmedLine.startsWith(keyword.toLowerCase() + ':') ||
            trimmedLine.startsWith(keyword.toLowerCase() + ' -') ||
            (trimmedLine.length < 50 && trimmedLine.includes(keyword.toLowerCase()))) {
          
          if (!sections[sectionKey]) {
            sections[sectionKey] = {
              startLine: index,
              title: line.trim(),
              content: []
            };
          }
        }
      });
    });
  });
  
  // Extract content for each section
  const sectionKeys = Object.keys(sections).sort((a, b) => 
    sections[a].startLine - sections[b].startLine
  );
  
  sectionKeys.forEach((key, idx) => {
    const startLine = sections[key].startLine + 1;
    const endLine = idx < sectionKeys.length - 1 
      ? sections[sectionKeys[idx + 1]].startLine 
      : lines.length;
    
    sections[key].content = lines.slice(startLine, endLine)
      .filter(line => line.trim())
      .map(line => line.trim());
  });
  
  return sections;
};

/**
 * Extract email addresses from text
 */
const extractEmails = (text) => {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  return text.match(emailRegex) || [];
};

/**
 * Extract phone numbers from text
 */
const extractPhones = (text) => {
  const phoneRegex = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/g;
  return text.match(phoneRegex) || [];
};

/**
 * Extract name from CV (usually first non-empty line)
 */
const extractName = (lines) => {
  const phoneRegex = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/;
  
  for (let line of lines) {
    const trimmed = line.trim();
    // Check if line is likely a name (short, no email, no phone, no special patterns)
    if (trimmed.length > 0 && 
        trimmed.length < 50 && 
        !trimmed.includes('@') && 
        !phoneRegex.test(trimmed) &&
        !trimmed.toLowerCase().includes('curriculum vitae') &&
        !trimmed.toLowerCase().includes('resume') &&
        !trimmed.toLowerCase().includes('cv')) {
      return trimmed;
    }
  }
  return '';
};

/**
 * Parse education entries from section content
 */
const parseEducation = (content) => {
  const entries = [];
  let currentEntry = null;
  
  // Common degree patterns
  const degreePatterns = [
    /bachelor|b\.s\.|b\.a\.|bs|ba/i,
    /master|m\.s\.|m\.a\.|ms|ma|mba/i,
    /ph\.?d|doctorate|doctoral/i,
    /associate|diploma|certificate/i
  ];
  
  // Date pattern (e.g., 2020, 2018-2020, Jan 2020)
  const datePattern = /\b(19|20)\d{2}\b|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i;
  
  content.forEach(line => {
    // Check if line contains a degree
    const hasDegree = degreePatterns.some(pattern => pattern.test(line));
    const hasDate = datePattern.test(line);
    
    if (hasDegree || hasDate) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = {
        id: Date.now() + Math.random(),
        school: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        description: line
      };
    } else if (currentEntry) {
      currentEntry.description += '\n' + line;
    }
  });
  
  if (currentEntry) {
    entries.push(currentEntry);
  }
  
  return entries;
};

/**
 * Parse work experience entries from section content
 */
const parseExperience = (content) => {
  const entries = [];
  let currentEntry = null;
  
  // Date pattern
  const datePattern = /\b(19|20)\d{2}\b|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|present/i;
  
  // Common job title keywords
  const titleKeywords = /engineer|developer|manager|analyst|designer|consultant|specialist|director|coordinator|lead|senior|junior/i;
  
  content.forEach((line, idx) => {
    const hasDate = datePattern.test(line);
    const hasTitle = titleKeywords.test(line);
    
    // Start new entry if we detect a job title or date
    if (hasDate || hasTitle || (line.length < 100 && line.split(' ').length < 10)) {
      if (currentEntry && currentEntry.description) {
        entries.push(currentEntry);
      }
      
      if (!currentEntry || currentEntry.description) {
        currentEntry = {
          id: Date.now() + Math.random(),
          company: '',
          position: '',
          location: '',
          startDate: '',
          endDate: '',
          description: ''
        };
      }
      
      // Try to identify if this is company or position
      if (hasTitle && !currentEntry.position) {
        currentEntry.position = line;
      } else if (!currentEntry.company) {
        currentEntry.company = line;
      } else {
        currentEntry.description += line + '\n';
      }
    } else if (currentEntry) {
      currentEntry.description += line + '\n';
    }
  });
  
  if (currentEntry && currentEntry.description) {
    entries.push(currentEntry);
  }
  
  return entries;
};

/**
 * Parse skills from section content
 */
const parseSkills = (content) => {
  const skills = [];
  
  content.forEach(line => {
    // Split by common separators
    const skillItems = line.split(/[,;•·|]/);
    
    skillItems.forEach(skill => {
      const trimmed = skill.trim();
      if (trimmed.length > 1 && trimmed.length < 50) {
        skills.push({
          id: Date.now() + Math.random(),
          name: trimmed
        });
      }
    });
  });
  
  return skills;
};

/**
 * Advanced CV parser using section detection
 */
export const parseCV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Detect sections
  const sections = detectSections(text);
  
  // Initialize data structure
  const data = {
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      summary: ''
    },
    education: [],
    experience: [],
    skills: []
  };

  // Extract contact information
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  
  if (emails.length > 0) {
    data.personalInfo.email = emails[0];
  }
  
  if (phones.length > 0) {
    data.personalInfo.phone = phones[0];
  }

  // Extract name
  data.personalInfo.fullName = extractName(lines);

  // Extract summary
  if (sections.summary) {
    data.personalInfo.summary = sections.summary.content.join('\n');
  }

  // Extract education
  if (sections.education) {
    data.education = parseEducation(sections.education.content);
  }

  // Extract experience
  if (sections.experience) {
    data.experience = parseExperience(sections.experience.content);
  }

  // Extract skills
  if (sections.skills) {
    data.skills = parseSkills(sections.skills.content);
  }

  // Return the extracted data and the full text for manual review
  return {
    data,
    fullText: text,
    sections: sections // Include detected sections for debugging
  };
};
