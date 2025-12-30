import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TaskSearch from './components/TaskSearch';
import PriorityQueueView from './components/PriorityQueueView';
import TaskForm from './components/TaskForm';
import DependencyGraphView from './components/DependencyGraphView';
import TaskDetailCard from './components/TaskDetailCard';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/" replace /> : <Signup onLogin={handleLogin} />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="app-layout">
                {/* Sidebar */}
                <Sidebar user={user} onLogout={handleLogout} />

                {/* Main Content */}
                <div className="main-content">
                  <header className="app-header">
                    <div className="title-group">
                      <h1>ChronoDeX</h1>
                      <p className="subtitle">Smart Calendar Using Data Structures and Algorithms</p>
                    </div>
                  </header>

                  <Routes>
                    {/* Dashboard Route */}
                    <Route
                      path="/"
                      element={
                        <div className="dashboard">
                          <TaskSearch />
                          <PriorityQueueView />
                        </div>
                      }
                    />

                    {/* Create Task Route */}
                    <Route
                      path="/create"
                      element={
                        <div className="create-task">
                          <h2>Create Task</h2>
                          <TaskForm />
                        </div>
                      }
                    />

                    {/* Dependency View Route */}
                    <Route
                      path="/dependencies"
                      element={
                        <div className="dependencies">
                          <h2>Dependency View</h2>
                          <DependencyGraphView />
                        </div>
                      }
                    />

                    {/* Settings Route */}
                    <Route
                      path="/settings"
                      element={
                        <div className="settings">
                          <h2>Settings</h2>
                          <p>Settings coming soon...</p>
                        </div>
                      }
                    />

                    {/* Task Detail Route */}
                    <Route path="/task/:id" element={<TaskDetailCard />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;