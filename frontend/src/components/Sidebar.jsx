import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, GitBranch, Settings, LogOut, User } from 'lucide-react';
import { undoDelete } from '../api';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  // Handle the "Global Undo" button click
  const handleUndo = async () => {
    try {
      const response = await undoDelete();
      alert(`Undo successful: Task "${response.task.title}" restored.`);
      window.location.reload(); // Refresh to sync UI with restored data
    } catch (error) {
      console.error('Error performing undo:', error);
      alert('Failed to undo. The undo stack might be empty.');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">
            <User size={24} />
          </div>
          <div className="user-info">
            <p className="user-name">{user.username}</p>
            <p className="user-email">{user.email}</p>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <LayoutDashboard size={20} className="sidebar-icon" />
          Dashboard
        </NavLink>
        <NavLink to="/create" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <PlusCircle size={20} className="sidebar-icon" />
          Create Task
        </NavLink>
        <NavLink to="/dependencies" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <GitBranch size={20} className="sidebar-icon" />
          Dependencies
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <Settings size={20} className="sidebar-icon" />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="undo-btn" onClick={handleUndo}>
          ↩ Undo Last Delete
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;