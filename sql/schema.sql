-- ============================================================
-- Centralized College Database System - Full Setup Script
-- Run this once on a fresh MySQL database:
--   mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS college_db;
USE college_db;

-- ---------- TABLES ----------

DROP TABLE IF EXISTS attendance_notifications;
DROP TABLE IF EXISTS Results;
DROP TABLE IF EXISTS Attendance;
DROP TABLE IF EXISTS Enrollment;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Faculty;
DROP TABLE IF EXISTS Students;

CREATE TABLE Students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    dob DATE DEFAULT '2000-01-01' NULL,
    email VARCHAR(255) DEFAULT 'not_provided@example.com' NULL,
    department VARCHAR(50) NOT NULL
);

CREATE TABLE Faculty (
    faculty_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL
);

CREATE TABLE Courses (
    course_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    credits INT NOT NULL
);

CREATE TABLE Enrollment (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    semester VARCHAR(50) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id),
    UNIQUE KEY (student_id, course_id)
);

CREATE TABLE Attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent') NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

CREATE TABLE Results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    marks INT NOT NULL,
    grade VARCHAR(2),
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

CREATE TABLE attendance_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_id INT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- ---------- SAMPLE DATA ----------

INSERT INTO Students (student_id, name, dob, email, department) VALUES
(1, 'John Anderson', '2000-05-15', 'john.anderson@college.edu', 'CSE'),
(2, 'Sarah Mitchell', '2001-03-22', 'sarah.mitchell@college.edu', 'IT'),
(3, 'David Kim', '1999-11-08', 'david.kim@college.edu', 'ECE'),
(4, 'Emily Chen', '2000-07-30', 'emily.chen@college.edu', 'CSE'),
(5, 'Michael Rodriguez', '2001-01-18', 'michael.rodriguez@college.edu','MECH'),
(6, 'Jessica Wong', '1999-09-25', 'jessica.wong@college.edu', 'MBA'),
(7, 'Daniel Brown', '2000-12-05', 'daniel.brown@college.edu', 'IT'),
(8, 'Olivia Patel', '2001-02-14', 'olivia.patel@college.edu', 'CSE'),
(9, 'James Wilson', '1999-08-19', 'james.wilson@college.edu', 'CIVIL'),
(10, 'Sophia Garcia', '2000-04-27', 'sophia.garcia@college.edu', 'EEE'),
(11, 'Ethan Martinez', '2001-06-12', 'ethan.martinez@college.edu', 'ECE'),
(12, 'Ava Thompson', '1999-10-31', 'ava.thompson@college.edu', 'MECH'),
(13, 'Noah Lee', '2000-02-09', 'noah.lee@college.edu', 'CSE'),
(14, 'Isabella Clark', '2001-07-23', 'isabella.clark@college.edu', 'IT'),
(15, 'Liam Adams', '1999-12-17', 'liam.adams@college.edu', 'MBA'),
(16, 'Rahul Sharma', '2000-08-12', 'rahul.sharma@college.edu', 'CSE'),
(17, 'Deepak Singh', '2000-05-30', 'deepak.singh@college.edu', 'EEE'),
(18, 'Neha Gupta', '2000-12-15', 'neha.gupta@college.edu', 'ECE'),
(19, 'Arjun Nair', '2000-02-20', 'arjun.nair@college.edu', 'MECH'),
(20, 'Sanjay Mehta', '2000-09-03', 'sanjay.mehta@college.edu', 'CIVIL');

