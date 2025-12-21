import React from 'react';
import { NavLink } from 'react-router-dom'; // Import NavLink for routing
import { LayoutDashboard, PlusCircle, GitBranch, Settings } from 'lucide-react'; // Import icons
import { undoDelete } from '../api'; // Import undoDelete function
import './Sidebar.css'; // Import CSS for styling

const Sidebar = () => {
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

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" className="sidebar-link" activeClassName="active">
          <LayoutDashboard size={20} className="sidebar-icon" />
          Dashboard
        </NavLink>
        <NavLink to="/create" className="sidebar-link" activeClassName="active">
          <PlusCircle size={20} className="sidebar-icon" />
          Create Task
        </NavLink>
        <NavLink to="/dependencies" className="sidebar-link" activeClassName="active">
          <GitBranch size={20} className="sidebar-icon" />
          Dependencies
        </NavLink>
        <NavLink to="/settings" className="sidebar-link" activeClassName="active">
          <Settings size={20} className="sidebar-icon" />
          Settings
        </NavLink>
      </nav>
      <button className="undo-btn" onClick={handleUndo}>
        ↩ Undo Last Delete
      </button>
    </div>
  );
};

export default Sidebar;