import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TaskSearch from './components/TaskSearch';
import PriorityQueueView from './components/PriorityQueueView';
import TaskForm from './components/TaskForm';
import DependencyGraphView from './components/DependencyGraphView';
import Notifications from './components/Notifications';
import TaskDistributionGraph from './components/TaskDistributionGraph';
import TaskDetailCard from './components/TaskDetailCard';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import SettingsPage from './components/SettingsPage';
import Planner from './components/Planner';
import CalendarView from './components/CalendarView';
import TaskDetail from './components/TaskDetail';
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
                <Sidebar />

                {/* Main Content */}
                <div className="main-content">


                  <Routes>
                    {/* Dashboard Route */}
                    <Route
                      path="/"
                      element={<Dashboard user={user} onLogout={handleLogout} />}
                    />

                    {/* Calendar Route */}
                    <Route
                      path="/calendar"
                      element={
                        <div className="calendar-page">
                          <CalendarView />
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

                    {/* Notifications Route */}
                    <Route
                      path="/notifications"
                      element={
                        <div className="notifications">
                          <h2>Notifications</h2>
                          <Notifications />
                        </div>
                      }
                    />

                    {/* Planner Route */}
                    <Route
                      path="/planner"
                      element={
                        <div className="planner-page">
                          <h2>Task Planner</h2>
                          <Planner />
                        </div>
                      }
                    />

                    {/* Settings Route */}
                    <Route
                      path="/settings"
                      element={<SettingsPage user={user} onLogout={handleLogout} />}
                    />

                    {/* Task Detail Route */}
                    <Route path="/task/:id" element={<TaskDetailCard />} />
                    <Route path="/tasks/:id" element={<TaskDetail />} />
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