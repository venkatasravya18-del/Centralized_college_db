const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireAdmin(req, res, next) {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Admin login required' });
    }
    next();
}

function calculateGradeFromMarks(marks) {
    if (marks >= 90) return 'A';
    if (marks >= 80) return 'B';
    if (marks >= 70) return 'C';
    if (marks >= 60) return 'D';
    return 'F';
}

async function deleteStudentCascade(conn, studentId) {
    await conn.query('DELETE FROM attendance_notifications WHERE student_id = ?', [studentId]);
    await conn.query('DELETE FROM Attendance WHERE student_id = ?', [studentId]);
    await conn.query('DELETE FROM Results WHERE student_id = ?', [studentId]);
    await conn.query('DELETE FROM Enrollment WHERE student_id = ?', [studentId]);
    await conn.query('DELETE FROM Students WHERE student_id = ?', [studentId]);
}

async function deleteCourseCascade(conn, courseId) {
    await conn.query('DELETE FROM attendance_notifications WHERE course_id = ?', [courseId]);
    await conn.query('DELETE FROM Attendance WHERE course_id = ?', [courseId]);
    await conn.query('DELETE FROM Results WHERE course_id = ?', [courseId]);
    await conn.query('DELETE FROM Enrollment WHERE course_id = ?', [courseId]);
    await conn.query('DELETE FROM Courses WHERE course_id = ?', [courseId]);
}

router.use(requireAdmin);

// ---------- Core listings ----------
router.get('/students', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Students ORDER BY student_id');
    res.json(rows);
});

router.get('/faculty', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Faculty ORDER BY faculty_id');
    res.json(rows);
});

router.get('/courses', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Courses ORDER BY course_id');
    res.json(rows);
});

router.get('/enrollments', async (req, res) => {
    const [rows] = await pool.query(
        `SELECT e.enrollment_id, s.student_id, s.name AS student_name, c.course_id, c.name AS course_name, e.semester
         FROM Enrollment e
         JOIN Students s ON e.student_id = s.student_id
         JOIN Courses c ON e.course_id = c.course_id
         ORDER BY e.enrollment_id`
    );
    res.json(rows);
});

router.get('/results', async (req, res) => {
    const [rows] = await pool.query(
        `SELECT r.result_id, r.student_id, s.name AS student_name, r.course_id, c.name AS course_name, r.marks, r.grade
         FROM Results r
         JOIN Students s ON r.student_id = s.student_id
         JOIN Courses c ON r.course_id = c.course_id
         ORDER BY r.result_id`
    );
    res.json(rows);
});

// ---------- Edit / delete records ----------
router.put('/students/:id', async (req, res) => {
    const { name, dob, email, department } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) {
        if (!String(name).trim()) return res.status(400).json({ error: 'Student name is required' });
        updates.push('name = ?');
        values.push(name);
    }
    if (dob !== undefined) {
        updates.push('dob = ?');
        values.push(dob || null);
    }
    if (email !== undefined) {
        updates.push('email = ?');
        values.push(email || null);
    }
    if (department !== undefined) {
        if (!String(department).trim()) return res.status(400).json({ error: 'Department is required' });
        updates.push('department = ?');
        values.push(department);
    }

    if (!updates.length) {
        return res.status(400).json({ error: 'No student fields were provided to update' });
    }

    try {
        values.push(req.params.id);
        const [result] = await pool.query(
            `UPDATE Students SET ${updates.join(', ')} WHERE student_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ success: true, message: 'Student updated' });
    } catch (err) {
        res.status(400).json({ error: err.sqlMessage || 'Could not update student' });
    }
});

router.delete('/students/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [existing] = await conn.query('SELECT student_id FROM Students WHERE student_id = ?', [req.params.id]);
        if (!existing.length) {
            await conn.rollback();
            return res.status(404).json({ error: 'Student not found' });
        }

        await deleteStudentCascade(conn, req.params.id);
        await conn.commit();
        res.json({ success: true, message: 'Student deleted' });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.sqlMessage || 'Could not delete student' });
    } finally {
        conn.release();
    }
});

router.put('/courses/:id', async (req, res) => {
    const { name, department, credits } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) {
        if (!String(name).trim()) return res.status(400).json({ error: 'Course name is required' });
        updates.push('name = ?');
        values.push(name);
    }
    if (department !== undefined) {
        if (!String(department).trim()) return res.status(400).json({ error: 'Department is required' });
        updates.push('department = ?');
        values.push(department);
    }
    if (credits !== undefined) {
        const parsedCredits = Number(credits);
        if (!Number.isInteger(parsedCredits) || parsedCredits <= 0) {
            return res.status(400).json({ error: 'Credits must be a positive integer' });
        }
        updates.push('credits = ?');
        values.push(parsedCredits);
    }

    if (!updates.length) {
        return res.status(400).json({ error: 'No course fields were provided to update' });
    }

    try {
        values.push(req.params.id);
        const [result] = await pool.query(
            `UPDATE Courses SET ${updates.join(', ')} WHERE course_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ success: true, message: 'Course updated' });
    } catch (err) {
        res.status(400).json({ error: err.sqlMessage || 'Could not update course' });
    }
});

