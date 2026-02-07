import React, { useEffect, useState } from 'react';
import { getPriorityTasks, deleteTask, undoDelete, updateTaskStatus } from '../api';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PriorityQueueView.css';

const PriorityQueueView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [undoInfo, setUndoInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const priorityTasks = await getPriorityTasks();
      // Ensure priorityTasks is an array before setting state
      setTasks(Array.isArray(priorityTasks) ? priorityTasks : []);
    } catch (error) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      setUndoInfo({ show: true, timer: null });
      // Auto-hide undo after 5 seconds
      const timer = setTimeout(() => setUndoInfo(null), 5000);
      setUndoInfo({ show: true, timer });
    } catch (error) {
      alert('Failed to delete task.');
    }
  };

  const handleUndo = async () => {
    try {
      await undoDelete();
      setUndoInfo(null);
      fetchTasks();
    } catch (error) {
      alert('Failed to undo delete.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      // Success: refresh the task list
      fetchTasks();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update task status.';
      alert(errorMessage);
    }
  };

  const handleCardClick = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  if (loading) {
    return <div className="priority-queue-view"><p>Loading tasks...</p></div>;
  }

  if (tasks.length === 0) {
    return <div className="priority-queue-view"><p>No tasks found.</p></div>;
  }

  // Sort tasks: non-completed first, completed last
  const sortedTasks = [...tasks].sort((a, b) => {
    const aCompleted = a.status === 'completed';
    const bCompleted = b.status === 'completed';
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    return 0;
  });

  // Get status display info
  const getStatusInfo = (status) => {
    const statusMap = {
      'to-do': { label: 'To Do', className: 'status-todo' },
      'in-progress': { label: 'In Progress', className: 'status-inprogress' },
      'completed': { label: 'Completed', className: 'status-completed' }
    };
    return statusMap[status] || statusMap['to-do'];
  };

  return (
    <div className="priority-queue-view">
      <div className="header-with-undo">
        <h2>All Tasks</h2>
        <button className="undo-delete-btn" onClick={handleUndo} disabled={!undoInfo?.show}>
          ↩ Undo Delete
        </button>
      </div>
      <div className="task-cards-grid">
        {sortedTasks.map((task) => {
          if (!task) return null;
          const taskStatus = task.status || 'to-do';
          const isCompleted = taskStatus === 'completed';
          const statusInfo = getStatusInfo(taskStatus);

          return (
            <button
              key={task._id}
              className={`task-card-btn priority-${task.priority}${isCompleted ? ' completed-task-card' : ''}`}
              tabIndex={0}
              onClick={() => handleCardClick(task._id)}
            >
              <div className="card-header">
                <h3 className={isCompleted ? 'completed-title' : ''}>{task.title}</h3>
                <span className={`priority-badge priority-${task.priority}`}>
                  {task.priority}
                </span>
                <select
                  className={`status-dropdown ${statusInfo.className}`}
                  value={taskStatus}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(task._id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="to-do">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <Trash2
                  className="delete-icon"
                  size={20}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(task._id);
                  }}
                  title="Delete Task"
                />
              </div>
              <p className={`card-description${isCompleted ? ' completed-text' : ''}`}>{task.description}</p>
              <div className="card-details">
                <p className={isCompleted ? 'completed-text' : ''}>
                  <strong>Priority Score:</strong>{' '}
                  {task.priorityScore ? task.priorityScore.toFixed(2) : 'N/A'}
                </p>
                <p className={isCompleted ? 'completed-text' : ''}>
                  <strong>Deadline:</strong>{' '}
                  {new Date(task.deadline).toLocaleString()}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PriorityQueueView;