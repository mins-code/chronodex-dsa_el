import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, AlertCircle, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import './TaskDetail.css';



const TaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bottleneckData, setBottleneckData] = useState(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fetch Task
                const response = await axios.get(`http://localhost:5001/api/tasks/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTask(response.data);

                // Fetch Bottlenecks to check if this task is one
                // (Optimally this would be part of task details, but separate fetch is fine for now)
                const bottleneckResponse = await axios.get('http://localhost:5001/api/tasks/bottlenecks', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const found = bottleneckResponse.data.find(b => b.taskId === id);
                if (found) {
                    setBottleneckData(found);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching task/bottlenecks:', err);
                setError('Failed to load task details');
                setLoading(false);
            }
        };

        fetchTask();
    }, [id]);

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'critical':
                return '#8B4545';
            case 'high':
                return '#B8733D';
            case 'medium':
                return '#9B8B3D';
            case 'low':
                return '#4A6B8A';
            default:
                return '#6B7280';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="task-detail-container">
                <div className="task-detail-loading">Loading task details...</div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="task-detail-container">
                <div className="task-detail-error">
                    <AlertCircle size={48} />
                    <p>{error || 'Task not found'}</p>
                    <button onClick={() => navigate('/calendar')} className="back-btn">
                        Back to Calendar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="task-detail-container">
            <div className="task-detail-card">
                {/* Header */}
                <div className="task-detail-header">
                    <button onClick={() => navigate('/calendar')} className="back-button">
                        <ArrowLeft size={20} />
                        <span>Back to Calendar</span>
                    </button>
                    <div className="task-detail-actions">
                        {/* Actions removed as requested */}
                    </div>
                </div>

                {/* Title */}
                <h1 className="task-detail-title">{task.title}</h1>

                {/* Dependency Impact Analysis (Bottleneck Warning) */}
                {bottleneckData && (
                    <div className="impact-analysis-card">
                        <div className="impact-header">
                            <AlertCircle color="#ef4444" size={20} />
                            <h3>Dependency Impact Analysis</h3>
                        </div>
                        <p className="impact-summary">
                            This task is a critical bottleneck. Completing it will unblock <strong>{bottleneckData.blockedCount} tasks</strong> in your workflow.
                        </p>
                        <div className="blocked-tasks-list">
                            <span className="blocked-label">Delays:</span>
                            {bottleneckData.blockedTasks.map((t, idx) => (
                                <span key={idx} className="blocked-task-chip">{t.title}</span>
                            ))}
                            {bottleneckData.blockedCount > 3 && <span className="blocked-more">+{bottleneckData.blockedCount - 3} more</span>}
                        </div>
                    </div>
                )}

                {/* Priority Badge */}
                <div className="task-detail-meta">
                    <span
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                        {task.priority || 'Medium'}
                    </span>
                    <span className={`status-badge status-${task.status}`}>
                        {task.status || 'to-do'}
                    </span>
                </div>

                {/* Description */}
                {task.description && (
                    <div className="task-detail-section">
                        <h3 className="section-title">Description</h3>
                        <p className="task-description">{task.description}</p>
                    </div>
                )}

                {/* Details Grid */}
                <div className="task-detail-grid">
                    <div className="detail-item">
                        <div className="detail-icon">
                            <Calendar size={20} />
                        </div>
                        <div className="detail-content">
                            <span className="detail-label">Deadline</span>
                            <span className="detail-value">{formatDate(task.deadline)}</span>
                        </div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-icon">
                            <Clock size={20} />
                        </div>
                        <div className="detail-content">
                            <span className="detail-label">Duration</span>
                            <span className="detail-value">
                                {task.duration ? `${task.duration} minutes` : 'Not set'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="task-detail-footer">
                    <span className="footer-text">
                        Created: {formatDate(task.createdAt)}
                    </span>
                    {task.updatedAt && task.updatedAt !== task.createdAt && (
                        <span className="footer-text">
                            Updated: {formatDate(task.updatedAt)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;
