import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TaskSearch from './components/TaskSearch';
import PriorityQueueView from './components/PriorityQueueView';
import TaskForm from './components/TaskForm';
import DependencyGraphView from './components/DependencyGraphView';
import TaskDetailCard from './components/TaskDetailCard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-layout">
        {/* Sidebar */}
        <Sidebar />

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
    </Router>
  );
}

export default App;