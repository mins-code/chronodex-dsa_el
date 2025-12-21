import React, { useState } from 'react';
import { searchTasks } from '../api';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TaskSearch.css';

const TaskSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === '') {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchTasks(value);
      setResults(searchResults || []);
    } catch (error) {
      console.error('Error searching tasks:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (taskId, taskTitle) => {
    navigate(`/task/${taskId}`);
  };

  return (
    <div className="task-search-container">
      <h2>Search Tasks</h2>
      <div className="search-wrapper">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={query}
            onChange={handleChange}
            className="search-input"
          />
        </div>

        {/* Display search results */}
        {query.trim() !== '' && (
          <div className="search-results-container">
            {isSearching ? (
              <div className="search-loading">Searching...</div>
            ) : results.length > 0 ? (
              <ul className="search-results">
                {results.map((task) => (
                  <li
                    key={task._id}
                    className="search-result-item"
                    onClick={() => handleResultClick(task._id, task.title)}
                  >
                    <strong>{task.title}</strong>
                    <span className="result-priority">{task.priority}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="search-no-results">No tasks found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSearch;