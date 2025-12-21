import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTaskById } from '../api';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import './TaskDetailCard.css';

const TaskDetailCard = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(id);
        setTask(data);
      } catch (error) {
        setTask(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  if (loading) return <div className="task-detail-center"><p>Loading...</p></div>;
  if (!task) return <div className="task-detail-center"><p>Task not found.</p></div>;

  return (
    <div className="task-detail-center">
      <div className={`task-detail-card priority-${task.priority}`}>
        <h2>{task.title}</h2>
        <p>{task.description}</p>
        <div className="task-detail-info">
          <span><AlertCircle size={18} /> {task.priority}</span>
          <span><Calendar size={18} /> {new Date(task.deadline).toLocaleString()}</span>
          <span><Clock size={18} /> {task.duration} min</span>
        </div>
        <div className="task-detail-score">
          <strong>Priority Score:</strong> {task.priorityScore ? task.priorityScore.toFixed(2) : 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailCard;