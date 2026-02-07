import React, { useEffect, useState } from 'react';
import { deleteTask, undoDelete, updateTaskStatus } from '../api';
import { useTasks } from '../context/TaskContext'; // Import context
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PriorityQueueView.css';

const PriorityQueueView = () => {
  const { tasks, fetchTasks, loading, invalidateInsights } = useTasks(); // Consume context
  const [undoInfo, setUndoInfo] = useState(null);
  const navigate = useNavigate();

  // Local derived state for sorted tasks (if we want client-side sorting/filtering)
  // But context tasks are already sorted by priorityScore from backend.
  // We just need to filter completed/pending if we want specific view.
  // The original view showed all tasks, sorted pending first.

  // This useEffect handles the undo timer cleanup
  useEffect(() => {
    fetchTasks();

    if (undoInfo?.timer) {
      return () => clearTimeout(undoInfo.timer);
    }
  }, [undoInfo, fetchTasks]); // Added fetchTasks to dependency array

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      fetchTasks(); // Refresh context
      setUndoInfo({ show: true, timer: null });
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
      fetchTasks(); // Refresh context
    } catch (error) {
      alert('Failed to undo delete.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      fetchTasks(); // Refresh context

      // Invalidate insights when task is completed
      if (newStatus === 'completed' && invalidateInsights) {
        invalidateInsights();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update task status.';
      alert(errorMessage);
    }
  };

  const handleCardClick = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  if (loading && tasks.length === 0) {
    return <div className="priority-queue-view"><p>Loading tasks...</p></div>;
  }

  if (tasks.length === 0) {
    return <div className="priority-queue-view"><p>No tasks found.</p></div>;
  }

  // Sort tasks: non-completed first, completed last
  // (Context tasks are sorted by priorityScore, but mix completed/pending)
  const sortedTasks = [...tasks].sort((a, b) => {
    const aCompleted = a.status === 'completed';
    const bCompleted = b.status === 'completed';
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    // If both pending or both completed, keep original order (priorityScore)
    return 0;
  });

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
                  {task.priorityScore !== undefined && task.priorityScore !== null ? task.priorityScore.toFixed(2) : 'N/A'}
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