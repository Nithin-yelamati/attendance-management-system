const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a course name'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Please provide a course code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  department: {
    type: String,
    required: [true, 'Please provide a department'],
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a faculty member'],
  },
  schedule: {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index for frequently queried fields
courseSchema.index({ code: 1, department: 1 });

module.exports = mongoose.model('Course', courseSchema);
