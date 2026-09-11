async function api(path, opts = {}) {
    const res = await fetch(path, opts);
    if (res.status === 403) {
        window.location.href = 'index.html';
        return null;
    }
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
}

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const editModalBackdrop = document.getElementById('editModalBackdrop');
const editModalTitle = document.getElementById('editModalTitle');
const editModalFields = document.getElementById('editModalFields');
const editModalForm = document.getElementById('editModalForm');
const closeEditModalBtn = document.getElementById('closeEditModal');
const cancelEditModalBtn = document.getElementById('cancelEditModal');

function closeEditModal() {
    editModalBackdrop.classList.add('hidden');
    editModalBackdrop.setAttribute('aria-hidden', 'true');
    editModalForm.reset();
    editModalFields.innerHTML = '';
}

function openEditModal({ title, fields, onSubmit }) {
    editModalTitle.textContent = title;
    editModalFields.innerHTML = fields.map(field => {
        const { name, label, type = 'text', value = '', placeholder = '', min, max, step } = field;
        const valueMarkup = escapeHtml(String(value ?? ''));
        const attrs = [];
        if (placeholder) attrs.push(`placeholder="${escapeHtml(placeholder)}"`);
        if (min !== undefined) attrs.push(`min="${min}"`);
        if (max !== undefined) attrs.push(`max="${max}"`);
        if (step !== undefined) attrs.push(`step="${step}"`);
        return `<div class="field">
            <label for="edit-${name}">${escapeHtml(label)}</label>
            <input id="edit-${name}" name="${name}" type="${type}" value="${valueMarkup}" ${attrs.join(' ')}>
        </div>`;
    }).join('');

    editModalForm.onsubmit = async (e) => {
        e.preventDefault();
        const payload = Object.fromEntries(new FormData(editModalForm).entries());
        const success = await onSubmit(payload);
        if (success !== false) closeEditModal();
    };

    editModalBackdrop.classList.remove('hidden');
    editModalBackdrop.setAttribute('aria-hidden', 'false');
}

closeEditModalBtn.addEventListener('click', closeEditModal);
cancelEditModalBtn.addEventListener('click', closeEditModal);
editModalBackdrop.addEventListener('click', (e) => {
    if (e.target === editModalBackdrop) closeEditModal();
});

function refreshAdminLists() {
    loadStudents();
    loadCourses();
    loadEnrollments();
    loadResults();
    loadReports();
    loadNotifications();
}

// ---------- Nav switching ----------
document.querySelectorAll('#adminNav button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#adminNav button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
});

// ---------- Session check ----------
(async function checkSession() {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (!data.loggedIn || data.role !== 'admin') window.location.href = 'index.html';
})();

