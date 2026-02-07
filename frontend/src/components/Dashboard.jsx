import React, { useEffect, useState } from 'react';
import Header from './Header';
import TaskDistributionGraph from './TaskDistributionGraph';
import TaskSearch from './TaskSearch';
import PriorityQueueView from './PriorityQueueView';
import { useTasks } from '../context/TaskContext'; // Import context
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const { tasks, fetchTasks } = useTasks(); // Consume context
  const [mostUrgentTask, setMostUrgentTask] = useState(null);
  const [dailyPendingCount, setDailyPendingCount] = useState(0);

  // Refresh tasks on mount to ensure fresh data
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!tasks) return;

    // 1. Find Most Urgent Task
    // Filter out completed tasks
    const pendingTasks = tasks.filter(t => t.status !== 'completed');

    // Backend sorts by priorityScore, so pendingTasks[0] is the most urgent
    if (pendingTasks.length > 0) {
      setMostUrgentTask(pendingTasks[0]);
    } else {
      setMostUrgentTask(null);
    }

    // 2. Calculate Daily Pending Count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingToday = pendingTasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    setDailyPendingCount(pendingToday.length);

  }, [tasks]);

  return (
    <div className="dashboard">
      <Header onLogout={onLogout} />
      <div className="hero-section">
        <h1 className="hero-heading">ChronoDeX</h1>
        <p className="welcome-message">Welcome back, {user?.username || 'Traveler'}!</p>
        <div className="pending-tasks-text">
          {dailyPendingCount === 0
            ? "0 pending tasks for today"
            : `You have ${dailyPendingCount} pending tasks for today`}
        </div>
        <div className="scanning-line"></div>
      </div>
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