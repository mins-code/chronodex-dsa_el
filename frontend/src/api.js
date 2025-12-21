import axios from 'axios';

// Create an Axios instance with the base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend API base URL
});

// Fetch all tasks
export const getTasks = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Fetch tasks in priority order (Min-Heap)
export const getPriorityTasks = async () => {
  try {
    const response = await api.get('/tasks/priority');
    return response.data;
  } catch (error) {
    console.error('Error fetching priority tasks:', error);
    throw error;
  }
};

// Create a new task
export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Mark a task as completed (Graph)
export const completeTask = async (id) => {
  try {
    const response = await api.patch(`/tasks/${id}/complete`);
    return response.data;
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
};

// Search for tasks (Trie)
export const searchTasks = async (query) => {
  try {
    const response = await api.get(`/tasks/search?q=${query}`);
    return response.data;
  } catch (error) {
    console.error('Error searching tasks:', error);
    throw error;
  }
};

// Undo the last deleted task (Stack)
export const undoDelete = async () => {
  try {
    const response = await api.post('/tasks/undo');
    return response.data;
  } catch (error) {
    console.error('Error undoing delete:', error);
    throw error;
  }
};

// Delete a task by ID
export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Fetch a single task by ID
export const getTaskById = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};