// ---------- Students ----------
async function loadStudents() {
    const { data } = await api('/api/admin/students');
    const tbody = document.querySelector('#studentsTable tbody');
    tbody.innerHTML = data.map(s =>
        `<tr>
            <td>${s.student_id}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${s.dob ? new Date(s.dob).toLocaleDateString() : '—'}</td>
            <td>${escapeHtml(s.email || '—')}</td>
            <td>${escapeHtml(s.department)}</td>
            <td>
                <button class="btn small secondary" data-edit-student="${s.student_id}" data-name="${escapeHtml(s.name)}" data-dob="${escapeHtml(s.dob || '')}" data-email="${escapeHtml(s.email || '')}" data-department="${escapeHtml(s.department)}">Edit</button>
                <button class="btn small secondary" data-delete-student="${s.student_id}">Delete</button>
            </td>
        </tr>`
    ).join('') || '<tr><td colspan="6" class="empty-state">No students yet.</td></tr>';

    document.querySelectorAll('[data-edit-student]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.editStudent;
            const current = {
                name: btn.dataset.name,
                dob: btn.dataset.dob,
                email: btn.dataset.email,
                department: btn.dataset.department
            };

            openEditModal({
                title: 'Edit student',
                fields: [
                    { name: 'name', label: 'Name', value: current.name },
                    { name: 'dob', label: 'DOB', type: 'date', value: current.dob },
                    { name: 'email', label: 'Email', type: 'email', value: current.email },
                    { name: 'department', label: 'Department', value: current.department }
                ],
                onSubmit: async (payload) => {
                    const { ok, data } = await api(`/api/admin/students/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!ok) {
                        alert(data.error || 'Student update failed');
                        return false;
                    }

                    alert(data.message || 'Student updated');
                    refreshAdminLists();
                    return true;
                }
            });
        });
    });

    document.querySelectorAll('[data-delete-student]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.deleteStudent;
            if (!window.confirm('Delete this student?')) return;

            const { ok, data } = await api(`/api/admin/students/${id}`, { method: 'DELETE' });
            if (!ok) {
                alert(data.error || 'Student deletion failed');
                return;
            }

            alert(data.message || 'Student deleted');
            refreshAdminLists();
        });
    });
}

document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('addStudentMsg');
    const name = document.getElementById('new_student_name').value;
    const department = document.getElementById('new_student_dept').value;
    const { ok, data } = await api('/api/admin/students', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department })
    });
    msg.textContent = ok ? data.message : data.error;
    msg.className = 'msg ' + (ok ? 'success' : 'error');
    if (ok) { e.target.reset(); loadStudents(); }
});

// ---------- Courses & Faculty ----------
async function loadCourses() {
    const { data } = await api('/api/admin/courses');
    const tbody = document.querySelector('#coursesTable tbody');
    tbody.innerHTML = data.map(c =>
        `<tr>
            <td>${c.course_id}</td>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.department)}</td>
            <td>${c.credits}</td>
            <td>
                <button class="btn small secondary" data-edit-course="${c.course_id}" data-name="${escapeHtml(c.name)}" data-department="${escapeHtml(c.department)}" data-credits="${c.credits}">Edit</button>
                <button class="btn small secondary" data-delete-course="${c.course_id}">Delete</button>
            </td>
        </tr>`
    ).join('') || '<tr><td colspan="5" class="empty-state">No courses yet.</td></tr>';

    document.querySelectorAll('[data-edit-course]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.editCourse;
            const current = {
                name: btn.dataset.name,
                department: btn.dataset.department,
                credits: btn.dataset.credits
            };

            openEditModal({
                title: 'Edit course',
                fields: [
                    { name: 'name', label: 'Course name', value: current.name },
                    { name: 'department', label: 'Department', value: current.department },
                    { name: 'credits', label: 'Credits', type: 'number', value: current.credits, min: 1, step: 1 }
                ],
                onSubmit: async (payload) => {
                    const { ok, data } = await api(`/api/admin/courses/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!ok) {
                        alert(data.error || 'Course update failed');
                        return false;
                    }

                    alert(data.message || 'Course updated');
                    refreshAdminLists();
                    return true;
                }
            });
        });
    });

    document.querySelectorAll('[data-delete-course]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.deleteCourse;
            if (!window.confirm('Delete this course?')) return;

            const { ok, data } = await api(`/api/admin/courses/${id}`, { method: 'DELETE' });
            if (!ok) {
                alert(data.error || 'Course deletion failed');
                return;
            }

            alert(data.message || 'Course deleted');
            refreshAdminLists();
        });
    });
}

async function loadFaculty() {
    const { data } = await api('/api/admin/faculty');
    document.querySelector('#facultyTable tbody').innerHTML = data.map(f =>
        `<tr><td>${f.faculty_id}</td><td>${f.name}</td><td>${f.email}</td><td>${f.department}</td></tr>`
    ).join('') || '<tr><td colspan="4" class="empty-state">No faculty yet.</td></tr>';
}

