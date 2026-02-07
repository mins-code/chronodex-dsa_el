import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Database, LogOut, Trash2, CheckCircle, Lock, Shuffle, Save } from 'lucide-react';
import './Settings.css';

const Settings = ({ user, onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Avatar State
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'user'}`);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarMessage, setAvatarMessage] = useState('');

    const navigate = useNavigate();

    const dataStructures = [
        { name: 'Trie (Search)', description: 'Fast task title search', status: 'Active' },
        { name: 'Max-Heap (Priority Queue)', description: 'Task prioritization', status: 'Active' },
        { name: 'Graph (Dependencies)', description: 'Task dependency tracking', status: 'Active' },
        { name: 'Stack (Undo)', description: 'Delete operation history', status: 'Active' },
        { name: 'Interval Scheduler', description: 'Conflict detection', status: 'Active' },
    ];

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleShuffleAvatar = () => {
        const randomSeed = Math.random().toString(36).substring(7);
        setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`);
        setAvatarMessage('');
    };

    const handleSaveAvatar = async () => {
        setAvatarLoading(true);
        setAvatarMessage('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5001/api/auth/update-avatar', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ avatar: avatarUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update avatar');
            }

            // Update local storage
            const updatedUser = { ...user, avatar: data.avatar };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setAvatarMessage('✓ Saved!');

            // Dispatch event to update Header immediately
            window.dispatchEvent(new Event('userAvatarUpdated'));

            // Allow user to see success message without reload
            setTimeout(() => {
                setAvatarMessage('');
            }, 3000);

        } catch (error) {
            setAvatarMessage(`✗ ${error.message}`);
        } finally {
            setAvatarLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMessage('');

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage('✗ New passwords do not match');
            return;
        }

        // Validate password length
        if (passwordData.newPassword.length < 6) {
            setPasswordMessage('✗ New password must be at least 6 characters');
            return;
        }

        setPasswordLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5001/api/auth/change-password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            setPasswordMessage('✓ Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            setPasswordMessage(`✗ ${error.message}`);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSystemReset = async () => {
        const confirmed = window.confirm(
            '⚠️ WARNING: This will permanently delete ALL tasks and reset all data structures.\\n\\nThis action cannot be undone. Are you sure you want to continue?'
        );

        if (!confirmed) return;

        setLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5001/api/tasks/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset system');
            }

            setMessage('✓ System reset successfully! All tasks cleared.');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            setMessage(`✗ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
            {/* Profile Settings Section */}
            <section className="settings-section">
                <div className="section-header">
                    <User size={24} />
                    <h2>Profile Settings</h2>
                </div>

                <div className="profile-card">
                    <div className="profile-info">
                        <div className="profile-avatar-container">
                            <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
                        </div>
                        <div className="profile-details">
                            <h3>{user?.username || 'User'}</h3>
                            <p>{user?.email || 'user@example.com'}</p>

                            <div className="avatar-actions">
                                <button onClick={handleShuffleAvatar} className="avatar-action-btn shuffle" title="Shuffle Avatar">
                                    <Shuffle size={16} />
                                    <span>Shuffle</span>
                                </button>
                                <button onClick={handleSaveAvatar} className="avatar-action-btn save" title="Save Avatar" disabled={avatarLoading}>
                                    <Save size={16} />
                                    <span>Save</span>
                                </button>
                            </div>

                            {avatarMessage && (
                                <span className={`avatar-message ${avatarMessage.startsWith('✓') ? 'success' : 'error'}`}>
                                    {avatarMessage}
                                </span>
                            )}
                        </div>
                    </div>

                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                {/* Change Password Section */}
                <div className="password-card">
                    <h3>
                        <Lock size={20} />
                        Change Password
                    </h3>

                    <form onSubmit={handlePasswordSubmit} className="password-form">
                        <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter current password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter new password"
                                minLength={6}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Confirm new password"
                                minLength={6}
                                required
                            />
                        </div>

                        {passwordMessage && (
                            <div className={`message ${passwordMessage.startsWith('✓') ? 'success' : 'error'}`}>
                                {passwordMessage}
                            </div>
                        )}

                        <button type="submit" className="password-submit-btn" disabled={passwordLoading}>
                            {passwordLoading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </section>

        </div >
    );
};

export default Settings;
