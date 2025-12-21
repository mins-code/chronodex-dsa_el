class IntervalScheduler {
  constructor() {
    this.intervals = []; // Array of intervals [startTime, endTime, taskId]
  }

  // Add a new interval while keeping the array sorted by startTime
  addInterval(start, end, taskId) {
    if (start >= end) {
      throw new Error("Invalid interval: start time must be less than end time.");
    }

    // Insert the new interval
    this.intervals.push([start, end, taskId]);

    // Keep the intervals sorted by startTime
    this.intervals.sort((a, b) => a[0] - b[0]);
  }

  // Find conflicts with a given time range [start, end]
  findConflicts(start, end) {
    const conflicts = [];

    for (const [existingStart, existingEnd, taskId] of this.intervals) {
      // Check if the intervals overlap
      if (start < existingEnd && end > existingStart) {
        conflicts.push([existingStart, existingEnd, taskId]);
      }
    }

    return conflicts;
  }

  // Merge overlapping or back-to-back intervals
  mergeIntervals() {
    if (this.intervals.length === 0) return;

    const merged = [];
    let [currentStart, currentEnd] = this.intervals[0];

    for (let i = 1; i < this.intervals.length; i++) {
      const [nextStart, nextEnd] = this.intervals[i];

      // If the current interval overlaps or is adjacent to the next, merge them
      if (nextStart <= currentEnd) {
        currentEnd = Math.max(currentEnd, nextEnd);
      } else {
        // Otherwise, push the current interval and move to the next
        merged.push([currentStart, currentEnd]);
        currentStart = nextStart;
        currentEnd = nextEnd;
      }
    }

    // Add the last interval
    merged.push([currentStart, currentEnd]);

    // Replace the intervals with the merged list
    this.intervals = merged;
  }
}

module.exports = IntervalScheduler;