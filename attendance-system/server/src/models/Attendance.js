const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent',
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by is required'],
  },
  notes: {
    type: String,
    trim: true,
  },
  session: {
    type: String,
    required: [true, 'Session identifier is required'],
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate attendance entries for the same student in the same session
attendanceSchema.index({ student: 1, session: 1 }, { unique: true });

// Index for querying attendance by course and date
attendanceSchema.index({ course: 1, date: 1 });

// Index for student's attendance history
attendanceSchema.index({ student: 1, date: -1 });

// Pre-save hook to generate session identifier
attendanceSchema.pre('save', function(next) {
  if (!this.session) {
    const date = new Date(this.date);
    const formattedDate = date.toISOString().split('T')[0];
    this.session = `${this.course}_${formattedDate}`;
  }
  next();
});

// Static method to get attendance summary for a course
attendanceSchema.statics.getCourseSummary = async function(courseId) {
  return this.aggregate([
    {
      $match: { course: mongoose.Types.ObjectId(courseId) }
    },
    {
      $group: {
        _id: {
          student: '$student',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.student',
        attendance: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $unwind: '$student'
    },
    {
      $project: {
        'student.password': 0,
        'student.__v': 0
      }
    }
  ]);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
