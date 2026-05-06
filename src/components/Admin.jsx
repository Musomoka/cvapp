import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Admin({ onClose }) {
  const { getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [parseLogs, setParseLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data.stats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchParseLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/parse-logs?limit=200`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParseLogs(data.logs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'logs') fetchParseLogs();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchStats, fetchParseLogs, fetchUsers]);

  const handleToggleAdmin = async (userId, currentIsAdmin) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u));
      setActionMsg(`Admin status updated`);
    } catch (e) {
      setActionMsg(`Error: ${e.message}`);
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleToggleSuspend = async (userId, currentSuspended) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ suspended: !currentSuspended }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: !currentSuspended } : u));
      setActionMsg(`User ${!currentSuspended ? 'suspended' : 'unsuspended'}`);
    } catch (e) {
      setActionMsg(`Error: ${e.message}`);
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setActionMsg('User deleted');
    } catch (e) {
      setActionMsg(`Error: ${e.message}`);
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-header">
          <h2>🛡️ Admin Panel</h2>
          <button className="admin-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
          <button className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>🤖 AI Logs</button>
          <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Users</button>
        </div>

        {actionMsg && <div className="admin-action-msg">{actionMsg}</div>}
        {error && <div className="admin-error">⚠️ {error}</div>}

        <div className="admin-content">
          {loading && <div className="admin-loading">Loading...</div>}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && !loading && stats && (
            <div className="admin-dashboard">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">{stats.recentUsers}</div>
                  <div className="stat-label">New Users (7d)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalParses}</div>
                  <div className="stat-label">Total CV Parses</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">{stats.recentParses}</div>
                  <div className="stat-label">Parses (7d)</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-value">{stats.successfulParses}</div>
                  <div className="stat-label">Successful Parses</div>
                </div>
                <div className="stat-card danger">
                  <div className="stat-value">{stats.failedParses}</div>
                  <div className="stat-label">Failed Parses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalTokens.toLocaleString()}</div>
                  <div className="stat-label">Total Tokens Used</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">${stats.totalCost.toFixed(4)}</div>
                  <div className="stat-label">Total AI Cost</div>
                </div>
              </div>
            </div>
          )}

          {/* AI LOGS TAB */}
          {activeTab === 'logs' && !loading && (
            <div className="admin-logs">
              <div className="logs-header-row">
                <span className="logs-count">{parseLogs.length} entries</span>
                <button className="refresh-btn" onClick={fetchParseLogs}>↻ Refresh</button>
              </div>
              {parseLogs.length === 0 ? (
                <div className="admin-empty">No parse activity yet.</div>
              ) : (
                <div className="logs-table-wrap">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>File</th>
                        <th>Size</th>
                        <th>Chars</th>
                        <th>Tokens</th>
                        <th>Cost</th>
                        <th>Model</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseLogs.map((log, i) => (
                        <tr key={i} className={log.success ? '' : 'log-failed'}>
                          <td className="log-time">{formatDate(log.timestamp)}</td>
                          <td className="log-file" title={log.filename}>{log.filename}</td>
                          <td>{formatBytes(log.fileSize)}</td>
                          <td>{log.extractedTextLength?.toLocaleString() || '—'}</td>
                          <td>{log.estimatedTokens?.toLocaleString() || '—'}</td>
                          <td>${(log.estimatedCost || 0).toFixed(4)}</td>
                          <td>{log.model}</td>
                          <td>
                            <span className={`log-status ${log.success ? 'ok' : 'fail'}`}>
                              {log.success ? '✓ OK' : '✗ Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && !loading && (
            <div className="admin-users">
              <div className="logs-header-row">
                <span className="logs-count">{users.length} users</span>
                <button className="refresh-btn" onClick={fetchUsers}>↻ Refresh</button>
              </div>
              {users.length === 0 ? (
                <div className="admin-empty">No users yet.</div>
              ) : (
                <div className="logs-table-wrap">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className={u.suspended ? 'user-suspended' : ''}>
                          <td>{u.id}</td>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td className="log-time">{formatDate(u.createdAt)}</td>
                          <td>
                            <span className={`role-badge ${u.isAdmin ? 'admin' : 'user'}`}>
                              {u.isAdmin ? '🛡️ Admin' : '👤 User'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${u.suspended ? 'suspended' : 'active'}`}>
                              {u.suspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="user-actions">
                            <button
                              className="action-btn admin-toggle"
                              onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                              title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                            >
                              {u.isAdmin ? 'Demote' : 'Make Admin'}
                            </button>
                            <button
                              className={`action-btn ${u.suspended ? 'unsuspend' : 'suspend'}`}
                              onClick={() => handleToggleSuspend(u.id, u.suspended)}
                            >
                              {u.suspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
