import express from 'express';
import { authenticateToken } from './auth.js';

const router = express.Router();

// In-memory CV storage (replace with database in production)
const cvs = [];
let nextCVId = 1;

// Get all CVs for the authenticated user
router.get('/', authenticateToken, (req, res) => {
  try {
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

    const cv = {
      id: nextCVId++,
      userId: req.user.id,
      name,
      data,
      template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    cvs.push(cv);

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

    const cv = cvs.find(c => c.id === cvId && c.userId === req.user.id);

    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    if (name) cv.name = name;
    if (data) cv.data = data;
    if (template) cv.template = template;
    cv.updatedAt = new Date().toISOString();

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
    const cvIndex = cvs.findIndex(c => c.id === cvId && c.userId === req.user.id);

    if (cvIndex === -1) {
      return res.status(404).json({ error: 'CV not found' });
    }

    cvs.splice(cvIndex, 1);

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
