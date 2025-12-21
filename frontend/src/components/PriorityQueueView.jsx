import React, { useEffect, useState } from 'react';
import { getPriorityTasks, deleteTask, undoDelete } from '../api';
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
      setTasks(priorityTasks || []);
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

  return (
    <div className="priority-queue-view">
      <h2>All Tasks</h2>
      <div className="task-cards-grid">
        {tasks.map((task) => {
          if (!task) return null;
          return (
            <button
              key={task._id}
              className={`task-card-btn priority-${task.priority}`}
              tabIndex={0}
              onClick={() => handleCardClick(task._id)}
            >
              <div className="card-header">
                <h3>{task.title}</h3>
                <span className={`priority-badge priority-${task.priority}`}>
                  {task.priority}
                </span>
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
              <p className="card-description">{task.description}</p>
              <div className="card-details">
                <p>
                  <strong>Priority Score:</strong>{' '}
                  {task.priorityScore ? task.priorityScore.toFixed(2) : 'N/A'}
                </p>
                <p>
                  <strong>Deadline:</strong>{' '}
                  {new Date(task.deadline).toLocaleString()}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {undoInfo?.show && (
        <div className="undo-toast">
          Task deleted.
          <button className="undo-btn-inline" onClick={handleUndo}>Undo</button>
        </div>
      )}
    </div>
  );
};

export default PriorityQueueView;