// ---------- Enrollments ----------
async function loadEnrollments() {
    const { data } = await api('/api/admin/enrollments');
    const tbody = document.querySelector('#enrollmentsTable tbody');
    tbody.innerHTML = data.map(e =>
        `<tr>
            <td>${escapeHtml(e.student_name)} (#${e.student_id})</td>
            <td>${escapeHtml(e.course_name)} (#${e.course_id})</td>
            <td>${escapeHtml(e.semester)}</td>
            <td>
                <button class="btn small secondary" data-edit-enrollment="${e.enrollment_id}" data-student-id="${e.student_id}" data-course-id="${e.course_id}" data-semester="${escapeHtml(e.semester)}">Edit</button>
                <button class="btn small secondary" data-delete-enrollment="${e.enrollment_id}">Delete</button>
            </td>
        </tr>`
    ).join('') || '<tr><td colspan="4" class="empty-state">No enrollments yet.</td></tr>';

    document.querySelectorAll('[data-edit-enrollment]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.editEnrollment;
            const current = {
                student_id: btn.dataset.studentId,
                course_id: btn.dataset.courseId,
                semester: btn.dataset.semester
            };

            openEditModal({
                title: 'Edit enrollment',
                fields: [
                    { name: 'student_id', label: 'Student ID', type: 'number', value: current.student_id, min: 1, step: 1 },
                    { name: 'course_id', label: 'Course ID', type: 'number', value: current.course_id, min: 1, step: 1 },
                    { name: 'semester', label: 'Semester', value: current.semester }
                ],
                onSubmit: async (payload) => {
                    const { ok, data } = await api(`/api/admin/enrollments/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!ok) {
                        alert(data.error || 'Enrollment update failed');
                        return false;
                    }

                    alert(data.message || 'Enrollment updated');
                    refreshAdminLists();
                    return true;
                }
            });
        });
    });

    document.querySelectorAll('[data-delete-enrollment]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.deleteEnrollment;
            if (!window.confirm('Delete this enrollment?')) return;

            const { ok, data } = await api(`/api/admin/enrollments/${id}`, { method: 'DELETE' });
            if (!ok) {
                alert(data.error || 'Enrollment deletion failed');
                return;
            }

            alert(data.message || 'Enrollment deleted');
            refreshAdminLists();
        });
    });
}

document.getElementById('addEnrollmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('addEnrollmentMsg');
    const student_id = document.getElementById('enr_student_id').value;
    const course_id = document.getElementById('enr_course_id').value;
    const semester = document.getElementById('enr_semester').value;
    const { ok, data } = await api('/api/admin/enrollments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, course_id, semester })
    });
    msg.textContent = ok ? 'Enrolled successfully.' : data.error;
    msg.className = 'msg ' + (ok ? 'success' : 'error');
    if (ok) { e.target.reset(); loadEnrollments(); }
});

// ---------- Results ----------
async function loadResults() {
    const { data } = await api('/api/admin/results');
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = data.map(r =>
        `<tr>
            <td>${r.result_id}</td>
            <td>${escapeHtml(r.student_name)} (#${r.student_id})</td>
            <td>${escapeHtml(r.course_name)} (#${r.course_id})</td>
            <td>${r.marks}</td>
            <td><span class="badge ${r.grade === 'A' ? 'a' : r.grade === 'F' ? 'f' : 'b'}">${r.grade}</span></td>
            <td>
                <button class="btn small secondary" data-edit-result="${r.result_id}" data-student-id="${r.student_id}" data-course-id="${r.course_id}" data-marks="${r.marks}">Edit</button>
                <button class="btn small secondary" data-delete-result="${r.result_id}">Delete</button>
            </td>
        </tr>`
    ).join('') || '<tr><td colspan="6" class="empty-state">No results yet.</td></tr>';

    document.querySelectorAll('[data-edit-result]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.editResult;
            const current = {
                student_id: btn.dataset.studentId,
                course_id: btn.dataset.courseId,
                marks: btn.dataset.marks
            };

            openEditModal({
                title: 'Edit result',
                fields: [
                    { name: 'student_id', label: 'Student ID', type: 'number', value: current.student_id, min: 1, step: 1 },
                    { name: 'course_id', label: 'Course ID', type: 'number', value: current.course_id, min: 1, step: 1 },
                    { name: 'marks', label: 'Marks', type: 'number', value: current.marks, min: 0, max: 100, step: 1 }
                ],
                onSubmit: async (payload) => {
                    const { ok, data } = await api(`/api/admin/results/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!ok) {
                        alert(data.error || 'Result update failed');
                        return false;
                    }

                    alert(data.message || 'Result updated');
                    refreshAdminLists();
                    return true;
                }
            });
        });
    });

    document.querySelectorAll('[data-delete-result]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.deleteResult;
            if (!window.confirm('Delete this result?')) return;

            const { ok, data } = await api(`/api/admin/results/${id}`, { method: 'DELETE' });
            if (!ok) {
                alert(data.error || 'Result deletion failed');
                return;
            }

            alert(data.message || 'Result deleted');
            refreshAdminLists();
        });
    });
}

// ---------- Add Result (triggers: update_grade, validate_enrollment) ----------
document.getElementById('addResultForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('addResultMsg');
    const outcome = document.getElementById('resultOutcome');
    const student_id = document.getElementById('res_student_id').value;
    const course_id = document.getElementById('res_course_id').value;
    const marks = document.getElementById('res_marks').value;

    const { ok, data } = await api('/api/admin/results', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, course_id, marks })
    });

    if (!ok) {
        msg.textContent = data.error;
        msg.className = 'msg error';
        outcome.innerHTML = `<div class="panel" style="border-color:var(--alert);"><strong>Trigger blocked this insert:</strong> ${data.error}<br><span style="font-size:12px; color:var(--slate);">This is validate_enrollment doing its job — the student isn't enrolled in this course.</span></div>`;
        return;
    }
    msg.textContent = data.message;
    msg.className = 'msg success';
    outcome.innerHTML = `<div class="panel" style="border-color:var(--success);">
        <strong>Grade auto-calculated by trigger:</strong>
        Student ${data.result.student_id}, Course ${data.result.course_id} → Marks ${data.result.marks}, Grade
        <span class="badge ${data.result.grade === 'A' ? 'a' : data.result.grade === 'F' ? 'f' : 'b'}">${data.result.grade}</span>
    </div>`;
    e.target.reset();
    loadResults();
});