INSERT INTO Faculty (faculty_id, name, email, department) VALUES
(1, 'Dr. Rajesh Sharma', 'rajesh.sharma@college.edu', 'CSE'),
(2, 'Prof. Anil Kumar', 'anil.kumar@college.edu', 'MBA'),
(3, 'Dr. Priya Patel', 'priya.patel@college.edu', 'ECE'),
(4, 'Prof. Sanjay Verma', 'sanjay.verma@college.edu', 'IT'),
(5, 'Dr. Meena Iyer', 'meena.iyer@college.edu', 'EEE'),
(6, 'Prof. Vikram Joshi', 'vikram.joshi@college.edu', 'MECH'),
(7, 'Dr. Arvind Reddy', 'arvind.reddy@college.edu', 'CIVIL'),
(8, 'Prof. Neha Gupta', 'neha.gupta2@college.edu', 'MBA'),
(9, 'Dr. Ramesh Nair', 'ramesh.nair@college.edu', 'IT'),
(10, 'Prof. Divya Menon', 'divya.menon@college.edu', 'CSE'),
(11, 'Dr. Vikram Singh', 'vikram.singh@college.edu', 'ECE'),
(12, 'Prof. Anjali Rao', 'anjali.rao@college.edu', 'EEE'),
(13, 'Dr. Prakash Joshi', 'prakash.joshi@college.edu', 'MECH'),
(14, 'Prof. Deepak Kumar', 'deepak.kumar@college.edu', 'CIVIL'),
(15, 'Dr. Swati Malhotra', 'swati.malhotra@college.edu', 'MBA'),
(16, 'Prof. Harish Srinivasan', 'harish.srinivasan@college.edu', 'IT'),
(17, 'Dr. Pooja Banerjee', 'pooja.banerjee@college.edu', 'CSE'),
(18, 'Prof. Aditya Das', 'aditya.das@college.edu', 'ECE'),
(19, 'Dr. Nisha Khanna', 'nisha.khanna@college.edu', 'EEE'),
(20, 'Prof. Rajeev Mehta', 'rajeev.mehta@college.edu', 'MECH');

INSERT INTO Courses (course_id, name, department, credits) VALUES
(101, 'Financial Accounting', 'MBA', 3),
(102, 'Embedded Systems', 'ECE', 4),
(103, 'Thermodynamics', 'MECH', 3),
(104, 'Machine Learning', 'CSE', 4),
(105, 'Construction Management', 'CIVIL', 3),
(106, 'Digital Marketing', 'MBA', 3),
(107, 'Power Systems', 'EEE', 4),
(108, 'Web Technologies', 'IT', 3),
(109, 'VLSI Design', 'ECE', 4),
(110, 'Database Administration', 'IT', 4),
(111, 'Supply Chain Management', 'MBA', 3),
(112, 'Robotics', 'MECH', 4),
(113, 'Artificial Intelligence', 'CSE', 4),
(114, 'Structural Engineering', 'CIVIL', 4),
(115, 'Renewable Energy Systems', 'EEE', 3);

INSERT INTO Enrollment (student_id, course_id, semester) VALUES
(1, 101, 'Fall 2023'), (2, 102, 'Spring 2024'), (3, 103, 'Winter 2023'),
(4, 104, 'Summer 2024'), (5, 105, 'Fall 2024'), (6, 106, 'Spring 2023'),
(7, 107, 'Winter 2024'), (8, 108, 'Summer 2023'), (9, 109, 'Fall 2023'),
(10, 110, 'Spring 2024'), (11, 111, 'Winter 2023'), (12, 112, 'Summer 2024'),
(13, 113, 'Fall 2024'), (14, 114, 'Spring 2023'), (15, 115, 'Winter 2024'),
(16, 101, 'Summer 2023'), (17, 102, 'Fall 2023'), (18, 103, 'Spring 2024'),
(19, 104, 'Winter 2023'), (20, 105, 'Summer 2024');

