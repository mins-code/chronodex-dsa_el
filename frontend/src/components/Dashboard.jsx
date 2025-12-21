import React, { useEffect, useState } from 'react';
import TaskSearch from './TaskSearch';
import PriorityQueueView from './PriorityQueueView';
import { getPriorityTasks } from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const [mostUrgentTask, setMostUrgentTask] = useState(null);

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

    fetchMostUrgentTask();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-summary">
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

      <TaskSearch />
      <PriorityQueueView />
    </div>
  );
};

export default Dashboard;