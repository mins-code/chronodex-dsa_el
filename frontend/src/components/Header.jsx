import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import './Header.css';

const Header = ({ onLogout }) => {
    const navigate = useNavigate();

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.username || 'User';
    const userEmail = user.email || '';

    // Get first letter for avatar
    const avatarLetter = userName.charAt(0).toUpperCase();

    const handleSettings = () => {
        navigate('/settings');
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            // Fallback if onLogout not provided
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    return (
        <header className="header">
            <div className="header-right">
                {/* User Avatar and Name */}
                <div className="header-user">
                    <div className="header-avatar">{avatarLetter}</div>
                    <div className="header-user-info">
                        <span className="header-username">{userName}</span>
                        {userEmail && <span className="header-email">{userEmail}</span>}
                    </div>
                </div>

                {/* Settings Icon */}
                <button className="header-icon-btn" onClick={handleSettings} title="Settings">
                    <Settings size={20} />
                </button>

                {/* Logout Button */}
                <button className="header-logout-btn" onClick={handleLogout} title="Logout">
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
