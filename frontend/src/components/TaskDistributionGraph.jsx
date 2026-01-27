import React, { useEffect, useState } from 'react';
import { getTaskDistribution } from '../api';
import { Calendar, TrendingUp } from 'lucide-react';
import './TaskDistributionGraph.css';

const TaskDistributionGraph = () => {
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(0);

  const fetchDistribution = async () => {
    try {
      const data = await getTaskDistribution(14);
      setDistribution(data);
      
      // Calculate max count for scaling
      const max = Math.max(...Object.values(data).map(d => d.total), 1);
      setMaxCount(max);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching distribution:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDistribution, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  if (loading) {
    return (
      <div className="distribution-graph loading">
        <div className="graph-header">
          <TrendingUp size={20} />
          <h3>Task Distribution</h3>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="distribution-graph">
      <div className="graph-header">
        <TrendingUp size={20} />
        <h3>Task Distribution - Next 14 Days</h3>
        <Calendar size={18} />
      </div>
      
      <div className="graph-container">
        <div className="y-axis">
          <span className="y-label">{maxCount}</span>
          <span className="y-label">{Math.ceil(maxCount / 2)}</span>
          <span className="y-label">0</span>
        </div>
        
        <div className="bars-container">
          {Object.entries(distribution).map(([date, counts]) => {
            const percentage = maxCount > 0 ? (counts.total / maxCount) * 100 : 0;
            const isCurrentDay = isToday(date);
            
            // Calculate color segments
            const criticalPercent = (counts.critical / counts.total) * 100 || 0;
            const highPercent = (counts.high / counts.total) * 100 || 0;
            const mediumPercent = (counts.medium / counts.total) * 100 || 0;
            const lowPercent = (counts.low / counts.total) * 100 || 0;
            
            return (
              <div 
                key={date} 
                className={`bar-wrapper ${isCurrentDay ? 'today' : ''}`}
              >
                <div 
                  className="bar"
                  style={{ 
                    height: `${percentage}%`,
                    background: counts.total > 0 
                      ? `linear-gradient(to top,
                          #6b7280 0%,
                          #6b7280 ${lowPercent}%,
                          #60a5fa ${lowPercent}%,
                          #60a5fa ${lowPercent + mediumPercent}%,
                          #fbbf24 ${lowPercent + mediumPercent}%,
                          #fbbf24 ${lowPercent + mediumPercent + highPercent}%,
                          #ef4444 ${lowPercent + mediumPercent + highPercent}%,
                          #ef4444 100%)`
                      : '#374151'
                  }}
                >
                  <div className="tooltip">
                    <strong>{formatDate(date)}</strong>
                    <div>Total: {counts.total}</div>
                    {counts.critical > 0 && <div className="critical">Critical: {counts.critical}</div>}
                    {counts.high > 0 && <div className="high">High: {counts.high}</div>}
                    {counts.medium > 0 && <div className="medium">Medium: {counts.medium}</div>}
                    {counts.low > 0 && <div className="low">Low: {counts.low}</div>}
                  </div>
                  {counts.total > 0 && <span className="count">{counts.total}</span>}
                </div>
                <div className="bar-label">
                  <div className="day-name">{getDayName(date)}</div>
                  <div className="date">{formatDate(date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-color critical"></span>
          <span>Critical</span>
        </div>
        <div className="legend-item">
          <span className="legend-color high"></span>
          <span>High</span>
        </div>
        <div className="legend-item">
          <span className="legend-color medium"></span>
          <span>Medium</span>
        </div>
        <div className="legend-item">
          <span className="legend-color low"></span>
          <span>Low</span>
        </div>
      </div>
    </div>
  );
};

export default TaskDistributionGraph;
