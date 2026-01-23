const Task = require('../models/Task');

/**
 * Calculates the average percentage difference between estimatedDuration and actualDuration for completed tasks.
 * @param {string} userId - ID of the user (currently unused as specific user association is pending)
 * @returns {Promise<number>} - The average deviation as a percentage (e.g., 20 for 20% slower, -10 for 10% faster).
 */
const calculateTimeDeviation = async (userId) => {
  try {
    // Fetch completed tasks that have both estimatedDuration and actualDuration
    const completedTasks = await Task.find({
      status: 'completed',
      estimatedDuration: { $exists: true, $ne: null },
      actualDuration: { $exists: true, $ne: null },
    });

    if (completedTasks.length === 0) {
      return 0; // No data to analyze
    }

    let totalDeviation = 0;
    let count = 0;

    for (const task of completedTasks) {
       // Avoid division by zero
       if (task.estimatedDuration === 0) continue;

       const deviation = (task.actualDuration - task.estimatedDuration) / task.estimatedDuration;
       totalDeviation += deviation;
       count++;
    }

    if (count === 0) return 0;

    // Average deviation ratio
    const averageDeviation = totalDeviation / count;

    // Return as percentage (e.g., 0.20 -> 20)
    return parseFloat((averageDeviation * 100).toFixed(2));
  } catch (error) {
    console.error('Error calculating time deviation:', error);
    return 0;
  }
};

module.exports = { calculateTimeDeviation };
