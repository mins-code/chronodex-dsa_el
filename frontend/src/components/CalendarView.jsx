import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, List, Clock, Plus, Check } from 'lucide-react';
import { useTasks } from '../context/TaskContext'; // Import context
import { getEfficiencyAnalytics } from '../api';
import { calculateDayLoad, getTasksForDate as utilsGetTasksForDate } from '../utils/taskUtils';
import './CalendarView.css';

const CalendarView = () => {
    const navigateToRoute = useNavigate();
    const { tasks, fetchTasks, loading } = useTasks(); // Consume context
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'weekly' | 'daily'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayTasks, setOverlayTasks] = useState([]);
    const [overlayDate, setOverlayDate] = useState(null);
    const [efficiencyStats, setEfficiencyStats] = useState(null);
    // Removed local tasks state

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Refetch on focus using context
    useEffect(() => {
        // Initial fetch is already done in Context, but we can fetch here if needed
        // ensure we don't loop. 
        // fetchTasks(); <-- excessive calling might loop if fetchTasks changes identity

        const handleFocus = () => {
            fetchTasks();
            fetchEfficiency();
        };

        const fetchEfficiency = async () => {
            try {
                const stats = await getEfficiencyAnalytics();
                setEfficiencyStats(stats);
            } catch (error) {
                console.error('Failed to fetch efficiency stats', error);
            }
        };

        fetchEfficiency();
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []); // Empty dependency array to run only once on mount

    // Get priority color - Subtle, dull tones
    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'critical':
                return '#8B4545'; // Maroon/dark red - subtle
            case 'high':
                return '#B8733D'; // Orangish - dull
            case 'medium':
                return '#9B8B3D'; // Yellow - muted
            case 'low':
                return '#4A6B8A'; // Blue - subtle
            default:
                return '#6B7280'; // Gray
        }
    };

    // Get task hour from deadline
    const getTaskHour = (task) => {
        if (!task.deadline) return 0;
        return new Date(task.deadline).getHours();
    };

    // Wrapper for the imported getTasksForDate utility
    const getTasksForDate = (date) => utilsGetTasksForDate(tasks, date);

    // Handle overlay for days with many tasks
    const handleShowMore = (date, dayTasks) => {
        setOverlayDate(date);
        setOverlayTasks(dayTasks);
        setShowOverlay(true);
    };

    const closeOverlay = () => {
        setShowOverlay(false);
        setOverlayTasks([]);
        setOverlayDate(null);
    };

    // Get start of week
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    };

    // Navigation handlers
    const navigate = (direction) => {
        const newDate = new Date(viewMode === 'daily' ? selectedDate : currentDate);

        if (viewMode === 'monthly') {
            newDate.setMonth(newDate.getMonth() + direction);
            setCurrentDate(newDate);
        } else if (viewMode === 'weekly') {
            newDate.setDate(newDate.getDate() + (direction * 7));
            setSelectedDate(newDate);
            setCurrentDate(newDate);
        } else {
            newDate.setDate(newDate.getDate() + direction);
            setSelectedDate(newDate);
        }
    };

    // Wrapper for the imported calculateDayLoad utility
    const getDayLoadStats = (dayTasks) => {
        const multiplier = efficiencyStats?.efficiencyMultiplier || 1.1;
        return calculateDayLoad(dayTasks, multiplier);
    };

    // Render Monthly View & Legend
    const renderMonthlyView = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const days = [];

        // Previous month filler
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ day: null, isCurrentMonth: false, tasks: [] });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

            const dayTasks = getTasksForDate(date);
            const loadStats = getDayLoadStats(dayTasks);

            days.push({ day, isCurrentMonth: true, isToday, tasks: dayTasks, date, loadStats });
        }

        return (
            <>
                <div className="calendar-grid monthly-grid">
                    {dayNames.map((dayName) => (
                        <div key={dayName} className="day-name">{dayName}</div>
                    ))}
                    {days.map((dayObj, index) => (
                        <div
                            key={index}
                            className={`day-tile ${!dayObj.isCurrentMonth ? 'empty' : ''} ${dayObj.isToday ? 'today' : ''
                                } ${dayObj.tasks.length > 0 ? 'has-tasks' : ''} ${dayObj.loadStats ? `load-status-${dayObj.loadStats.status}` : ''}`}
                            onClick={() => {
                                if (dayObj.isCurrentMonth) {
                                    setSelectedDate(dayObj.date);
                                    handleShowMore(dayObj.date, dayObj.tasks);
                                }
                            }}
                            style={dayObj.loadStats ? { '--status-color': dayObj.loadStats.color } : {}}
                        >
                            {/* Focus Load Meter (Top-Left) */}
                            {dayObj.loadStats && (
                                <div className="focus-load-meter">
                                    <div className="meter-dot" style={{ backgroundColor: dayObj.loadStats.color }}></div>
                                    <div className="meter-mini-label">
                                        {dayObj.loadStats.taskCount} tasks · {dayObj.loadStats.formattedTime}
                                    </div>
                                </div>
                            )}

                            {/* Date number in top-right corner */}
                            <div className="day-number-corner">{dayObj.day}</div>

                            {/* Task Pills - Max 2 visible */}
                            {dayObj.tasks.length > 0 && (
                                <div className="task-pills-container">
                                    {dayObj.tasks.slice(0, 2).map((task, idx) => (
                                        <div
                                            key={task._id || idx}
                                            className="task-pill"
                                            style={{
                                                backgroundColor: getPriorityColor(task.priority)
                                            }}
                                            title={`${task.title} (${task.priority || 'Medium'})`}
                                        >
                                            <span className="task-pill-text">{task.title}</span>
                                        </div>
                                    ))}
                                    {dayObj.tasks.length > 2 && (
                                        <div
                                            className="task-overflow-pill"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleShowMore(dayObj.date, dayObj.tasks);
                                            }}
                                        >
                                            +{dayObj.tasks.length - 2}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="focus-load-legend">
                    <span className="legend-title">FOCUS LOAD:</span>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#4ade80' }}></span>
                        <span>Light (&lt;4h)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#facc15' }}></span>
                        <span>Busy (4-7h)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
                        <span>Overloaded (&gt;7h)</span>
                    </div>
                </div>
            </>
        );
    };

    // --- Tooltip State ---
    const [hoveredTask, setHoveredTask] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const handleTaskMouseEnter = (e, task, bufferDuration) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top
        });
        setHoveredTask({ ...task, bufferDuration });
    };

    const handleTaskMouseLeave = () => {
        setHoveredTask(null);
    };

    // --- Task Tooltip Component (Active State) ---
    const ActiveTaskTooltip = () => {
        if (!hoveredTask) return null;

        const priorityColors = {
            critical: 'critical',
            high: 'high',
            medium: 'medium',
            low: 'low'
        };

        return (
            <div
                className="task-tooltip active"
                style={{
                    top: `${tooltipPosition.y}px`,
                    left: `${tooltipPosition.x}px`
                }}
            >
                <div className="tooltip-header">
                    <div className="tooltip-title">{hoveredTask.title}</div>
                    <div className={`tooltip-priority ${priorityColors[hoveredTask.priority]}`}>
                        {hoveredTask.priority} PRIORITY
                    </div>
                </div>

                <div className="tooltip-meta-row">
                    <span>TIMEFRAME:</span>
                    <span className="tooltip-value">{hoveredTask.duration || 30} MIN</span>
                </div>

                {/* Show Buffer only if user has an efficiency multiplier > 1 */}
                {hoveredTask.bufferDuration > 0 && (
                    <div className="tooltip-buffer-row">
                        <span className="tooltip-buffer-label">SYSTEM BUFFER</span>
                        <span className="tooltip-buffer-value">+{Math.round(hoveredTask.bufferDuration)} MIN</span>
                    </div>
                )}
            </div>
        );
    };

    // Render Weekly View - Continuous Timeline
    const renderWeeklyView = () => {
        const weekStart = getWeekStart(selectedDate);
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            weekDays.push(date);
        }
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // Helper for Weekly Task Style
        const getWeeklyTaskStyle = (task) => {
            const deadlineDate = new Date(task.deadline);
            const durationMinutes = task.duration || 30;
            const isCompleted = task.status === 'completed';

            // Calculate buffer (Apply to ALL tasks)
            const multiplier = efficiencyStats?.efficiencyMultiplier || 1;
            const bufferDuration = durationMinutes * (multiplier - 1);

            // Total height including buffer
            const totalDuration = durationMinutes + bufferDuration;

            const startTime = new Date(deadlineDate.getTime() - durationMinutes * 60000);

            const startHour = startTime.getHours();
            const startMinutes = startTime.getMinutes();

            const top = (startHour * 60) + startMinutes;
            const height = totalDuration;

            return {
                isCompleted,
                bufferDuration, // Pass this down
                container: {
                    top: `${top}px`,
                    height: `${height}px`,
                    minHeight: '24px',
                    position: 'absolute',
                    width: '90%',
                    left: '5%',
                    zIndex: 10,
                    cursor: 'pointer',
                },
                visualLayer: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    zIndex: 0,
                    opacity: isCompleted ? 0.6 : 1, // Dim completed tasks
                    filter: isCompleted ? 'grayscale(0.5)' : 'none' // Desaturate completed
                },
                coreBg: {
                    flex: `0 0 ${durationMinutes}px`, // Fixed height for core task
                    backgroundColor: getPriorityColor(task.priority),
                    opacity: 1,
                    borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                },
                bufferBg: {
                    flex: `1 1 auto`, // Remaining space is buffer
                    backgroundImage: `repeating-linear-gradient(
                        45deg,
                        ${getPriorityColor(task.priority)}40,
                        ${getPriorityColor(task.priority)}40 5px,
                        ${getPriorityColor(task.priority)}20 5px,
                        ${getPriorityColor(task.priority)}20 10px
                    )`,
                    borderLeft: `3px solid ${getPriorityColor(task.priority)}40`,
                },
                content: {
                    position: 'relative',
                    zIndex: 1, // On top of visual layer
                    padding: '4px 6px',
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    pointerEvents: 'none' // Let clicks pass through to container
                }
            };
        };

        return (
            <>
                <div className="weekly-view">
                    <div className="weekly-grid-header">
                        <div className="time-column-header"></div>
                        {weekDays.map((date, idx) => {
                            const isToday = date.toDateString() === new Date().toDateString();
                            const dayTasks = getTasksForDate(date);
                            const loadStats = calculateDayLoad(dayTasks);

                            return (
                                <div
                                    key={idx}
                                    className={`day-column-header ${isToday ? 'today-header' : ''}`}
                                    style={loadStats ? {
                                        position: 'relative',
                                        borderTop: `3px solid ${loadStats.color}`
                                    } : { position: 'relative' }}
                                >
                                    {/* Focus Meter for Weekly Column */}
                                    {loadStats && (
                                        <div className="focus-load-meter" style={{ top: '2px', left: '4px', transform: 'scale(0.85)', transformOrigin: 'top left' }}>
                                            <div className="meter-dot" style={{ backgroundColor: loadStats.color }}></div>
                                            <div className="meter-mini-label" style={{ fontSize: '0.6rem' }}>
                                                {loadStats.formattedTime}
                                            </div>
                                        </div>
                                    )}
                                    <div className="day-name-short" style={{ marginTop: '12px' }}>{dayNames[date.getDay()]}</div>
                                    <div className="day-date">{date.getDate()}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="weekly-grid-body">
                        {/* Time Column */}
                        <div className="time-column">
                            {hours.map(hour => (
                                <div key={hour} className="time-slot" style={{ height: '60px', position: 'relative' }}>
                                    <span className="time-label" style={{ position: 'absolute', top: '-6px', right: '4px', fontSize: '0.7rem', color: '#64748b' }}>
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        {weekDays.map((date, dayIndex) => {
                            const dayTasks = getTasksForDate(date);
                            const isToday = date.toDateString() === new Date().toDateString();

                            return (
                                <div key={dayIndex} className={`day-column-body ${isToday ? 'today-column' : ''}`} style={{ position: 'relative', height: `${24 * 60}px` }}>
                                    {/* Background Grid Lines */}
                                    {hours.map(hour => (
                                        <div key={hour} className="grid-line" style={{ height: '60px', borderBottom: '1px solid rgba(56, 189, 248, 0.1)', boxSizing: 'border-box' }}></div>
                                    ))}

                                    {/* Tasks Layer */}
                                    {dayTasks.map((task, idx) => {
                                        const styles = getWeeklyTaskStyle(task);
                                        return (
                                            <div
                                                key={task._id || idx}
                                                className="weekly-task-item-container"
                                                style={styles.container}
                                                title=""
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigateToRoute(`/tasks/${task._id}`);
                                                }}
                                                onMouseEnter={(e) => handleTaskMouseEnter(e, task, styles.bufferDuration)}
                                                onMouseLeave={handleTaskMouseLeave}
                                            >
                                                {/* Visual Layer (Backgrounds) */}
                                                <div style={styles.visualLayer}>
                                                    <div style={styles.coreBg}></div>
                                                    {/* Render buffer only if it exists */}
                                                    {(efficiencyStats?.efficiencyMultiplier > 1) && (
                                                        <div style={styles.bufferBg}></div>
                                                    )}
                                                </div>

                                                {/* Content Layer (Text) */}
                                                <div style={styles.content}>
                                                    <div className="task-title-row">
                                                        {styles.isCompleted && <Check size={12} style={{ marginRight: '4px', display: 'inline' }} strokeWidth={3} />}
                                                        <span className="weekly-task-title" style={styles.isCompleted ? { textDecoration: 'line-through', opacity: 0.9 } : {}}>
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="focus-load-legend">
                    <span className="legend-title">FOCUS LOAD:</span>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#4ade80' }}></span>
                        <span>Light (&lt;4h)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#facc15' }}></span>
                        <span>Busy (4-7h)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
                        <span>Overloaded (&gt;7h)</span>
                    </div>
                </div>
            </>
        );
    };

    // Render Daily View - Continuous Timeline
    const renderDailyView = () => {
        const dayTasks = getTasksForDate(selectedDate);
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const loadStats = calculateDayLoad(dayTasks);

        // Helper for Daily Task Style
        const getDailyTaskStyle = (task) => {
            const deadlineDate = new Date(task.deadline);
            const durationMinutes = task.duration || 30;
            const isCompleted = task.status === 'completed';

            // Calculate buffer (Apply to ALL tasks)
            const multiplier = efficiencyStats?.efficiencyMultiplier || 1;
            const bufferDuration = durationMinutes * (multiplier - 1);

            // Total height including buffer
            const totalDuration = durationMinutes + bufferDuration;

            const startTime = new Date(deadlineDate.getTime() - durationMinutes * 60000);

            const startHour = startTime.getHours();
            const startMinutes = startTime.getMinutes();

            const top = (startHour * 60) + startMinutes;
            const height = totalDuration;

            return {
                isCompleted,
                bufferDuration, // Pass this down
                container: {
                    top: `${top}px`,
                    height: `${height}px`,
                    minHeight: '24px',
                    position: 'absolute',
                    width: 'calc(100% - 70px)',
                    left: '60px',
                    right: '10px',
                    zIndex: 10,
                    cursor: 'pointer',
                },
                visualLayer: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    zIndex: 0,
                    opacity: isCompleted ? 0.6 : 1, // Dim completed tasks
                    filter: isCompleted ? 'grayscale(0.5)' : 'none'
                },
                coreBg: {
                    flex: `0 0 ${durationMinutes}px`, // Fixed height for core
                    backgroundColor: getPriorityColor(task.priority),
                    opacity: 1, // Increased opacity
                    borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                },
                bufferBg: {
                    flex: `1 1 auto`,
                    backgroundImage: `repeating-linear-gradient(
                        45deg,
                        ${getPriorityColor(task.priority)}40,
                        ${getPriorityColor(task.priority)}40 5px,
                        ${getPriorityColor(task.priority)}20 5px,
                        ${getPriorityColor(task.priority)}20 10px
                    )`,
                    borderLeft: `4px solid ${getPriorityColor(task.priority)}40`,
                },
                content: {
                    position: 'relative',
                    zIndex: 1,
                    padding: '4px 8px',
                    color: '#ffffff', // Force white text
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)', // Add text shadow
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height: '100%' // Ensure content can center if needed, or stick to top
                }
            };
        };

        return (
            <>
                <div className="daily-view">
                    <div className="daily-header" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h3>{dayNamesFull[selectedDate.getDay()]}, {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}</h3>

                        {/* Focus Meter for Daily View Header */}
                        {loadStats && (
                            <div className="focus-load-meter-daily" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: `1px solid ${loadStats.color}40` }}>
                                <div className="meter-dot" style={{ backgroundColor: loadStats.color, width: '10px', height: '10px' }}></div>
                                <span style={{ color: loadStats.color, fontWeight: 'bold', fontSize: '0.9rem' }}>{loadStats.label}</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({loadStats.taskCount} tasks · {loadStats.formattedTime})</span>
                            </div>
                        )}
                    </div>

                    <div className="daily-timeline-container" style={{ position: 'relative', height: '100%', overflowY: 'auto' }}>
                        <div className="timeline-content" style={{ position: 'relative', height: `${24 * 60}px` }}>

                            {/* Time Slots & Grid Lines */}
                            {hours.map(hour => (
                                <div key={hour} className="daily-hour-slot" style={{ height: '60px', display: 'flex', position: 'absolute', top: `${hour * 60}px`, width: '100%' }}>
                                    <div className="daily-time-label" style={{ width: '60px', textAlign: 'right', paddingRight: '10px', color: '#94a3b8', fontSize: '0.75rem', transform: 'translateY(-50%)' }}>
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                    <div className="daily-grid-line" style={{ flex: 1, borderTop: '1px solid rgba(56, 189, 248, 0.1)', width: '100%' }}></div>
                                </div>
                            ))}

                            {/* Tasks Layer */}
                            <div className="daily-tasks-layer">
                                {dayTasks.map((task, idx) => {
                                    const styles = getDailyTaskStyle(task);
                                    return (
                                        <div
                                            key={task._id || idx}
                                            className="daily-task-item-container"
                                            style={styles.container}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigateToRoute(`/tasks/${task._id}`);
                                            }}
                                            onMouseEnter={(e) => handleTaskMouseEnter(e, task, styles.bufferDuration)}
                                            onMouseLeave={handleTaskMouseLeave}
                                            title="" // Clear default title to avoid double tooltip
                                        >
                                            {/* Visual Layer */}
                                            <div style={styles.visualLayer}>
                                                <div style={styles.coreBg}></div>
                                                {(efficiencyStats?.efficiencyMultiplier > 1) && (
                                                    <div style={styles.bufferBg}></div>
                                                )}
                                            </div>

                                            {/* Content Layer */}
                                            <div style={styles.content}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {styles.isCompleted && <Check size={14} strokeWidth={3} />}
                                                    <span className="daily-task-title" style={{ fontSize: '0.95rem', fontWeight: 700, ...(styles.isCompleted ? { textDecoration: 'line-through', opacity: 0.9 } : {}) }}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                                {task.description && <span className="daily-task-desc" style={{ fontSize: '0.8rem', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="focus-load-legend">
                    <span className="legend-title">FOCUS LOAD:</span>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#4ade80' }}></span>
                        <span>Light (&lt;4h)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#facc15' }}></span>
                        <span>Busy (4-7h)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
                        <span>Overloaded (&gt;7h)</span>
                    </div>
                </div>
            </>
        );
    };



    const getNavigationLabel = () => {
        if (viewMode === 'monthly') {
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else if (viewMode === 'weekly') {
            const weekStart = getWeekStart(selectedDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
        } else {
            return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
        }
    };

    return (
        <div className="calendar-view">
            <div className="calendar-header">
                <h2 className="calendar-title">{getNavigationLabel()}</h2>

                <div className="calendar-controls">
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
                            onClick={() => setViewMode('monthly')}
                            title="Monthly View"
                        >
                            <Calendar size={18} />
                            <span>Month</span>
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
                            onClick={() => setViewMode('weekly')}
                            title="Weekly View"
                        >
                            <List size={18} />
                            <span>Week</span>
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'daily' ? 'active' : ''}`}
                            onClick={() => setViewMode('daily')}
                            title="Daily View"
                        >
                            <Clock size={18} />
                            <span>Day</span>
                        </button>
                    </div>

                    <div className="calendar-nav">
                        <button className="nav-btn" onClick={() => navigate(-1)} title="Previous">
                            <ChevronLeft size={20} />
                        </button>
                        <button className="nav-btn" onClick={() => navigate(1)} title="Next">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="calendar-loading">Loading tasks...</div>
            ) : (
                <>
                    {viewMode === 'monthly' && renderMonthlyView()}
                    {viewMode === 'weekly' && renderWeeklyView()}
                    {viewMode === 'daily' && renderDailyView()}
                </>
            )}

            {/* Active Task Tooltip (Fixed Position) */}
            <ActiveTaskTooltip />

            {/* Task Overlay Modal */}
            {showOverlay && (
                <div className="task-overlay" onClick={closeOverlay}>
                    <div className="task-overlay-content" onClick={(e) => e.stopPropagation()}>
                        <div className="overlay-header">
                            <h3>
                                {overlayDate && `${monthNames[overlayDate.getMonth()]} ${overlayDate.getDate()}, ${overlayDate.getFullYear()}`}
                            </h3>
                            <button className="close-overlay" onClick={closeOverlay}>×</button>
                        </div>
                        <div className="overlay-tasks">
                            {overlayTasks.length > 0 ? (
                                overlayTasks.map((task, idx) => (
                                    <div
                                        key={task._id || idx}
                                        className="overlay-task-card-compact"
                                        style={{
                                            borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                                        }}
                                        onClick={() => {
                                            navigateToRoute(`/tasks/${task._id}`);
                                        }}
                                        title={`${task.title}\n${task.description || 'No description'}\nPriority: ${task.priority || 'Medium'}\nStatus: ${task.status || 'to-do'}`}
                                    >
                                        <span className="task-compact-title">{task.title}</span>
                                        {task.duration && (
                                            <div className="task-compact-duration">
                                                <Clock size={12} />
                                                <span>{task.duration} min</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="overlay-empty-state">
                                    <Calendar size={48} className="empty-icon" />
                                    <p>No tasks scheduled for this day</p>
                                    <span className="empty-hint">Click the button below to create one</span>
                                </div>
                            )}
                        </div>

                        {/* Create Task Button */}
                        <div className="overlay-footer">
                            <button
                                className="create-task-btn"
                                onClick={() => {
                                    navigateToRoute('/create', { state: { selectedDate: overlayDate } });
                                    closeOverlay();
                                }}
                            >
                                <Plus size={18} />
                                <span>Create Task for This Day</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
