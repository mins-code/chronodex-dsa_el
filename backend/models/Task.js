const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    deadline: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
    },
    status: {
      type: String,
      enum: ['to-do', 'in-progress', 'completed', 'pending', 'overdue'],
      default: 'to-do',
    },
    duration: {
      type: Number, // in minutes
    },
    estimatedDuration: {
      type: Number, // in minutes
    },
    actualDuration: {
      type: Number, // in minutes
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    completedAt: {
      type: Date,
    },
    priorityScore: {
      type: Number,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Task', taskSchema);