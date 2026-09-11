# Centralized College Database System — Web App

A Node.js + Express + MySQL web app with separate **Student** and **Admin** portals, built directly on top of your existing database (same tables, triggers, procedures, and views you already tested in MySQL Workbench / command line).

## What this is

- **Student portal**: logs in with Student ID + email, sees their own profile, enrolled courses, attendance %, results, GPA (calls `calculate_student_gpa`), and any low-attendance notifications.
- **Admin portal**: manage students/courses/enrollments, add results and mark attendance (which fires your `update_grade`, `validate_enrollment`, and `check_low_attendance` triggers live), run all 3 views and the attendance-report procedure, look up any student's GPA.

Nothing in your database layer changes — this app just calls the same SQL you already built.

## Prerequisites

- Node.js installed ([nodejs.org](https://nodejs.org) — LTS version)
- MySQL running with the `college_db` database already set up (use `college_db_complete.sql` from earlier, or `sql/schema.sql` in this folder — they're equivalent)

## Setup

1. **Install dependencies**
   ```
   cd college-db-system
   npm install
   ```

2. **Configure your database connection**

   Copy `.env.example` to `.env`:
   ```
   copy .env.example .env
   ```
   (On Mac/Linux: `cp .env.example .env`)

   Open `.env` and fill in your real MySQL password:
   ```
   DB_PASSWORD=your_actual_mysql_password
   ```
   Leave the rest as-is unless your MySQL runs on a different host/port.

   You can also change the admin login here:
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

3. **If you haven't set up the database yet**, run:
   ```
   mysql -u root -p < sql/schema.sql
   ```
   This creates the `college_db` database with everything already built (tables, sample data, triggers, procedures, views).

4. **Start the server**
   ```
   npm start
   ```
   You should see:
   ```
   Centralized College Database System running at http://localhost:3000
   ```

5. **Open it in your browser**
   ```
   http://localhost:3000
   ```

## Logging in

**As a student:** use any Student ID + matching email from the sample data.

**As admin:** use the credentials configured in `.env`.

## Project structure

```
college-db-system/
├── server.js              Express app entry point
├── db.js                  MySQL connection pool
├── routes/
│   ├── auth.js             Login/logout/session for both roles
│   ├── student.js          Student-only endpoints (own data only)
│   └── admin.js             Admin-only endpoints (manage + reports)
├── public/                 Frontend (plain HTML/CSS/JS, no build step)
│   ├── index.html           Login page
│   ├── student.html         Student dashboard
│   ├── admin.html            Admin dashboard
│   ├── css/style.css
│   └── js/                  One script per page
├── sql/schema.sql          Full database setup script
└── .env.example             Copy this to .env and fill in your password
```

## Demo tips

- **Add Result** (Admin → Add Result tab): try submitting marks for a student who ISN'T enrolled in that course — you'll see the `validate_enrollment` trigger block it with a live error message on screen. Then enroll them (Enrollments tab) and retry — it'll succeed and show the auto-calculated grade.
- **Mark Attendance** (Admin → Mark Attendance tab): mark a student "Absent" repeatedly for the same course (5+ times) and watch the low-attendance warning appear automatically in the response panel, and again under the Notifications tab.
- **Reports tab**: all three views plus the parameterized attendance-report procedure are live here — try course ID `105` with a 75% threshold to reproduce the same result you saw in the terminal earlier.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Error: connect ECONNREFUSED` on startup or first request | MySQL isn't running, or `.env` has the wrong password/port |
| Login says "No matching student found" | Double check the Student ID and email match exactly what's in the `Students` table |
| Blank page / can't reach localhost:3000 | Check the terminal running `npm start` for errors; make sure nothing else is using port 3000 |
| `Cannot find module 'express'` | Run `npm install` again inside the `college-db-system` folder |
