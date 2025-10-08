const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

const router = express.Router();

// @route   POST api/attendance/mark
// @desc    Mark attendance for students
// @access  Private (Faculty/Admin)
router.post(
  '/mark',
  [
    auth,
    auth.authorize('admin', 'faculty'),
    [
      check('courseId', 'Course ID is required').not().isEmpty(),
      check('date', 'Date is required').not().isEmpty(),
      check('attendance', 'Attendance data is required').isArray(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, date, attendance } = req.body;

    try {
      // Verify course exists and user is the faculty
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ msg: 'Course not found' });
      }

      if (req.user.role === 'faculty' && course.faculty.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized to mark attendance for this course' });
      }

      // Verify all students are enrolled in the course
      const studentIds = attendance.map((item) => item.studentId);
      const enrolledStudents = course.students.map((id) => id.toString());
      
      const invalidStudents = studentIds.filter(id => !enrolledStudents.includes(id));
      if (invalidStudents.length > 0) {
        return res.status(400).json({ 
          msg: 'One or more students are not enrolled in this course',
          invalidStudents 
        });
      }

      // Create attendance records
      const attendanceDate = new Date(date);
      const sessionId = `${courseId}_${attendanceDate.toISOString().split('T')[0]}`;

      // Check if attendance already marked for this session
      const existingAttendance = await Attendance.findOne({ session: sessionId });
      if (existingAttendance) {
        return res.status(400).json({ msg: 'Attendance already marked for this session' });
      }

      const attendanceRecords = attendance.map((item) => ({
        course: courseId,
        student: item.studentId,
        date: attendanceDate,
        status: item.status || 'absent',
        markedBy: req.user.id,
        notes: item.notes,
        session: sessionId,
      }));

      await Attendance.insertMany(attendanceRecords);

      res.json({ msg: 'Attendance marked successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/attendance/course/:courseId
// @desc    Get attendance for a course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is authorized
    if (
      req.user.role === 'faculty' &&
      course.faculty.toString() !== req.user.id
    ) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // If student, check if enrolled in the course
    if (
      req.user.role === 'student' &&
      !course.students.some(id => id.toString() === req.user.id)
    ) {
      return res.status(401).json({ msg: 'Not enrolled in this course' });
    }

    // Get attendance summary
    const summary = await Attendance.aggregate([
      {
        $match: { 
          course: course._id,
          ...(req.user.role === 'student' ? { student: req.user.id } : {})
        }
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

    // Get detailed attendance records
    const matchQuery = { course: course._id };
    if (req.user.role === 'student') {
      matchQuery.student = req.user.id;
    }

    const details = await Attendance.find(matchQuery)
      .populate('student', 'name email studentId')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json({
      summary,
      details
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/attendance/:id
// @desc    Update attendance record
// @access  Private (Faculty/Admin)
router.put(
  '/:id',
  [
    auth,
    auth.authorize('admin', 'faculty'),
    [
      check('status', 'Status is required')
        .isIn(['present', 'absent', 'late', 'excused']),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const attendance = await Attendance.findById(req.params.id)
        .populate('course', 'faculty');

      if (!attendance) {
        return res.status(404).json({ msg: 'Attendance record not found' });
      }

      // Check if user is authorized
      if (
        req.user.role === 'faculty' &&
        attendance.course.faculty.toString() !== req.user.id
      ) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const { status, notes } = req.body;

      attendance.status = status;
      if (notes !== undefined) attendance.notes = notes;
      attendance.markedBy = req.user.id;

      await attendance.save();

      res.json(attendance);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Attendance record not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/attendance/student/:studentId/course/:courseId
// @desc    Get attendance for a specific student in a course
// @access  Private
router.get('/student/:studentId/course/:courseId', auth, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    // Check if user is authorized
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // If faculty, verify they teach this course
    if (req.user.role === 'faculty') {
      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user.id
      });
      
      if (!course) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
    }

    const attendance = await Attendance.find({
      student: studentId,
      course: courseId
    })
      .populate('course', 'name code')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length,
    };

    res.json({
      summary,
      details: attendance
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
