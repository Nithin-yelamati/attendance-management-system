const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');

const router = express.Router();

// @route   POST api/courses
// @desc    Create a new course
// @access  Private (Admin/Faculty)
router.post(
  '/',
  [
    auth,
    auth.authorize('admin', 'faculty'),
    [
      check('name', 'Course name is required').not().isEmpty(),
      check('code', 'Course code is required').not().isEmpty(),
      check('department', 'Department is required').not().isEmpty(),
      check('schedule.day', 'Day is required').not().isEmpty(),
      check('schedule.startTime', 'Start time is required').not().isEmpty(),
      check('schedule.endTime', 'End time is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if faculty exists
      const faculty = await User.findById(req.body.faculty);
      if (!faculty || faculty.role !== 'faculty') {
        return res.status(400).json({ msg: 'Invalid faculty member' });
      }

      // Check if course code already exists
      let course = await Course.findOne({ code: req.body.code });
      if (course) {
        return res.status(400).json({ msg: 'Course with this code already exists' });
      }

      // Create new course
      course = new Course({
        name: req.body.name,
        code: req.body.code,
        department: req.body.department,
        faculty: req.body.faculty,
        schedule: {
          day: req.body.schedule.day,
          startTime: req.body.schedule.startTime,
          endTime: req.body.schedule.endTime,
        },
      });

      await course.save();
      res.json(course);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/courses
// @desc    Get all courses
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If user is faculty, only show their courses
    if (req.user.role === 'faculty') {
      query.faculty = req.user.id;
    }
    // If user is student, only show courses they're enrolled in
    else if (req.user.role === 'student') {
      query.students = { $in: [req.user.id] };
    }
    // Admin can see all courses

    const courses = await Course.find(query)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId');
      
    res.json(courses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/courses/:id
// @desc    Get course by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId');

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user has access to this course
    if (
      req.user.role === 'faculty' &&
      course.faculty._id.toString() !== req.user.id
    ) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(course);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/courses/:id/enroll
// @desc    Enroll students in a course
// @access  Private (Faculty/Admin)
router.put(
  '/:id/enroll',
  [auth, auth.authorize('admin', 'faculty'), [check('studentIds', 'Student IDs are required').isArray()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ msg: 'Course not found' });
      }

      // Check if user is authorized
      if (req.user.role === 'faculty' && course.faculty.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const { studentIds } = req.body;

      // Verify all students exist and are actually students
      const students = await User.find({
        _id: { $in: studentIds },
        role: 'student',
      });

      if (students.length !== studentIds.length) {
        return res.status(400).json({ msg: 'One or more invalid student IDs' });
      }

      // Add students to course if not already enrolled
      const newStudents = studentIds.filter(
        (id) => !course.students.includes(id)
      );

      if (newStudents.length === 0) {
        return res.status(400).json({ msg: 'All students are already enrolled in this course' });
      }

      course.students = [...course.students, ...newStudents];
      await course.save();

      // Add course to students' courses
      await User.updateMany(
        { _id: { $in: newStudents } },
        { $addToSet: { courses: course._id } }
      );

      res.json({ msg: 'Students enrolled successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/courses/:id
// @desc    Delete a course
// @access  Private (Admin/Faculty)
router.delete('/:id', [auth, auth.authorize('admin', 'faculty')], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is authorized
    if (req.user.role === 'faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Remove course from students' enrolled courses
    await User.updateMany(
      { _id: { $in: course.students } },
      { $pull: { courses: course._id } }
    );

    await course.remove();

    res.json({ msg: 'Course removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
