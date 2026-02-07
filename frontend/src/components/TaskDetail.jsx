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

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5001/api/tasks/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTask(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching task:', err);
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
