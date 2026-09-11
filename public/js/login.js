// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
});

// Check if already logged in - redirect straight to the right dashboard
(async function checkSession() {
    try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.loggedIn) {
            window.location.href = data.role === 'admin' ? 'admin.html' : 'student.html';
        }
    } catch (e) { /* not logged in, stay here */ }
})();

// Student login
document.getElementById('studentLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('studentMsg');
    msg.textContent = '';
    msg.className = 'msg';

    const student_id = document.getElementById('s_id').value;
    const email = document.getElementById('s_email').value;

    try {
        const res = await fetch('/api/auth/student-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id, email })
        });
        const data = await res.json();
        if (!res.ok) {
            msg.textContent = data.error || 'Login failed';
            msg.className = 'msg error';
            return;
        }
        msg.textContent = 'Welcome, ' + data.student.name + '. Redirecting...';
        msg.className = 'msg success';
        setTimeout(() => window.location.href = 'student.html', 500);
    } catch (err) {
        msg.textContent = 'Could not reach the server. Is it running?';
        msg.className = 'msg error';
    }
});

// Admin login
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('adminMsg');
    msg.textContent = '';
    msg.className = 'msg';

    const username = document.getElementById('a_user').value;
    const password = document.getElementById('a_pass').value;

    try {
        const res = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
            msg.textContent = data.error || 'Login failed';
            msg.className = 'msg error';
            return;
        }
        msg.textContent = 'Welcome, admin. Redirecting...';
        msg.className = 'msg success';
        setTimeout(() => window.location.href = 'admin.html', 500);
    } catch (err) {
        msg.textContent = 'Could not reach the server. Is it running?';
        msg.className = 'msg error';
    }
});
