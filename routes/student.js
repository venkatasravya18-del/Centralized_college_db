const express = require('express');
const router = express.Router();
const pool = require('../db');

// Guard: only a logged-in student can access these, and only their OWN data
function requireStudent(req, res, next) {
    if (req.session.role !== 'student') {
        return res.status(403).json({ error: 'Student login required' });
    }
    next();
}
router.use(requireStudent);

// Profile
router.get('/profile', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Students WHERE student_id = ?', [req.session.studentId]);
    res.json(rows[0] || {});
});

// Enrolled courses
router.get('/courses', async (req, res) => {
    const [rows] = await pool.query(
        `SELECT e.enrollment_id, c.course_id, c.name AS course_name, c.department, c.credits, e.semester
         FROM Enrollment e JOIN Courses c ON e.course_id = c.course_id
         WHERE e.student_id = ?`,
        [req.session.studentId]
    );
    res.json(rows);
});

// Attendance per course
router.get('/attendance', async (req, res) => {
    const [rows] = await pool.query(
        `SELECT c.course_id, c.name AS course_name,
                COUNT(*) AS total_classes,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
                ROUND(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS attendance_percentage
         FROM Attendance a JOIN Courses c ON a.course_id = c.course_id
         WHERE a.student_id = ?
         GROUP BY c.course_id, c.name`,
        [req.session.studentId]
    );
    res.json(rows);
});

// Results
router.get('/results', async (req, res) => {
    const [rows] = await pool.query(
        `SELECT c.name AS course_name, r.marks, r.grade
         FROM Results r JOIN Courses c ON r.course_id = c.course_id
         WHERE r.student_id = ?`,
        [req.session.studentId]
    );
    res.json(rows);
});

// GPA - calls Person B's calculate_student_gpa stored procedure
router.get('/gpa', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.query('SET @gpa = ?', [0]);
        await conn.query('SET @grade = ?', ['']);
        await conn.query('CALL calculate_student_gpa(?, @gpa, @grade)', [req.session.studentId]);
        const [[result]] = await conn.query('SELECT @gpa AS gpa, @grade AS letter_grade');
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not calculate GPA' });
    } finally {
        conn.release();
    }
});

// Low-attendance notifications for this student (populated automatically by Person B's trigger)
router.get('/notifications', async (req, res) => {
    const [rows] = await pool.query(
        `SELECT n.*, c.name AS course_name
         FROM attendance_notifications n JOIN Courses c ON n.course_id = c.course_id
         WHERE n.student_id = ? ORDER BY n.created_at DESC`,
        [req.session.studentId]
    );
    res.json(rows);
});

module.exports = router;
