import React, { useEffect, useState } from 'react';
import TaskDistributionGraph from './TaskDistributionGraph';
import TaskSearch from './TaskSearch';
import PriorityQueueView from './PriorityQueueView';
import { getPriorityTasks, getTasks } from '../api';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [mostUrgentTask, setMostUrgentTask] = useState(null);

  const [dailyPendingCount, setDailyPendingCount] = useState(0);

  useEffect(() => {
    const fetchMostUrgentTask = async () => {
      try {
        const priorityTasks = await getPriorityTasks();
        if (priorityTasks && priorityTasks.length > 0) {
          setMostUrgentTask(priorityTasks[0]);
        }
      } catch (error) {
        console.error('Error fetching priority tasks:', error);
      }
    };

    const fetchDailyTasks = async () => {
      try {
        const response = await getTasks();
        const allTasks = response.tasks || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pendingToday = allTasks.filter(task => {
          if (task.status === 'completed') return false;

          const taskDate = new Date(task.deadline);
          taskDate.setHours(0, 0, 0, 0);

          return taskDate.getTime() === today.getTime();
        });

        setDailyPendingCount(pendingToday.length);
      } catch (error) {
        console.error('Error fetching daily tasks:', error);
      }
    };

    fetchMostUrgentTask();
    fetchDailyTasks();
  }, []);

  return (
    <div className="dashboard">
      <header className="app-header">
        <div className="title-group">
          <h1 className="gradient-text">ChronoDeX</h1>
          <p className="welcome-message">Welcome back, {user?.username || 'Traveler'}!</p>
          <div style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {dailyPendingCount === 0
              ? "0 pending tasks for today"
              : `You have ${dailyPendingCount} pending tasks for today`}
          </div>
        </div>
      </header>
      <div className="dashboard-summary">
        <div className="glass-tile">
          {mostUrgentTask ? (
            <div className="most-urgent-card">
              <h3>🔴 Most Urgent Task</h3>
              <p><strong>{mostUrgentTask.title}</strong></p>
              <p className={`priority-label priority-${mostUrgentTask.priority}`}>
                {mostUrgentTask.priority} Priority
              </p>
              <p>Deadline: {new Date(mostUrgentTask.deadline).toLocaleString()}</p>
            </div>
          ) : (
            <div className="most-urgent-card empty">
              <p>No tasks found. Create your first task!</p>
            </div>
          )}
        </div>

        <div className="glass-tile">
          <TaskDistributionGraph />
        </div>
      </div>

      <div className="glass-tile">
        <TaskSearch />
      </div>

      <div className="glass-tile">
        <PriorityQueueView />
      </div>
    </div>
  );
};

export default Dashboard;