// ---------- Mark Attendance (trigger: check_low_attendance) ----------
document.getElementById('addAttendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('addAttendanceMsg');
    const outcome = document.getElementById('attendanceOutcome');
    const student_id = document.getElementById('att_student_id').value;
    const course_id = document.getElementById('att_course_id').value;
    const date = document.getElementById('att_date').value;
    const status = document.getElementById('att_status').value;

    const { ok, data } = await api('/api/admin/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, course_id, date, status })
    });

    if (!ok) {
        msg.textContent = data.error;
        msg.className = 'msg error';
        return;
    }
    msg.textContent = 'Attendance recorded.';
    msg.className = 'msg success';

    if (data.triggeredNotification) {
        outcome.innerHTML = `<div class="panel" style="border-color:var(--alert);">
            <strong>check_low_attendance trigger fired:</strong> ${data.triggeredNotification.message}
        </div>`;
    } else {
        outcome.innerHTML = `<div class="panel" style="border-color:var(--success);">Recorded — attendance is above threshold (or fewer than 5 classes so far), so no warning was generated.</div>`;
    }
    e.target.reset();
});

// ---------- Reports (views) ----------
async function loadReports() {
    const dept = await api('/api/admin/reports/department');
    document.querySelector('#deptReportTable tbody').innerHTML = dept.data.map(d =>
        `<tr><td>${d.department}</td><td>${d.student_count}</td><td>${Number(d.avg_gpa).toFixed(2)}</td><td>${d.a_students}</td><td>${d.ab_students}</td></tr>`
    ).join('');

    const sem = await api('/api/admin/reports/semester');
    document.querySelector('#semesterReportTable tbody').innerHTML = sem.data.map(s =>
        `<tr><td>${s.course_name}</td><td>${s.department}</td><td>${s.students_enrolled}</td><td>${s.avg_marks != null ? Number(s.avg_marks).toFixed(1) : '—'}</td><td>${s.min_marks ?? '—'}</td><td>${s.max_marks ?? '—'}</td><td>${s.a_grades}</td><td>${s.f_grades}</td></tr>`
    ).join('');

    const enr = await api('/api/admin/reports/enrollment-stats');
    document.querySelector('#enrollmentStatsTable tbody').innerHTML = enr.data.map(c =>
        `<tr><td>${c.course_name}</td><td>${c.department}</td><td>${c.credits}</td><td>${c.enrolled_students}</td><td>${c.students_with_attendance}</td><td>${c.students_with_results}</td></tr>`
    ).join('');
}

document.getElementById('attReportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('report_course_id').value;
    const min = document.getElementById('report_min_attendance').value;
    const { ok, data } = await api(`/api/admin/reports/attendance/${courseId}?min=${min}`);
    const tbody = document.querySelector('#attReportTable tbody');
    if (!ok || !data.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No attendance data for this course.</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(r =>
        `<tr><td>${r.name}</td><td>${r.present_count}</td><td>${r.total_classes}</td><td>${r.attendance_percentage}%</td><td><span class="badge ${r.attendance_status.toLowerCase()}">${r.attendance_status}</span></td></tr>`
    ).join('');
});

// ---------- Notifications ----------
async function loadNotifications() {
    const { data } = await api('/api/admin/notifications');
    document.getElementById('notifList').innerHTML = data.length
        ? data.map(n => `<div class="notif-item"><strong>${n.student_name}</strong> — ${n.course_name}: ${n.message}</div>`).join('')
        : '<div class="empty-state">No low-attendance warnings generated yet.</div>';
}

// ---------- GPA Lookup ----------
document.getElementById('gpaLookupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('gpa_student_id').value;
    const { ok, data } = await api(`/api/admin/gpa/${id}`);
    const box = document.getElementById('gpaResult');
    if (!ok) { box.textContent = 'Could not calculate GPA.'; return; }
    box.innerHTML = data.gpa != null
        ? `<strong>GPA:</strong> ${Number(data.gpa).toFixed(2)} &nbsp; <strong>Letter Grade:</strong> ${data.letter_grade}`
        : 'No results on record for this student yet.';
});

// ---------- Initial load ----------
loadStudents();
loadCourses();
loadFaculty();
loadEnrollments();
loadResults();
loadReports();
loadNotifications();
