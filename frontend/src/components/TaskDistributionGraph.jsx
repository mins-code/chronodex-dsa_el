import React, { useEffect, useState, useRef } from 'react';
import { getTaskDistribution } from '../api';
import { Calendar, TrendingUp } from 'lucide-react';
import './TaskDistributionGraph.css';

const TaskDistributionGraph = () => {
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(0);
  const graphContainerRef = useRef(null);

  const fetchDistribution = async () => {
    try {
      const data = await getTaskDistribution(14);
      setDistribution(data);
      const max = Math.max(...Object.values(data).map(d => d.total), 3); // Min cap at 3
      setMaxCount(Math.ceil(max * 1.2)); // Add some padding on top
      setLoading(false);
    } catch (error) {
      console.error('Error fetching distribution:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
    const interval = setInterval(fetchDistribution, 60000);
    return () => clearInterval(interval);
  }, []);

  const entries = Object.entries(distribution);
  const width = 800;
  const height = 250;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = entries.map(([date, counts], index) => {
    const x = padding + (index / (entries.length - 1)) * chartWidth;
    const y = height - padding - (counts.total / maxCount) * chartHeight;
    return { x, y, date, counts };
  });

  const pathData = points.length > 0
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

  // Create area shape: Move to first point, draw lines, drop to bottom right, move to bottom left, close
  const areaData = points.length > 0
    ? `${pathData} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`
    : '';

  const formatDate = (dateString, full = false) => {
    const date = new Date(dateString);
    return full
      ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  if (loading) return <div className="distribution-graph loading">Loading...</div>;

  return (
    <div className="distribution-graph line-chart-mode">
      <div className="graph-header">
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="#a855f7" />
            Task Flow
          </h3>
          <span className="subtitle">Next 14 Days Forecast</span>
        </div>
      </div>

      <div className="line-chart-container" ref={graphContainerRef}>
        <svg viewBox={`0 0 ${width} ${height}`} className="line-chart-svg">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = height - padding - (tick * chartHeight);
            return (
              <g key={tick}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 4"
                />
                <text x={padding - 10} y={y + 4} textAnchor="end" className="chart-label">
                  {Math.round(tick * maxCount)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaData} fill="url(#areaGradient)" />

          {/* The Line */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chart-line"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i} className="data-point-group">
              <circle cx={p.x} cy={p.y} r="4" className="data-point-dot" />
              <circle cx={p.x} cy={p.y} r="12" className="data-point-hitbox" />

              {/* X Axis Labels (every alternate label to enable fit) */}
              {i % 2 === 0 && (
                <text x={p.x} y={height - 10} textAnchor="middle" className="chart-label x-axis">
                  {formatDate(p.date)}
                </text>
              )}

              {/* Tooltip (SVG foreignObject or simple SVG implementation) */}
              <foreignObject x={p.x - 85} y={p.y - 120} width="170" height="110" className="svg-tooltip-wrapper">
                <div className="chart-tooltip">
                  <div className="tooltip-date">{formatDate(p.date, true)}</div>
                  <div className="tooltip-total">{p.counts.total} Tasks</div>
                  <div className="tooltip-breakdown">
                    <div className="breakdown-item"><span className="dot crit"></span> {p.counts.critical || 0} Critical</div>
                    <div className="breakdown-item"><span className="dot high"></span> {p.counts.high || 0} High</div>
                    <div className="breakdown-item"><span className="dot med"></span> {p.counts.medium || 0} Med</div>
                  </div>
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>

      <div className="graph-legend">
        <div className="legend-item"><span className="dot crit"></span> Critical</div>
        <div className="legend-item"><span className="dot high"></span> High</div>
        <div className="legend-item"><span className="dot med"></span> Medium</div>
        <div className="legend-item"><span className="dot low"></span> Low</div>
      </div>
    </div>
  );
};

export default TaskDistributionGraph;
