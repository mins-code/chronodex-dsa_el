const Task = require('../models/Task');

/**
 * AnalyticsEngine - Calculates behavioral productivity patterns
 * Provides insights on time accuracy, deadline reliability, and work patterns
 */
class AnalyticsEngine {
    /**
     * Calculate time accuracy by comparing actual vs estimated duration
     * @param {string} userId - User ID to filter tasks
     * @returns {Promise<Object>} Time accuracy metrics
     */
    static async calculateTimeAccuracy(userId) {
        try {
            const completedTasks = await Task.find({
                userId,
                status: 'completed',
                actualDuration: { $exists: true, $ne: null },
                estimatedDuration: { $exists: true, $ne: null, $gt: 0 }
            });

            if (completedTasks.length === 0) {
                return {
                    averageAccuracy: 0,
                    totalTasks: 0,
                    underestimatedCount: 0,
                    overestimatedCount: 0,
                    accurateCount: 0,
                    message: 'No completed tasks with duration data'
                };
            }

            let totalDeviation = 0;
            let underestimatedCount = 0;
            let overestimatedCount = 0;
            let accurateCount = 0;

            completedTasks.forEach(task => {
                const actual = task.actualDuration;
                const estimated = task.estimatedDuration;
                const deviation = ((actual - estimated) / estimated) * 100;

                totalDeviation += Math.abs(deviation);

                if (Math.abs(deviation) <= 10) {
                    accurateCount++; // Within 10% is considered accurate
                } else if (actual > estimated) {
                    underestimatedCount++;
                } else {
                    overestimatedCount++;
                }
            });

            const averageAccuracy = 100 - (totalDeviation / completedTasks.length);

            return {
                averageAccuracy: Math.max(0, averageAccuracy).toFixed(2),
                totalTasks: completedTasks.length,
                underestimatedCount,
                overestimatedCount,
                accurateCount,
                accuracyPercentage: ((accurateCount / completedTasks.length) * 100).toFixed(2)
            };
        } catch (error) {
            console.error('Error calculating time accuracy:', error);
            throw error;
        }
    }

    /**
     * Calculate deadline reliability (tasks completed on time)
     * @param {string} userId - User ID to filter tasks
     * @returns {Promise<Object>} Deadline reliability metrics
     */
    static async calculateDeadlineReliability(userId) {
        try {
            const completedTasks = await Task.find({
                userId,
                status: 'completed',
                completedAt: { $exists: true, $ne: null },
                deadline: { $exists: true, $ne: null }
            });

            if (completedTasks.length === 0) {
                return {
                    reliabilityPercentage: 0,
                    totalTasks: 0,
                    onTimeCount: 0,
                    lateCount: 0,
                    message: 'No completed tasks with deadline data'
                };
            }

            let onTimeCount = 0;
            let lateCount = 0;

            completedTasks.forEach(task => {
                const completedAt = new Date(task.completedAt);
                const deadline = new Date(task.deadline);

                if (completedAt <= deadline) {
                    onTimeCount++;
                } else {
                    lateCount++;
                }
            });

            const reliabilityPercentage = (onTimeCount / completedTasks.length) * 100;

            return {
                reliabilityPercentage: reliabilityPercentage.toFixed(2),
                totalTasks: completedTasks.length,
                onTimeCount,
                lateCount
            };
        } catch (error) {
            console.error('Error calculating deadline reliability:', error);
            throw error;
        }
    }

    /**
     * Analyze work patterns by day of week
     * @param {string} userId - User ID to filter tasks
     * @returns {Promise<Object>} Work pattern analysis
     */
    static async analyzeWorkPattern(userId) {
        try {
            const completedTasks = await Task.find({
                userId,
                status: 'completed',
                completedAt: { $exists: true, $ne: null }
            });

            if (completedTasks.length === 0) {
                return {
                    peakProductivityDay: 'N/A',
                    dayBreakdown: {},
                    totalTasks: 0,
                    message: 'No completed tasks to analyze'
                };
            }

            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayCount = {
                Sunday: 0,
                Monday: 0,
                Tuesday: 0,
                Wednesday: 0,
                Thursday: 0,
                Friday: 0,
                Saturday: 0
            };

            completedTasks.forEach(task => {
                const completedDate = new Date(task.completedAt);
                const dayOfWeek = dayNames[completedDate.getDay()];
                dayCount[dayOfWeek]++;
            });

            // Find peak productivity day
            let peakDay = 'N/A';
            let maxCount = 0;

            Object.entries(dayCount).forEach(([day, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    peakDay = day;
                }
            });

            // Calculate percentages
            const dayBreakdown = {};
            Object.entries(dayCount).forEach(([day, count]) => {
                dayBreakdown[day] = {
                    count,
                    percentage: ((count / completedTasks.length) * 100).toFixed(2)
                };
            });

            return {
                peakProductivityDay: peakDay,
                peakDayCount: maxCount,
                dayBreakdown,
                totalTasks: completedTasks.length
            };
        } catch (error) {
            console.error('Error analyzing work pattern:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive productivity insights
     * @param {string} userId - User ID to filter tasks
     * @returns {Promise<Object>} Complete analytics insights
     */
    static async getProductivityInsights(userId) {
        try {
            const [timeAccuracy, deadlineReliability, workPattern] = await Promise.all([
                this.calculateTimeAccuracy(userId),
                this.calculateDeadlineReliability(userId),
                this.analyzeWorkPattern(userId)
            ]);

            return {
                timeAccuracy,
                deadlineReliability,
                workPattern,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting productivity insights:', error);
            throw error;
        }
    }
}

module.exports = AnalyticsEngine;
