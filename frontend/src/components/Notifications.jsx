import React, { useEffect, useState } from 'react';
import { getRecentCreations, getUpcomingDeadlines, getRecentCompletions } from '../api';
import { Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const [recentCreations, setRecentCreations] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentCompletions, setRecentCompletions] = useState([]);
  const [loading, setLoading] = useState({ creations: true, deadlines: true, completions: true });

  const fetchNotifications = async () => {
    try {
      // Fetch all notification data in parallel
      const [creations, deadlines, completions] = await Promise.all([
        getRecentCreations(),
        getUpcomingDeadlines(),
        getRecentCompletions()
      ]);

      setRecentCreations(creations);
      setUpcomingDeadlines(deadlines);
      setRecentCompletions(completions);
      setLoading({ creations: false, deadlines: false, completions: false });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading({ creations: false, deadlines: false, completions: false });
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date - now;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 0) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return `In ${diffInHours} hours`;
    } else if (diffInDays < 7) {
      return `In ${diffInDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority?.toLowerCase() || 'low'}`;
  };

  const renderTaskCard = (task, type) => (
    <div key={task._id} className={`notification-card ${type}`}>
      <div className="card-header">
        <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
          {task.priority || 'Low'}
        </span>
        {type === 'deadline' && (
          <span className="time-indicator">{formatDate(task.deadline)}</span>
        )}
        {type === 'creation' && (
          <span className="time-indicator">{getTimeAgo(task.createdAt)}</span>
        )}
        {type === 'completion' && (
          <span className="time-indicator">{getTimeAgo(task.updatedAt)}</span>
        )}
      </div>
      <h3 className="task-title">{task.title}</h3>
      {task.description && (
        <p className="task-description">{task.description.substring(0, 80)}{task.description.length > 80 ? '...' : ''}</p>
      )}
      <div className="card-footer">
        <span className="deadline-info">
          <Calendar size={14} />
          {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        {task.duration && (
          <span className="duration-info">
            <Clock size={14} />
            {task.duration} min
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="notifications-container">
      <div className="notifications-grid">
        {/* Column 1: Recent Creations */}
        <div className="notification-column">
          <div className="column-header creations">
            <AlertCircle size={20} />
            <h2>Recent Creations</h2>
            <span className="count">{recentCreations.length}</span>
          </div>
          <div className="cards-container">
            {loading.creations ? (
              <div className="loading-state">Loading...</div>
            ) : recentCreations.length === 0 ? (
              <div className="empty-state">No recent tasks created</div>
            ) : (
              recentCreations.map(task => renderTaskCard(task, 'creation'))
            )}
          </div>
        </div>

        {/* Column 2: Upcoming Deadlines */}
        <div className="notification-column">
          <div className="column-header deadlines">
            <Clock size={20} />
            <h2>Upcoming Deadlines</h2>
            <span className="count">{upcomingDeadlines.length}</span>
          </div>
          <div className="cards-container">
            {loading.deadlines ? (
              <div className="loading-state">Loading...</div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="empty-state">No upcoming deadlines</div>
            ) : (
              upcomingDeadlines.map(task => renderTaskCard(task, 'deadline'))
            )}
          </div>
        </div>

        {/* Column 3: Recent Completions */}
        <div className="notification-column">
          <div className="column-header completions">
            <CheckCircle size={20} />
            <h2>Recent Completions</h2>
            <span className="count">{recentCompletions.length}</span>
          </div>
          <div className="cards-container">
            {loading.completions ? (
              <div className="loading-state">Loading...</div>
            ) : recentCompletions.length === 0 ? (
              <div className="empty-state">No completed tasks yet</div>
            ) : (
              recentCompletions.map(task => renderTaskCard(task, 'completion'))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
