export const calculateDayLoad = (dayTasks, efficiencyMultiplier = 1.1) => {
    // Filter active tasks
    const activeTasks = dayTasks.filter(t => t.status !== 'completed');

    // If no active tasks, return null to hide the meter
    if (activeTasks.length === 0) {
        return null;
    }

    const weights = { Critical: 2.0, High: 1.5, Medium: 1.0, Low: 0.5 };
    const multiplier = efficiencyMultiplier;

    let totalWeightedMinutes = 0;
    activeTasks.forEach(task => {
        const duration = task.estimatedDuration || task.duration || 30;
        const weight = (weights[task.priority] || 1.0);
        totalWeightedMinutes += (duration * weight) * multiplier;
    });

    const totalHours = totalWeightedMinutes / 60;

    let status = 'light';
    let color = '#4ade80'; // Green
    let label = 'Light';

    if (totalHours > 7) {
        status = 'overloaded';
        color = '#ef4444'; // Red
        label = 'Overloaded';
    } else if (totalHours >= 4) {
        status = 'busy';
        color = '#facc15'; // Yellow
        label = 'Busy';
    }

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    return {
        status,
        color,
        label,
        formattedTime: `${hours}h ${minutes}m`,
        taskCount: activeTasks.length
    };
};

export const getTasksForDate = (tasks, date) => {
    return tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        return (
            taskDate.getDate() === date.getDate() &&
            taskDate.getMonth() === date.getMonth() &&
            taskDate.getFullYear() === date.getFullYear()
        );
    });
};
