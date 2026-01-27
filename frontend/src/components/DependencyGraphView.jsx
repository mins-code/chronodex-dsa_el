import React, { useEffect, useState } from 'react';
import { getTasks, completeTask } from '../api';
import './DependencyGraphView.css';

const DependencyGraphView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dependent, setDependent] = useState('');
  const [prerequisite, setPrerequisite] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await getTasks();
      setTasks(response.tasks || []);
    } catch (error) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Add dependency by updating the dependent task's prerequisites
  const handleAddDependency = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!dependent || !prerequisite) {
      setAddError('Please select both tasks.');
      return;
    }
    if (dependent === prerequisite) {
      setAddError('A task cannot depend on itself.');
      return;
    }
    try {
      // Find the dependent task
      const depTask = tasks.find((t) => t._id === dependent);
      if (!depTask) return;
      // Avoid duplicate prerequisites
      const newPrereqs = depTask.prerequisites
        ? Array.from(new Set([...depTask.prerequisites, prerequisite]))
        : [prerequisite];
      // Update the task in the backend
      await fetch(`http://localhost:5001/api/tasks/${dependent}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prerequisites: newPrereqs }),
      });
      setAddSuccess('Dependency added!');
      setDependent('');
      setPrerequisite('');
      fetchTasks();
    } catch (err) {
      setAddError('Failed to add dependency.');
    }
  };

  // Handle completing a task with proper error handling
  const handleCompleteTask = async (taskId, isBlocked, prereqTask) => {
    if (isBlocked) {
      alert(`Cannot complete task: Prerequisites not finished.\nPlease complete "${prereqTask?.title || 'prerequisite task'}" first.`);
      return;
    }

    try {
      await completeTask(taskId);
      // Success: refresh the task list to show updated statuses
      fetchTasks();
    } catch (error) {
      // Show error message from backend (Graph DS validation)
      const errorMessage = error.response?.data?.error || 'Failed to complete task.';
      alert(errorMessage);
    }
  };

  // Tasks with prerequisites
  const tasksWithPrereqs = tasks.filter((task) => task.prerequisites && task.prerequisites.length > 0);

  return (
    <div className="dependency-graph-view">
      {/* Add Dependency Form */}
      <form className="add-dependency-form" onSubmit={handleAddDependency}>
        <label>
          Dependent Task:
          <select value={dependent} onChange={e => setDependent(e.target.value)}>
            <option value="">Select</option>
            {tasks.map(task => (
              <option key={task._id} value={task._id}>{task.title}</option>
            ))}
          </select>
        </label>
        <label>
          Prerequisite Task:
          <select value={prerequisite} onChange={e => setPrerequisite(e.target.value)}>
            <option value="">Select</option>
            {tasks.map(task => (
              <option key={task._id} value={task._id}>{task.title}</option>
            ))}
          </select>
        </label>
        <button type="submit">Add Dependency</button>
      </form>
      {addError && <div className="dep-error">{addError}</div>}
      {addSuccess && <div className="dep-success">{addSuccess}</div>}

      {/* Dependency Cards */}
      <div className="dependency-cards">
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasksWithPrereqs.length === 0 ? (
          <p>No tasks with dependencies found.</p>
        ) : (
          tasksWithPrereqs.map((task) => {
            return task.prerequisites.map((prereqId) => {
              const prereqTask = tasks.find((t) => t._id === prereqId);
              const isBlocked = prereqTask && prereqTask.status !== 'completed';
              const isCompleted = task.status === 'completed';

              return (
                <div className="dependency-card" key={task._id + '-' + prereqId}>
                  <div className="dep-card-content">
                    <div>
                      <span className={`dep-task${isCompleted ? ' completed-task' : ''}`}>{task.title}</span>
                      <span className="dep-arrow">depends on</span>
                      <span className="dep-prereq">{prereqTask ? prereqTask.title : 'Unknown Task'}</span>
                      {isBlocked && <span className="blocked-badge">BLOCKED</span>}
                      {isCompleted && <span className="completed-badge">COMPLETED</span>}
                    </div>
                  </div>
                  <button
                    className={`dep-complete-btn${isBlocked ? ' blocked' : ''}${isCompleted ? ' completed' : ''}`}
                    onClick={() => handleCompleteTask(task._id, isBlocked, prereqTask)}
                    disabled={isCompleted}
                  >
                    {isCompleted ? 'Done' : isBlocked ? 'Blocked' : 'Complete'}
                  </button>
                </div>
              );
            });
          })
        )}
      </div>
    </div>
  );
};

export default DependencyGraphView;