router.delete('/courses/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [existing] = await conn.query('SELECT course_id FROM Courses WHERE course_id = ?', [req.params.id]);
        if (!existing.length) {
            await conn.rollback();
            return res.status(404).json({ error: 'Course not found' });
        }

        await deleteCourseCascade(conn, req.params.id);
        await conn.commit();
        res.json({ success: true, message: 'Course deleted' });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.sqlMessage || 'Could not delete course' });
    } finally {
        conn.release();
    }
});

router.put('/enrollments/:id', async (req, res) => {
    const { student_id, course_id, semester } = req.body;

    if (student_id === undefined || course_id === undefined || semester === undefined) {
        return res.status(400).json({ error: 'student_id, course_id and semester are required' });
    }

    const parsedStudentId = Number(student_id);
    const parsedCourseId = Number(course_id);

    if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0 || !Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
        return res.status(400).json({ error: 'student_id and course_id must be positive integers' });
    }

    if (!String(semester).trim()) {
        return res.status(400).json({ error: 'semester is required' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE Enrollment SET student_id = ?, course_id = ?, semester = ? WHERE enrollment_id = ?',
            [parsedStudentId, parsedCourseId, semester, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        res.json({ success: true, message: 'Enrollment updated' });
    } catch (err) {
        res.status(400).json({ error: err.sqlMessage || 'Could not update enrollment' });
    }
});

router.delete('/enrollments/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM Enrollment WHERE enrollment_id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }
        res.json({ success: true, message: 'Enrollment deleted' });
    } catch (err) {
        res.status(400).json({ error: err.sqlMessage || 'Could not delete enrollment' });
    }
});

router.put('/results/:id', async (req, res) => {
    const { student_id, course_id, marks } = req.body;

    if (student_id === undefined || course_id === undefined || marks === undefined) {
        return res.status(400).json({ error: 'student_id, course_id and marks are required' });
    }

    const parsedStudentId = Number(student_id);
    const parsedCourseId = Number(course_id);
    const parsedMarks = Number(marks);

    if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0 || !Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
        return res.status(400).json({ error: 'student_id and course_id must be positive integers' });
    }

    if (!Number.isInteger(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
        return res.status(400).json({ error: 'marks must be an integer between 0 and 100' });
    }

    const grade = calculateGradeFromMarks(parsedMarks);

    try {
        const [[enrollment]] = await pool.query(
            'SELECT COUNT(*) AS count FROM Enrollment WHERE student_id = ? AND course_id = ?',
            [parsedStudentId, parsedCourseId]
        );

        if (enrollment.count === 0) {
            return res.status(400).json({ error: 'Student is not enrolled in this course' });
        }

        const [result] = await pool.query(
            'UPDATE Results SET student_id = ?, course_id = ?, marks = ?, grade = ? WHERE result_id = ?',
            [parsedStudentId, parsedCourseId, parsedMarks, grade, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Result not found' });
        }

        res.json({
            success: true,
            message: 'Result updated',
            result: {
                result_id: Number(req.params.id),
                student_id: parsedStudentId,
                course_id: parsedCourseId,
                marks: parsedMarks,
                grade
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.sqlMessage || 'Could not update result' });
    }
});

router.delete('/results/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM Results WHERE result_id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Result not found' });
        }
        res.json({ success: true, message: 'Result deleted' });
    } catch (err) {
        res.status(400).json({ error: err.sqlMessage || 'Could not delete result' });
    }
});