INSERT INTO Attendance (student_id, course_id, date, status) VALUES
(1, 101, '2025-07-01', 'Present'), (2, 102, '2025-07-01', 'Absent'),
(3, 103, '2025-07-01', 'Present'), (4, 104, '2025-07-01', 'Present'),
(5, 105, '2025-07-01', 'Absent'), (6, 106, '2025-07-01', 'Present'),
(7, 107, '2025-07-01', 'Present'), (8, 108, '2025-07-01', 'Absent'),
(9, 109, '2025-07-01', 'Present'), (10, 110, '2025-07-01', 'Present'),
(11, 111, '2025-07-01', 'Absent'), (12, 112, '2025-07-01', 'Present'),
(13, 113, '2025-07-01', 'Present'), (14, 114, '2025-07-01', 'Absent'),
(15, 115, '2025-07-01', 'Present'), (16, 101, '2025-07-01', 'Present'),
(17, 102, '2025-07-01', 'Absent'), (18, 103, '2025-07-01', 'Present'),
(19, 104, '2025-07-01', 'Present'), (20, 105, '2025-07-01', 'Absent');

-- ---------- TRIGGERS ----------

DELIMITER //
CREATE TRIGGER update_grade
BEFORE INSERT ON Results
FOR EACH ROW
BEGIN
    IF NEW.marks >= 90 THEN SET NEW.grade = 'A';
    ELSEIF NEW.marks >= 80 THEN SET NEW.grade = 'B';
    ELSEIF NEW.marks >= 70 THEN SET NEW.grade = 'C';
    ELSEIF NEW.marks >= 60 THEN SET NEW.grade = 'D';
    ELSE SET NEW.grade = 'F';
    END IF;
END//
DELIMITER ;

DELIMITER $$
CREATE TRIGGER check_low_attendance
AFTER INSERT ON Attendance
FOR EACH ROW
BEGIN
    DECLARE attendance_percentage DECIMAL(5,2);
    DECLARE total_classes INT;
    DECLARE present_classes INT;

    SELECT COUNT(*) INTO total_classes
    FROM Attendance
    WHERE student_id = NEW.student_id AND course_id = NEW.course_id;

    SELECT COUNT(*) INTO present_classes
    FROM Attendance
    WHERE student_id = NEW.student_id AND course_id = NEW.course_id AND LOWER(status) = 'present';

    SET attendance_percentage = (present_classes / total_classes) * 100;

    IF attendance_percentage < 75 AND total_classes >= 5 THEN
        INSERT INTO attendance_notifications (student_id, course_id, message)
        VALUES (
            NEW.student_id,
            NEW.course_id,
            CONCAT('Low attendance warning: ', ROUND(attendance_percentage, 2), '% attendance')
        );
    END IF;
END$$
DELIMITER ;

DELIMITER //
CREATE TRIGGER validate_enrollment
BEFORE INSERT ON Results
FOR EACH ROW
BEGIN
    DECLARE enrollment_count INT;
    SELECT COUNT(*) INTO enrollment_count
    FROM Enrollment
    WHERE student_id = NEW.student_id AND course_id = NEW.course_id;

    IF enrollment_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not enrolled in this course';
    END IF;
END//
DELIMITER ;

-- ---------- STORED PROCEDURES ----------

DELIMITER //
CREATE PROCEDURE insert_new_student (
    IN p_name VARCHAR(100),
    IN p_department VARCHAR(100)
)
BEGIN
    INSERT INTO Students (name, department) VALUES (p_name, p_department);
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE calculate_student_gpa(
    IN p_student_id INT,
    OUT p_gpa DECIMAL(3,2),
    OUT p_letter_grade VARCHAR(2)
)
BEGIN
    SELECT AVG(
        CASE
            WHEN grade = 'A' THEN 4.0
            WHEN grade = 'B' THEN 3.0
            WHEN grade = 'C' THEN 2.0
            WHEN grade = 'D' THEN 1.0
            ELSE 0.0
        END
    ) INTO p_gpa
    FROM Results
    WHERE student_id = p_student_id;

    IF p_gpa >= 3.5 THEN SET p_letter_grade = 'A';
    ELSEIF p_gpa >= 2.5 THEN SET p_letter_grade = 'B';
    ELSEIF p_gpa >= 1.5 THEN SET p_letter_grade = 'C';
    ELSEIF p_gpa >= 0.5 THEN SET p_letter_grade = 'D';
    ELSE SET p_letter_grade = 'F';
    END IF;
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE generate_course_attendance_report(
    IN p_course_id INT,
    IN p_min_attendance DECIMAL(5,2)
)
BEGIN
    SELECT
        s.student_id, s.name, s.email,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_count,
        COUNT(*) AS total_classes,
        ROUND((COUNT(CASE WHEN a.status = 'Present' THEN 1 END) / COUNT(*)) * 100, 2) AS attendance_percentage,
        CASE
            WHEN (COUNT(CASE WHEN a.status = 'Present' THEN 1 END) / COUNT(*)) * 100 >= p_min_attendance
            THEN 'Satisfactory' ELSE 'Unsatisfactory'
        END AS attendance_status
    FROM Students s
    JOIN Enrollment e ON s.student_id = e.student_id
    JOIN Attendance a ON s.student_id = a.student_id AND e.course_id = a.course_id
    WHERE e.course_id = p_course_id
    GROUP BY s.student_id, s.name, s.email
    ORDER BY attendance_percentage DESC;
