-- ============================================================
-- SCHEMEWISE - Government Scheme Monitoring System
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS schemewise_db;
USE schemewise_db;
SHOW TABLES;

DESC users;
DESC beneficiaries;
DESC schemes;
DESC enrollments;
DESC alerts;

SELECT * FROM users;
SELECT * FROM beneficiaries;
SELECT * FROM schemes;
SELECT * FROM enrollments;
SELECT * FROM alerts;

SELECT b.full_name, s.scheme_name, e.status
FROM beneficiaries b
JOIN enrollments e ON b.beneficiary_id = e.beneficiary_id
JOIN schemes s ON e.scheme_id = s.scheme_id;

SELECT b.full_name, s.scheme_name, a.alert_type
FROM alerts a
JOIN beneficiaries b ON a.beneficiary_id = b.beneficiary_id
JOIN schemes s ON a.scheme_id = s.scheme_id;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'public') NOT NULL DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schemes (
    scheme_id INT AUTO_INCREMENT PRIMARY KEY,
    scheme_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beneficiaries (
    beneficiary_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    aadhaar_number VARCHAR(12) NOT NULL UNIQUE,
    income DECIMAL(12,2) DEFAULT 0,
    beneficiary_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    beneficiary_id INT NOT NULL,
    scheme_id INT NOT NULL,
    enrollment_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(beneficiary_id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(scheme_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    beneficiary_id INT NOT NULL,
    scheme_id INT NOT NULL,
    alert_type ENUM('duplicate_enrollment','income_mismatch','eligibility_failure','general') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(beneficiary_id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(scheme_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT IGNORE INTO users (username, password, role) VALUES
('admin',    'admin123',   'admin'),
('officer1', 'officer123', 'admin'),
('citizen1', 'public123',  'public');

INSERT IGNORE INTO schemes (scheme_id, scheme_name, category, is_active) VALUES
(1, 'Pradhan Mantri Awas Yojana',          'Housing',             1),
(2, 'National Rural Employment Guarantee',  'Employment',          1),
(3, 'PM Jan Dhan Yojana',                   'Financial Inclusion', 1),
(4, 'Ayushman Bharat - PMJAY',              'Health',              1),
(5, 'PM Kisan Samman Nidhi',                'Agriculture',         1),
(6, 'Beti Bachao Beti Padhao',              'Education',           1),
(7, 'National Social Assistance Programme', 'Social Welfare',      1),
(8, 'Midday Meal Scheme',                   'Education',           1);

INSERT IGNORE INTO beneficiaries (beneficiary_id, full_name, aadhaar_number, income, beneficiary_type) VALUES
(1,  'Rajesh Kumar Singh',  '234567890123', 85000.00,  'BPL'),
(2,  'Priya Devi Sharma',   '345678901234', 120000.00, 'APL'),
(3,  'Mohammed Rafiq',      '456789012345', 60000.00,  'BPL'),
(4,  'Sunita Bai',          '567890123456', 45000.00,  'BPL'),
(5,  'Arvind Patel',        '678901234567', 200000.00, 'APL'),
(6,  'Lakshmi Narayanan',   '789012345678', 75000.00,  'BPL'),
(7,  'Geeta Devi',          '890123456789', 55000.00,  'BPL'),
(8,  'Ramesh Yadav',        '901234567890', 95000.00,  'APL'),
(9,  'Fatima Begum',        '012345678901', 40000.00,  'BPL'),
(10, 'Vijay Kumar',         '123456789012', 180000.00, 'APL');

INSERT IGNORE INTO enrollments (enrollment_id, beneficiary_id, scheme_id, enrollment_date, status) VALUES
(1,  1, 1, '2024-01-15', 'active'),
(2,  1, 5, '2024-02-10', 'active'),
(3,  2, 3, '2024-01-20', 'active'),
(4,  3, 2, '2024-03-05', 'active'),
(5,  3, 7, '2024-03-10', 'active'),
(6,  4, 1, '2024-02-28', 'active'),
(7,  4, 4, '2024-04-01', 'active'),
(8,  5, 3, '2024-01-05', 'inactive'),
(9,  6, 2, '2024-05-12', 'active'),
(10, 6, 5, '2024-05-15', 'active'),
(11, 7, 4, '2024-03-20', 'active'),
(12, 7, 8, '2024-04-18', 'active'),
(13, 8, 1, '2024-06-01', 'active'),
(14, 9, 7, '2024-02-14', 'active'),
(15, 10,3, '2024-01-30', 'suspended');

INSERT IGNORE INTO alerts (alert_id, beneficiary_id, scheme_id, alert_type) VALUES
(1, 1,  1, 'duplicate_enrollment'),
(2, 3,  2, 'income_mismatch'),
(3, 5,  3, 'eligibility_failure'),
(4, 9,  7, 'income_mismatch'),
(5, 10, 3, 'eligibility_failure');

INSERT IGNORE INTO audit_logs (log_id, action_description, user_id) VALUES
(1, 'System initialized and database seeded', 1),
(2, 'Admin login: admin', 1),
(3, 'Beneficiary added: Rajesh Kumar Singh', 1),
(4, 'Enrollment created: beneficiary_id=1, scheme_id=1', 1),
(5, 'Alert generated: Duplicate enrollment detected for beneficiary_id=1', 1),
(6, 'Public user login: citizen1', 3),
(7, 'Beneficiary added: Priya Devi Sharma', 1),
(8, 'Scheme distribution report generated', 1);