// ---------- Add student (calls Person B's insert_new_student procedure) ----------
router.post('/students', async (req, res) => {
    const { name, department } = req.body;
    if (!name || !department) return res.status(400).json({ error: 'name and department are required' });
    try {
        await pool.query('CALL insert_new_student(?, ?)', [name, department]);
        res.json({ success: true, message: `${name} added to ${department}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.sqlMessage || 'Failed to add student' });
    }
});

// ---------- Enroll a student in a course ----------
router.post('/enrollments', async (req, res) => {
    const { student_id, course_id, semester } = req.body;
    try {
        await pool.query(
            'INSERT INTO Enrollment (student_id, course_id, semester) VALUES (?, ?, ?)',
            [student_id, course_id, semester]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.sqlMessage || 'Enrollment failed' });
    }
});

// ---------- Insert marks (fires update_grade + validate_enrollment triggers) ----------
router.post('/results', async (req, res) => {
    const { student_id, course_id, marks } = req.body;
    if (student_id == null || course_id == null || marks == null) {
        return res.status(400).json({ error: 'student_id, course_id and marks are required' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO Results (student_id, course_id, marks) VALUES (?, ?, ?)',
            [student_id, course_id, marks]
        );
        const [[row]] = await pool.query('SELECT * FROM Results WHERE result_id = ?', [result.insertId]);
        res.json({ success: true, message: 'Grade auto-calculated by trigger', result: row });
    } catch (err) {
        // This is where validate_enrollment trigger's SIGNAL error surfaces if the student isn't enrolled
        res.status(400).json({ error: err.sqlMessage || 'Could not insert result' });
    }
});

// ---------- Mark attendance (fires check_low_attendance trigger) ----------
router.post('/attendance', async (req, res) => {
    const { student_id, course_id, date, status } = req.body;
    if (!student_id || !course_id || !date || !status) {
        return res.status(400).json({ error: 'student_id, course_id, date and status are required' });
    }
    try {
        await pool.query(
            'INSERT INTO Attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)',
            [student_id, course_id, date, status]
        );
        // Check if the trigger just created a new low-attendance notification
        const [notifs] = await pool.query(
            `SELECT * FROM attendance_notifications
             WHERE student_id = ? AND course_id = ?
             ORDER BY created_at DESC LIMIT 1`,
            [student_id, course_id]
        );
        res.json({ success: true, triggeredNotification: notifs[0] || null });
    } catch (err) {
        res.status(400).json({ error: err.sqlMessage || 'Could not mark attendance' });
    }
});

router.get('/notifications', async (req, res) => {
    const [rows] = await pool.query(
        `SELECT n.*, s.name AS student_name, c.name AS course_name
         FROM attendance_notifications n
         JOIN Students s ON n.student_id = s.student_id
         JOIN Courses c ON n.course_id = c.course_id
         ORDER BY n.created_at DESC`
    );
    res.json(rows);
});

// ---------- Reports: Person C's views ----------
router.get('/reports/department', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM department_student_report');
    res.json(rows);
});

router.get('/reports/semester', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM semester_result_summary');
    res.json(rows);
});

router.get('/reports/enrollment-stats', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM course_enrollment_stats');
    res.json(rows);
});

// ---------- Course attendance report (calls Person B's stored procedure) ----------
router.get('/reports/attendance/:courseId', async (req, res) => {
    const minAttendance = req.query.min || 75;
    try {
        const [rows] = await pool.query(
            'CALL generate_course_attendance_report(?, ?)',
            [req.params.courseId, minAttendance]
        );
        res.json(rows[0]); // CALL returns [ [dataRows], [metadata] ] - we want the first result set
    } catch (err) {
        res.status(500).json({ error: err.sqlMessage || 'Report failed' });
    }
});

// ---------- Any student's GPA (admin view) ----------
router.get('/gpa/:studentId', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.query('SET @gpa = ?', [0]);
        await conn.query('SET @grade = ?', ['']);
        await conn.query('CALL calculate_student_gpa(?, @gpa, @grade)', [req.params.studentId]);
        const [[result]] = await conn.query('SELECT @gpa AS gpa, @grade AS letter_grade');
        res.json(result);
    } finally {
        conn.release();
    }
});

module.exports = router;