END//
DELIMITER ;

-- ---------- VIEWS ----------

CREATE VIEW department_student_report AS
SELECT
    s.department,
    COUNT(*) AS student_count,
    AVG(
        CASE
            WHEN r.grade = 'A' THEN 4.0
            WHEN r.grade = 'B' THEN 3.0
            WHEN r.grade = 'C' THEN 2.0
            WHEN r.grade = 'D' THEN 1.0
            ELSE 0.0
        END
    ) AS avg_gpa,
    COUNT(DISTINCT CASE WHEN r.grade = 'A' THEN s.student_id END) AS a_students,
    COUNT(DISTINCT CASE WHEN r.grade IN ('B','A') THEN s.student_id END) AS ab_students
FROM Students s
LEFT JOIN Results r ON s.student_id = r.student_id
GROUP BY s.department;

CREATE VIEW semester_result_summary AS
SELECT
    c.course_id, c.name AS course_name, c.department,
    COUNT(DISTINCT r.student_id) AS students_enrolled,
    AVG(r.marks) AS avg_marks, MIN(r.marks) AS min_marks, MAX(r.marks) AS max_marks,
    COUNT(CASE WHEN r.grade = 'A' THEN 1 END) AS a_grades,
    COUNT(CASE WHEN r.grade = 'F' THEN 1 END) AS f_grades
FROM Courses c
LEFT JOIN Results r ON c.course_id = r.course_id
GROUP BY c.course_id, c.name, c.department;

CREATE VIEW course_enrollment_stats AS
SELECT
    c.course_id, c.name AS course_name, c.department, c.credits,
    COUNT(DISTINCT e.student_id) AS enrolled_students,
    COUNT(DISTINCT a.student_id) AS students_with_attendance,
    COUNT(DISTINCT r.student_id) AS students_with_results,
    COUNT(DISTINCT e.student_id) - COUNT(DISTINCT a.student_id) AS students_without_attendance
FROM Courses c
LEFT JOIN Enrollment e ON c.course_id = e.course_id
LEFT JOIN Attendance a ON c.course_id = a.course_id
LEFT JOIN Results r ON c.course_id = r.course_id
GROUP BY c.course_id, c.name, c.department, c.credits;

-- ---------- SEED RESULTS (inserted after triggers exist, so grades auto-fill) ----------

INSERT INTO Results (student_id, course_id, marks) VALUES
(1, 101, 85), (2, 102, 72), (3, 103, 90), (4, 104, 65), (5, 105, 78),
(6, 106, 88), (7, 107, 59), (8, 108, 93), (9, 109, 70), (10, 110, 82),
(11, 111, 76), (12, 112, 67), (13, 113, 91), (14, 114, 74), (15, 115, 86),
(16, 101, 69), (17, 102, 80), (18, 103, 94), (19, 104, 62), (20, 105, 77);

-- Setup complete. Verify with:  SELECT * FROM Students;
