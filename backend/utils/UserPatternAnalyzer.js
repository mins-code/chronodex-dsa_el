const Task = require('../models/Task');

const calculateTimeDeviation = async (userId, returnDetails = false) => {
  try {
    // Fetch completed tasks that have both estimatedDuration and actualDuration
    // Fetch completed tasks that have either estimatedDuration OR duration, and actualDuration
    // We will handle the fallback logic in the loop
    const completedTasks = await Task.find({
      status: 'completed',
      actualDuration: { $exists: true, $ne: null },
      $or: [
        { estimatedDuration: { $exists: true, $ne: null } },
        { duration: { $exists: true, $ne: null } }
      ]
    });

    console.log(`[DEBUG] Found ${completedTasks.length} completed tasks for analysis.`);
    if (completedTasks.length === 0) {
      return 0; // No data to analyze
    }

    let totalDeviation = 0;
    let count = 0;

    for (const task of completedTasks) {
      const estimated = task.estimatedDuration || task.duration;

      // Avoid division by zero
      if (!estimated || estimated === 0) continue;

      const deviation = (task.actualDuration - estimated) / estimated;
      console.log(`[DEBUG] Task: ${task.title}, Actual: ${task.actualDuration}, Est: ${estimated}, Deviation: ${deviation}`);
      totalDeviation += deviation;
      count++;
    }

    if (count === 0) return 0;

    // Average deviation ratio
    const averageDeviation = totalDeviation / count;
    const result = parseFloat((averageDeviation * 100).toFixed(2));

    console.log(`[DEBUG] Total Deviation: ${totalDeviation}, Count: ${count}, Avg: ${averageDeviation}, Result: ${result}%`);

    if (returnDetails) {
      return {
        averageDeviation: averageDeviation,
        percentage: result,
        totalTasksAnalyzed: count,
        efficiencyMultiplier: 1 + averageDeviation // e.g. 0.2 deviation -> 1.2 multiplier (slower)
      };
    }

    // Return as percentage (e.g., 0.20 -> 20)
    return result;
  } catch (error) {
    console.error('Error calculating time deviation:', error);
    return returnDetails ? { error: true } : 0;
  }
};

module.exports = { calculateTimeDeviation };
