import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, List, Clock, Plus } from 'lucide-react';
import { getTasks } from '../api';
import './CalendarView.css';

const CalendarView = () => {
    const navigateToRoute = useNavigate();
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'weekly' | 'daily'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayTasks, setOverlayTasks] = useState([]);
    const [overlayDate, setOverlayDate] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Fetch tasks from API
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                const response = await getTasks();
                // Backend returns { tasks: [...], suggestedBufferTime: ... }
                setTasks(response.tasks || response.data || []);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();

        // Refetch tasks when window regains focus (e.g., returning from task creation)
        const handleFocus = () => {
            fetchTasks();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

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

    // Normalize date to YYYY-MM-DD format (UTC to avoid timezone issues)
    const normalizeDateString = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get tasks for a specific date - improved with better date normalization
    const getTasksForDate = (date) => {
        const dateStr = normalizeDateString(date);
        return tasks.filter(task => {
            if (!task.deadline) return false;
            const taskDate = normalizeDateString(task.deadline);
            return taskDate === dateStr;
        });
    };

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

    // Render Monthly View
    const renderMonthlyView = () => {
        const getDaysInMonth = (date) => {
            return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        };

        const getFirstDayOfMonth = (date) => {
            return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        };

        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, isCurrentMonth: false, tasks: [] });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

            const dayTasks = getTasksForDate(date);
            days.push({ day, isCurrentMonth: true, isToday, tasks: dayTasks, date });
        }

        return (
            <div className="calendar-grid monthly-grid">
                {dayNames.map((dayName) => (
                    <div key={dayName} className="day-name">{dayName}</div>
                ))}
                {days.map((dayObj, index) => (
                    <div
                        key={index}
                        className={`day-tile ${!dayObj.isCurrentMonth ? 'empty' : ''} ${dayObj.isToday ? 'today' : ''
                            } ${dayObj.tasks.length > 0 ? 'has-tasks' : ''}`}
                        onClick={() => {
                            if (dayObj.isCurrentMonth) {
                                setSelectedDate(dayObj.date);
                                handleShowMore(dayObj.date, dayObj.tasks);
                            }
                        }}
                    >
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
            const startTime = new Date(deadlineDate.getTime() - durationMinutes * 60000);

            const startHour = startTime.getHours();
            const startMinutes = startTime.getMinutes();

            const top = (startHour * 60) + startMinutes;
            const height = durationMinutes;

            return {
                top: `${top}px`,
                height: `${height}px`,
                minHeight: '24px', // Ensure visibility
                backgroundColor: getPriorityColor(task.priority),
                opacity: 0.9,
                position: 'absolute',
                width: '90%',
                left: '5%',
                borderRadius: '4px',
                borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                zIndex: 10,
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '2px 4px',
                lineHeight: 1.1
            };
        };

        return (
            <div className="weekly-view">
                <div className="weekly-grid-header">
                    <div className="time-column-header"></div>
                    {weekDays.map((date, idx) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <div key={idx} className={`day-column-header ${isToday ? 'today-header' : ''}`}>
                                <div className="day-name-short">{dayNames[date.getDay()]}</div>
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
                                {dayTasks.map((task, idx) => (
                                    <div
                                        key={task._id || idx}
                                        className="weekly-task-item"
                                        style={getWeeklyTaskStyle(task)}
                                        title={`${task.title} (${task.duration || 30} min)`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigateToRoute(`/tasks/${task._id}`);
                                        }}
                                    >
                                        <div className="task-title-row">
                                            <span className="weekly-task-title">{task.title}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render Daily View - Continuous Timeline
    const renderDailyView = () => {
        const dayTasks = getTasksForDate(selectedDate);
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // Helper for Daily Task Style
        const getDailyTaskStyle = (task) => {
            const deadlineDate = new Date(task.deadline);
            const durationMinutes = task.duration || 30;
            const startTime = new Date(deadlineDate.getTime() - durationMinutes * 60000);

            const startHour = startTime.getHours();
            const startMinutes = startTime.getMinutes();

            const top = (startHour * 60) + startMinutes;
            const height = durationMinutes;

            return {
                top: `${top}px`,
                height: `${height}px`,
                minHeight: '24px', // Ensure visibility for short tasks
                backgroundColor: getPriorityColor(task.priority),
                opacity: 0.9,
                position: 'absolute',
                width: 'calc(100% - 70px)',
                left: '60px',
                right: '10px',
                borderRadius: '6px',
                borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                zIndex: 10,
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '4px 8px',
                lineHeight: 1.2
            };
        };

        return (
            <div className="daily-view">
                <div className="daily-header">
                    <h3>{dayNamesFull[selectedDate.getDay()]}, {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}</h3>
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
                            {dayTasks.map((task, idx) => (
                                <div
                                    key={task._id || idx}
                                    className="daily-task-item"
                                    style={getDailyTaskStyle(task)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigateToRoute(`/tasks/${task._id}`);
                                    }}
                                    title={`${task.title} (${task.duration || 30} min)`}
                                >
                                    <span className="daily-task-title" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{task.title}</span>
                                    {task.description && <span className="daily-task-desc" style={{ fontSize: '0.7rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
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
