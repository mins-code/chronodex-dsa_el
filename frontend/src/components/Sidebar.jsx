import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, PlusCircle, GitBranch, Bell, Workflow } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="app-name">ChronoDeX</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <LayoutDashboard size={20} className="sidebar-icon" />
          Dashboard
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <Calendar size={20} className="sidebar-icon" />
          Calendar
        </NavLink>
        <NavLink to="/create" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <PlusCircle size={20} className="sidebar-icon" />
          Create Task
        </NavLink>
        <NavLink to="/dependencies" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <GitBranch size={20} className="sidebar-icon" />
          Dependencies
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <Bell size={20} className="sidebar-icon" />
          Notifications
        </NavLink>
        <NavLink to="/planner" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <Workflow size={20} className="sidebar-icon" />
          Planner
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;