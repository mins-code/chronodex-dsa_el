import React, { useState } from 'react';
import { createTask } from '../api';
import { Calendar, Clock, AlertCircle, FileText, Edit } from 'lucide-react';
import './TaskForm.css';

const TaskForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'Medium',
    duration: '',
  });

  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setWarning(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await createTask(formData);

      // Success - clear the form
      setSuccessMessage(`✓ Task "${formData.title}" created successfully!`);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'Medium',
        duration: '',
      });
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error creating task:', error);

      // Check if it's a 409 Conflict error
      if (error.response && error.response.status === 409) {
        setWarning('This time slot is already taken. Please choose another time.');
        // Do NOT clear form fields - user can adjust and try again
      } else {
        // Other errors
        const errorMessage = error.response?.data?.error || 'Failed to create task. Please try again.';
        setWarning(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-form-container">
      <form className="task-form" onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">
            <Edit size={18} /> Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter task title"
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">
            <FileText size={18} /> Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter task description"
            rows="4"
          />
        </div>

        {/* Deadline */}
        <div className="form-group">
          <label htmlFor="deadline">
            <Calendar size={18} /> Deadline <span className="required">*</span>
          </label>
          <input
            type="datetime-local"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
          />
        </div>

        {/* Priority */}
        <div className="form-group">
          <label htmlFor="priority">
            <AlertCircle size={18} /> Priority <span className="required">*</span>
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Duration */}
        <div className="form-group">
          <label htmlFor="duration">
            <Clock size={18} /> Duration (minutes) <span className="required">*</span>
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Enter duration in minutes"
            min="1"
            required
          />
        </div>

        {/* Warning Message */}
        {warning && <div className="warning-message">{warning}</div>}

        {/* Success Message */}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;