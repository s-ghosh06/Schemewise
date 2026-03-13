-- ============================================================
-- SCHEMEWISE - Government Scheme Monitoring System
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS schemewise_db;
DROP DATABASE schemewise_db;
USE schemewise_db;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'public') NOT NULL DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: schemes
-- ============================================================
CREATE TABLE schemes (
    scheme_id INT AUTO_INCREMENT PRIMARY KEY,
    scheme_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: beneficiaries
-- ============================================================
CREATE TABLE beneficiaries (
    beneficiary_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    aadhaar_number VARCHAR(12) NOT NULL UNIQUE,
    income DECIMAL(12,2) DEFAULT 0,
    beneficiary_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: enrollments
-- ============================================================
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    beneficiary_id INT NOT NULL,
    scheme_id INT NOT NULL,
    enrollment_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(beneficiary_id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(scheme_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: alerts
-- ============================================================
CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    beneficiary_id INT NOT NULL,
    scheme_id INT NOT NULL,
    alert_type ENUM('duplicate_enrollment','income_mismatch','eligibility_failure','general') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(beneficiary_id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(scheme_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default users (passwords: admin123 / public123 - bcrypt hashed)
INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('officer1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('citizen1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'public');

-- Schemes
INSERT INTO schemes (scheme_name, category, is_active) VALUES
('Pradhan Mantri Awas Yojana', 'Housing', 1),
('National Rural Employment Guarantee', 'Employment', 1),
('PM Jan Dhan Yojana', 'Financial Inclusion', 1),
('Ayushman Bharat - PMJAY', 'Health', 1),
('PM Kisan Samman Nidhi', 'Agriculture', 1),
('Beti Bachao Beti Padhao', 'Education', 1),
('National Social Assistance Programme', 'Social Welfare', 1),
('Midday Meal Scheme', 'Education', 1);

-- Beneficiaries
INSERT INTO beneficiaries (full_name, aadhaar_number, income, beneficiary_type) VALUES
('Rajesh Kumar Singh', '234567890123', 85000.00, 'BPL'),
('Priya Devi Sharma', '345678901234', 120000.00, 'APL'),
('Mohammed Rafiq', '456789012345', 60000.00, 'BPL'),
('Sunita Bai', '567890123456', 45000.00, 'BPL'),
('Arvind Patel', '678901234567', 200000.00, 'APL'),
('Lakshmi Narayanan', '789012345678', 75000.00, 'BPL'),
('Geeta Devi', '890123456789', 55000.00, 'BPL'),
('Ramesh Yadav', '901234567890', 95000.00, 'APL'),
('Fatima Begum', '012345678901', 40000.00, 'BPL'),
('Vijay Kumar', '123456789012', 180000.00, 'APL');

-- Enrollments
INSERT INTO enrollments (beneficiary_id, scheme_id, enrollment_date, status) VALUES
(1, 1, '2024-01-15', 'active'),
(1, 5, '2024-02-10', 'active'),
(2, 3, '2024-01-20', 'active'),
(3, 2, '2024-03-05', 'active'),
(3, 7, '2024-03-10', 'active'),
(4, 1, '2024-02-28', 'active'),
(4, 4, '2024-04-01', 'active'),
(5, 3, '2024-01-05', 'inactive'),
(6, 2, '2024-05-12', 'active'),
(6, 5, '2024-05-15', 'active'),
(7, 4, '2024-03-20', 'active'),
(7, 8, '2024-04-18', 'active'),
(8, 1, '2024-06-01', 'active'),
(9, 7, '2024-02-14', 'active'),
(10, 3, '2024-01-30', 'suspended');

-- Alerts
INSERT INTO alerts (beneficiary_id, scheme_id, alert_type) VALUES
(1, 1, 'duplicate_enrollment'),
(3, 2, 'income_mismatch'),
(5, 3, 'eligibility_failure'),
(9, 7, 'income_mismatch'),
(10, 3, 'eligibility_failure');

-- Audit logs
INSERT INTO audit_logs (action_description, user_id) VALUES
('System initialized and database seeded', 1),
('Admin login: admin', 1),
('Beneficiary added: Rajesh Kumar Singh', 1),
('Enrollment created: beneficiary_id=1, scheme_id=1', 1),
('Alert generated: Duplicate enrollment detected for beneficiary_id=1', 1),
('Public user login: citizen1', 3),
('Beneficiary added: Priya Devi Sharma', 1),
('Scheme distribution report generated', 1);

USE schemewise_db;
SELECT * FROM users;
SELECT * FROM schemes;
SELECT * FROM beneficiaries;
SELECT * FROM enrollments;
SELECT * FROM alerts;
SELECT * FROM audit_logs;
SHOW TABLES;

USE schemewise_db;

UPDATE users SET password = 'admin123'   WHERE username = 'admin';
UPDATE users SET password = 'officer123' WHERE username = 'officer1';
UPDATE users SET password = 'public123'  WHERE username = 'citizen1';