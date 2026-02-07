import React, { useEffect, useState } from 'react';
import Header from './Header';
import TaskDistributionGraph from './TaskDistributionGraph';
import TaskSearch from './TaskSearch';
import PriorityQueueView from './PriorityQueueView';
import { useTasks } from '../context/TaskContext';
import './Dashboard.css';
import { getEfficiencyAnalytics } from '../api';
import { calculateDayLoad, getTasksForDate } from '../utils/taskUtils';

const Dashboard = ({ user, onLogout }) => {
  const { tasks, fetchTasks } = useTasks(); // Consume context
  const [mostUrgentTask, setMostUrgentTask] = useState(null);
  const [dailyPendingCount, setDailyPendingCount] = useState(0);
  const [forecast, setForecast] = useState([]);

  // Refresh tasks on mount to ensure fresh data
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Calculate Forecast & Daily Stats
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

    // 3. Calculate Focus Load Forecast (Today, Tomorrow, Next Day)
    const calculateForecast = async () => {
      let multiplier = 1.1;
      try {
        // We fetch this here to ensure dashboard is accurate. 
        // In a real app we might cache this or put it in context.
        const effData = await getEfficiencyAnalytics();
        multiplier = effData.efficiencyMultiplier || 1.1;
      } catch (e) {
        // Silent fail, use default
      }

      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const nextDay = new Date(today); nextDay.setDate(today.getDate() + 2);

      const days = [
        { label: 'Today', date: today },
        { label: 'Tomorrow', date: tomorrow },
        { label: 'Next Day', date: nextDay }
      ];

      const newForecast = days.map(d => {
        const dayTasks = getTasksForDate(tasks, d.date); // Use tasks from context (includes all)
        // Note: calculateDayLoad expects ALL tasks for the day and filters completed internally if needed,
        // or we pass just active? `calculateDayLoad` in utils filters `t.status !== 'completed'`.
        // So we pass all dayTasks.
        const stats = calculateDayLoad(dayTasks, multiplier);
        return { label: d.label, stats };
      });

      setForecast(newForecast);
    };

    calculateForecast();

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
          <TaskDistributionGraph forecast={forecast} />
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