import React from 'react';
import Settings from './Settings';

const SettingsPage = ({ user, onLogout }) => {
    return (
        <div className="settings-page">
            <div className="page-header">
                <h2>App Settings</h2>
                <p className="page-description">
                    Manage your account and monitor the ChronoDeX DSA engine performance.
                </p>
            </div>
            <Settings user={user} onLogout={onLogout} />
        </div>
    );
};

export default SettingsPage;
