import express from 'express';
import { authenticateToken, loadUsers, saveUsers } from './auth.js';
import { loadParseLogs } from '../dataStore.js';

const router = express.Router();

// Middleware: admin only
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/admin/stats — dashboard summary
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { users } = loadUsers();
    const logs = loadParseLogs();

    const totalUsers = users.length;
    const totalParses = logs.length;
    const successfulParses = logs.filter(l => l.success).length;
    const failedParses = logs.filter(l => !l.success).length;
    const totalCost = logs.reduce((sum, l) => sum + (l.estimatedCost || 0), 0);
    const totalTokens = logs.reduce((sum, l) => sum + (l.estimatedTokens || 0), 0);

    // Parses in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentParses = logs.filter(l => l.timestamp >= sevenDaysAgo).length;

    // New users in last 7 days
    const recentUsers = users.filter(u => u.createdAt >= sevenDaysAgo).length;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalParses,
        successfulParses,
        failedParses,
        totalCost: parseFloat(totalCost.toFixed(4)),
        totalTokens,
        recentParses,
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/parse-logs — AI parse activity log
router.get('/parse-logs', authenticateToken, requireAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = loadParseLogs().slice(0, limit);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Admin parse-logs error:', error);
    res.status(500).json({ error: 'Failed to fetch parse logs' });
  }
});

// GET /api/admin/users — list all users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { users } = loadUsers();
    const safeUsers = users.map(({ password: _, ...u }) => u);
    res.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id — toggle admin or suspend a user
router.patch('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isAdmin, suspended } = req.body;

    // Prevent self-modification
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own account' });
    }

    const store = loadUsers();
    const user = store.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;
    if (typeof suspended === 'boolean') user.suspended = suspended;

    saveUsers(store);
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id — delete a user
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const store = loadUsers();
    const idx = store.users.findIndex(u => u.id === userId);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    store.users.splice(idx, 1);
    saveUsers(store);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
