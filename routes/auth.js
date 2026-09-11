const express = require('express');
const router = express.Router();
const pool = require('../db');

// Student login: verified against student_id + email already stored in Students table.
// No separate password field needed - this matches the existing schema Person A built.
router.post('/student-login', async (req, res) => {
    const { student_id, email } = req.body;
    if (!student_id || !email) {
        return res.status(400).json({ error: 'Student ID and email are required' });
    }
    try {
        const [rows] = await pool.query(
            'SELECT student_id, name, department, email FROM Students WHERE student_id = ? AND email = ?',
            [student_id, email]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'No matching student found. Check your ID and email.' });
        }
        req.session.role = 'student';
        req.session.studentId = rows[0].student_id;
        req.session.studentName = rows[0].name;
        res.json({ success: true, student: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Admin login: checked against ADMIN_USERNAME / ADMIN_PASSWORD in .env
router.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.role = 'admin';
        return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid admin credentials' });
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

router.get('/session', (req, res) => {
    if (!req.session.role) return res.json({ loggedIn: false });
    res.json({
        loggedIn: true,
        role: req.session.role,
        studentId: req.session.studentId,
        studentName: req.session.studentName
    });
});

module.exports = router;
