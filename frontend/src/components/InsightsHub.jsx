import React, { useState, useEffect } from 'react';
import { getProductivityInsights } from '../api';
import { useTasks } from '../context/TaskContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './InsightsHub.css';

const ChartTooltip = ({ text }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div
            className="chart-tooltip-trigger"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="tooltip-icon">?</div>
            {showTooltip && (
                <div className="chart-tooltip-content">
                    {text}
                </div>
            )}
        </div>
    );
};

const InsightsHub = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { insightsInvalidated, resetInsightsInvalidation } = useTasks();

    useEffect(() => {
        fetchInsights();
    }, []);

    // Refetch insights when invalidated
    useEffect(() => {
        if (insightsInvalidated) {
            fetchInsights();
            resetInsightsInvalidation();
        }
    }, [insightsInvalidated, resetInsightsInvalidation]);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const data = await getProductivityInsights();
            setInsights(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch insights:', err);
            setError('Failed to load productivity insights. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const generateVivaInsight = () => {
        if (!insights) return '';

        const { timeAccuracy, deadlineReliability, workPattern } = insights;
        const insights_text = [];

        const reliability = parseFloat(deadlineReliability.reliabilityPercentage);
        if (reliability >= 80) {
            insights_text.push(`🎯 Excellent! You complete ${reliability.toFixed(0)}% of tasks on time.`);
        } else if (reliability >= 60) {
            insights_text.push(`⚠️ You complete ${reliability.toFixed(0)}% of tasks on time. Room for improvement!`);
        } else {
            insights_text.push(`🔴 Only ${reliability.toFixed(0)}% of tasks are completed on time. Consider adjusting deadlines.`);
        }

        if (timeAccuracy.underestimatedCount > timeAccuracy.overestimatedCount) {
            insights_text.push(`⏱️ You tend to underestimate task duration. Consider adding buffer time.`);
        } else if (timeAccuracy.overestimatedCount > timeAccuracy.underestimatedCount) {
            insights_text.push(`✅ You're conservative with time estimates. Tasks often finish early!`);
        }

        if (workPattern.peakProductivityDay !== 'N/A') {
            const peakPercentage = workPattern.dayBreakdown[workPattern.peakProductivityDay]?.percentage || 0;
            insights_text.push(`📊 ${workPattern.peakProductivityDay} is your peak productivity day (${peakPercentage}% of tasks completed).`);
        }

        return insights_text.join(' ');
    };

    const prepareEstimationData = () => {
        if (!insights || !insights.timeAccuracy) return [];

        const { underestimatedCount, overestimatedCount, accurateCount } = insights.timeAccuracy;

        return [
            { name: 'Underestimated', count: underestimatedCount, fill: '#ef4444' },
            { name: 'Accurate (±10%)', count: accurateCount, fill: '#10b981' },
            { name: 'Overestimated', count: overestimatedCount, fill: '#3b82f6' }
        ];
    };

    const prepareWeeklyData = () => {
        if (!insights || !insights.workPattern || !insights.workPattern.dayBreakdown) return [];

        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        return dayOrder.map(day => ({
            day,
            count: insights.workPattern.dayBreakdown[day]?.count || 0,
            percentage: parseFloat(insights.workPattern.dayBreakdown[day]?.percentage || 0)
        }));
    };

    const getReliabilityColor = (percentage) => {
        if (percentage >= 80) return '#10b981';
        if (percentage >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const hasEnoughData = () => {
        if (!insights) return false;
        const totalTasks = insights.deadlineReliability?.totalTasks || 0;
        return totalTasks >= 5;
    };

    if (loading) {
        return (
            <div className="insights-hub">
                <div className="insights-loading">
                    <div className="scanning-line"></div>
                    <p>Analyzing productivity patterns...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="insights-hub">
                <div className="insights-error">
                    <p>{error}</p>
                    <button onClick={fetchInsights} className="retry-button">Retry</button>
                </div>
            </div>
        );
    }

    if (!insights || !hasEnoughData()) {
        const completedCount = insights?.deadlineReliability?.totalTasks || 0;
        return (
            <div className="insights-hub">
                <div className="insights-header">
                    <h1 className="insights-title">📊 Productivity Insights</h1>
                    <p className="insights-subtitle">Behavioral analytics powered by your task history</p>
                </div>

                <div className="insights-empty-state">
                    <div className="empty-state-icon">📈</div>
                    <h2 className="empty-state-title">Unlock Your Productivity Insights</h2>
                    <p className="empty-state-message">
                        Complete at least <strong>5 tasks</strong> to unlock behavioral insights and analytics.
                        {completedCount > 0 && ` You've completed ${completedCount} task${completedCount === 1 ? '' : 's'} so far. Keep going!`}
                    </p>
                </div>
            </div>
        );
    }

    const estimationData = prepareEstimationData();
    const weeklyData = prepareWeeklyData();
    const reliabilityPercentage = parseFloat(insights.deadlineReliability.reliabilityPercentage);
    const reliabilityColor = getReliabilityColor(reliabilityPercentage);

    return (
        <div className="insights-hub">
            <div className="insights-header">
                <h1 className="insights-title">📊 Productivity Insights</h1>
                <p className="insights-subtitle">Behavioral analytics powered by your task history</p>
            </div>

            <div className="viva-insight-card">
                <div className="viva-header">
                    <span className="viva-icon">💡</span>
                    <h2>Insight Summary</h2>
                </div>
                <p className="viva-text">{generateVivaInsight()}</p>
            </div>

            <div className="insights-grid">
                <div className="insight-card reliability-card">
                    <h3 className="card-title">
                        ⏰ Deadline Reliability
                        <ChartTooltip text="Measures how often you complete tasks by their deadline. Higher percentages indicate better time management and realistic deadline setting." />
                    </h3>
                    <div className="reliability-gauge">
                        <div className="gauge-circle" style={{ borderColor: reliabilityColor }}>
                            <div className="gauge-value" style={{ color: reliabilityColor }}>
                                {reliabilityPercentage.toFixed(0)}%
                            </div>
                            <div className="gauge-label">On-Time Rate</div>
                        </div>
                    </div>
                    <div className="reliability-stats">
                        <div className="stat-item">
                            <span className="stat-label">On Time:</span>
                            <span className="stat-value success">{insights.deadlineReliability.onTimeCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Late:</span>
                            <span className="stat-value danger">{insights.deadlineReliability.lateCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total:</span>
                            <span className="stat-value">{insights.deadlineReliability.totalTasks}</span>
                        </div>
                    </div>
                </div>

                <div className="insight-card estimation-card">
                    <h3 className="card-title">
                        🎯 Estimation Accuracy
                        <ChartTooltip text="Shows how well you estimate task duration. Accurate estimates (within ±10%) help with better planning. Consistent underestimation suggests you need buffer time." />
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={estimationData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '8px',
                                    color: '#e2e8f0'
                                }}
                            />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {estimationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="estimation-summary">
                        <p>Average Accuracy: <strong>{insights.timeAccuracy.averageAccuracy}%</strong></p>
                        <p>Accurate Estimates: <strong>{insights.timeAccuracy.accuracyPercentage}%</strong></p>
                    </div>
                </div>

                <div className="insight-card heatmap-card">
                    <h3 className="card-title">
                        📅 Weekly Productivity Pattern
                        <ChartTooltip text="Identifies your peak productivity days based on completed tasks. Use this to schedule important work on your most productive days." />
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="day" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '8px',
                                    color: '#e2e8f0'
                                }}
                            />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="heatmap-summary">
                        <p>Peak Day: <strong>{insights.workPattern.peakProductivityDay}</strong></p>
                        <p>Peak Count: <strong>{insights.workPattern.peakDayCount} tasks</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsightsHub;
