async function api(path) {
    const res = await fetch(path);
    if (res.status === 403) {
        window.location.href = 'index.html';
        return null;
    }
    return res.json();
}

function gradeBadgeClass(grade) {
    if (!grade) return '';
    const g = grade.toLowerCase();
    if (g === 'a') return 'a';
    if (g === 'b') return 'b';
    if (g === 'f') return 'f';
    return '';
}

async function loadEverything() {
    // Session / who am I
    const session = await api('/api/auth/session');
    if (!session || !session.loggedIn) { window.location.href = 'index.html'; return; }
    document.getElementById('whoAmI').textContent = session.studentName + ' (ID: ' + session.studentId + ')';

    // Profile
    const profile = await api('/api/student/profile');
    document.getElementById('deptValue').textContent = profile.department || '—';

    // GPA
    const gpa = await api('/api/student/gpa');
    document.getElementById('gpaValue').textContent = gpa.gpa != null ? Number(gpa.gpa).toFixed(2) : '—';
    document.getElementById('letterGradeValue').textContent = gpa.letter_grade || '—';

    // Courses
    const courses = await api('/api/student/courses');
    document.getElementById('courseCountValue').textContent = courses.length;
    const coursesBody = document.querySelector('#coursesTable tbody');
    coursesBody.innerHTML = courses.length
        ? courses.map(c => `<tr><td>${c.course_id}</td><td>${c.course_name}</td><td>${c.department}</td><td>${c.credits}</td><td>${c.semester}</td></tr>`).join('')
        : '<tr><td colspan="5" class="empty-state">No courses enrolled yet.</td></tr>';

    // Attendance
    const attendance = await api('/api/student/attendance');
    const attBody = document.querySelector('#attendanceTable tbody');
    attBody.innerHTML = attendance.length
        ? attendance.map(a => {
            const pct = Number(a.attendance_percentage);
            const status = pct >= 75 ? 'satisfactory' : 'unsatisfactory';
            const label = pct >= 75 ? 'Satisfactory' : 'Low';
            return `<tr><td>${a.course_name}</td><td>${a.present_count}</td><td>${a.total_classes}</td><td>${pct.toFixed(2)}%</td><td><span class="badge ${status}">${label}</span></td></tr>`;
        }).join('')
        : '<tr><td colspan="5" class="empty-state">No attendance records yet.</td></tr>';

    // Results
    const results = await api('/api/student/results');
    const resBody = document.querySelector('#resultsTable tbody');
    resBody.innerHTML = results.length
        ? results.map(r => `<tr><td>${r.course_name}</td><td>${r.marks}</td><td><span class="badge ${gradeBadgeClass(r.grade)}">${r.grade}</span></td></tr>`).join('')
        : '<tr><td colspan="3" class="empty-state">No results published yet.</td></tr>';

    // Notifications (only show section if there are any)
    const notifs = await api('/api/student/notifications');
    if (notifs.length) {
        document.getElementById('notifSection').style.display = 'block';
        document.getElementById('notifList').innerHTML = notifs.map(n =>
            `<div class="notif-item"><strong>${n.course_name}:</strong> ${n.message}</div>`
        ).join('');
    }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
});

loadEverything();
