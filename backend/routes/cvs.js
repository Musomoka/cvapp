import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// JSON file persistence
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const CVS_FILE = path.join(DATA_DIR, 'cvs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadCVs() {
  ensureDataDir();
  if (!fs.existsSync(CVS_FILE)) return { cvs: [], nextId: 1 };
  try { return JSON.parse(fs.readFileSync(CVS_FILE, 'utf8')); }
  catch { return { cvs: [], nextId: 1 }; }
}

function saveCVs(data) {
  ensureDataDir();
  fs.writeFileSync(CVS_FILE, JSON.stringify(data, null, 2));
}

// Get all CVs for the authenticated user
router.get('/', authenticateToken, (req, res) => {
  try {
    const { cvs } = loadCVs();
    const userCVs = cvs
      .filter(cv => cv.userId === req.user.id)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      success: true,
      cvs: userCVs
    });
  } catch (error) {
    console.error('Get CVs error:', error);
    res.status(500).json({ error: 'Server error fetching CVs' });
  }
});

// Get a specific CV
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const cvId = parseInt(req.params.id);
    const { cvs } = loadCVs();
    const cv = cvs.find(c => c.id === cvId && c.userId === req.user.id);

    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    res.json({
      success: true,
      cv
    });
  } catch (error) {
    console.error('Get CV error:', error);
    res.status(500).json({ error: 'Server error fetching CV' });
  }
});

// Create new CV
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, data, template } = req.body;

    if (!name || !data || !template) {
      return res.status(400).json({ error: 'Name, data, and template are required' });
    }

    const store = loadCVs();
    const cv = {
      id: store.nextId++,
      userId: req.user.id,
      name,
      data,
      template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.cvs.push(cv);
    saveCVs(store);

    res.status(201).json({
      success: true,
      cv,
      message: 'CV saved successfully'
    });
  } catch (error) {
    console.error('Create CV error:', error);
    res.status(500).json({ error: 'Server error saving CV' });
  }
});

// Update existing CV
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const cvId = parseInt(req.params.id);
    const { name, data, template } = req.body;

    const store = loadCVs();
    const cv = store.cvs.find(c => c.id === cvId && c.userId === req.user.id);

    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    if (name) cv.name = name;
    if (data) cv.data = data;
    if (template) cv.template = template;
    cv.updatedAt = new Date().toISOString();
    saveCVs(store);

    res.json({
      success: true,
      cv,
      message: 'CV updated successfully'
    });
  } catch (error) {
    console.error('Update CV error:', error);
    res.status(500).json({ error: 'Server error updating CV' });
  }
});

// Delete CV
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const cvId = parseInt(req.params.id);
    const store = loadCVs();
    const cvIndex = store.cvs.findIndex(c => c.id === cvId && c.userId === req.user.id);

    if (cvIndex === -1) {
      return res.status(404).json({ error: 'CV not found' });
    }

    store.cvs.splice(cvIndex, 1);
    saveCVs(store);

    res.json({
      success: true,
      message: 'CV deleted successfully'
    });
  } catch (error) {
    console.error('Delete CV error:', error);
    res.status(500).json({ error: 'Server error deleting CV' });
  }
});

export default router;
