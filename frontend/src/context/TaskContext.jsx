import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getTasks } from '../api';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children, user }) => {
    const [tasks, setTasks] = useState([]);
    const [suggestedBufferTime, setSuggestedBufferTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [insightsInvalidated, setInsightsInvalidated] = useState(false);

    const fetchTasks = useCallback(async () => {
        if (!user) {
            setTasks([]);
            setSuggestedBufferTime(0);
            return;
        }
        try {
            setLoading(true);
            const data = await getTasks();
            setTasks(data.tasks || []);
            setSuggestedBufferTime(data.suggestedBufferTime || 0);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Function to invalidate insights when a task is completed
    const invalidateInsights = useCallback(() => {
        setInsightsInvalidated(true);
    }, []);

    // Function to reset invalidation flag (called by InsightsHub after refetch)
    const resetInsightsInvalidation = useCallback(() => {
        setInsightsInvalidated(false);
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [user]);

    return (
        <TaskContext.Provider value={{
            tasks,
            suggestedBufferTime,
            loading,
            fetchTasks,
            insightsInvalidated,
            invalidateInsights,
            resetInsightsInvalidation
        }}>
            {children}
        </TaskContext.Provider>
    );
};
