# Class Attendance Management System

A comprehensive web application for tracking and managing class attendance efficiently with separate interfaces for teachers and students.

## Features

### Teacher Features
- **Secure Authentication**: Login with credentials and password recovery (OTP simulation)
- **Profile Settings**: Teachers can update their names and change passwords
- **Class Management**: Create, edit, and delete classes with subjects, years, campus, school year, and semester
- **Smart Sorting**: Dashboard automatically sorts classes by most recent School Year and Semester
- **Campus-based Dashboard**: Filter classes by campus, school year, semester, and specific class selections
- **Table-based Overview**: New streamlined table layout with pagination (5 items per page), sorted by recent, and refined action buttons (View, Edit, Delete)
- **Join QR Codes**: Students can join classes by scanning dedicated Join QR codes provided by the teacher.
- **Attendance Cancellation**: Teachers can now clear or cancel attendance records for specific students or entire dates if marked in error.
- **Student QR Pass**: Each student has a unique, automatically generated digital ID pass for teachers to scan for rapid manual attendance logging.
- **Global Scanning**: Teachers can scan a student's ID pass or face from the main dashboard to mark attendance across all relevant enrolled subjects simultaneously.
- **Biometric Registration**: Secure facial biometric profiles can be registered directly by students in their settings or by teachers in the tracker.
- **Biometric Attendance**: Identity verification via facial recognition for contactless check-ins.
- **Student Management**: Add students manually, import from other classes, import from Excel/CSV, or view self-enrolled students
- **Attendance Tracking**: Mark students as present, late, or absent with one-click buttons
- **Daily Monitoring**: Select any date to view detailed attendance records
- **Attendance History**: Review past attendance records for the last 7, 14, or 30 days
- **Class Scheduling**: Set complex weekly schedules with multiple flexible sessions per day, each with its own start and end times.
- **Advanced Reports**: Generate comprehensive attendance reports by day, week, month, period, and daily summaries.
- **Interactive PDF Builder**: New report customization tool to edit headers, logos, and signatures before printing.
- **Class Archiving**: Organize your dashboard by moving older classes to the Archive tab, filterable by school year.
- **Grade Management**: Separate system for managing quizzes, activities, and exams
- **Reports Generation**: Generate and download CSV reports with attendance and grades statistics

### Student Features
- **Simple Authentication**: Login with full name and student ID
- **Side Navigation Bar**: Modern navigation for easy access to subjects, enrollment, reports, and settings.
- **Scheduled Attendance**: Students can only mark attendance during their specific scheduled class times, while teachers maintain full control to mark attendance manually at any time.
- **Unified Enrollment Interface**: Single dashboard section offering both manual Join Code entry and QR Code scanning for seamless class entry.
- **Biometric Attendance**: Identity verification via facial recognition check-in available for registered students, providing a hands-free alternative to QR scanning.
- **Face Registration**: Dedicated profile registration within settings to capture and save facial biometric data locally.
- **Smart Attendance Trigger**: Prominent attendance scanning button available on every page header for enrolled students.
- **Streamlined Subject Dashboard**: Simplified view focused on academic progress and subject navigation.
- **Checklist-style Attendance**: New teacher interface with bulk actions and streamlined student management.
- **Academic Reports**: Consolidated table view of attendance rates across all enrolled subjects.
- **Profile Settings**: Ability to update full name and email address from the settings tab.

## How to Use

### For Teachers
1. **Login**: Use email `teacher@school.edu` and password `admin123`
2. **Create Classes**: Click "Add Class" to create new classes
3. **Set Class Schedule**: Configure weekly schedules with specific days, sessions, and times
4. **Manage Students**: Add students manually, import from other classes, or share join codes
5. **Mark Attendance**: Scan student QR passes or use biometric verification to mark presence instantly.
6. **Generate Reports**: Create detailed reports by daily, weekly, monthly, period, or daily summary formats
7. **Manage Grades**: Access separate grading system for quizzes, activities, and exams
8. **View Analytics**: Generate comprehensive attendance and grades reports

### Grade Management System
- **Separate Interface**: Access via "Grade Management" button from main dashboard
- **Three Categories**: Organize assessments into Quizzes, Activities, and Exams
- **Score Tracking**: Input individual scores with automatic total calculations
- **Comprehensive Reports**: Download CSV reports with all grades and statistics

### For Students
1. **Login/Register**: Enter your full name and student ID to access the portal
2. **Join Classes**: Use the join code provided by your teacher
3. **Scan Attendance**: Use the "Scan QR Code" feature to automatically mark presence in joined classes
4. **View Attendance**: Check your attendance history for each class

### For Administrators
1. **Access**: Visit admin.html and login with admin credentials (admin / admin2024)
2. **Teacher Management**: Create, edit, and delete teacher accounts
3. **Student Overview**: View all students across classes and remove if needed
4. **System Monitoring**: Monitor overall system statistics and usage

## Data Structure

- **Classes**: Stored with name, subject, year, and creation date
- **Students**: Linked to specific classes with name, ID, email, and join date
- **Attendance Records**: Track date, status, and timestamp for each student
- **Teacher Accounts**: Managed by administrators with email authentication

## Technical Features

- **Data Persistence & Integrity**: All data across all accounts (Teachers, Classes, Students, and Attendance) is permanently retained in the Trickle Database.
- **Network Resilience**: Robust error handling for "Failed to fetch" scenarios with automatic retries and exponential backoff.
- **Request Throttling**: Intelligent background synchronization to prevent browser network congestion.
- **Real-time Statistics**: Live attendance rates and visual progress indicators
- **Multi-page Architecture**: Separate pages for attendance, grades, and admin management
- **Advanced Reporting**: Six different report types including daily, weekly, monthly, period, and summary formats
- **Class Scheduling**: Weekly schedule configuration with weekday-specific sessions and time slots
- **Grade Calculations**: Automatic total score calculations and percentage tracking
- **CSV Export**: Download attendance and grades reports in CSV format
- **Admin Panel**: Dedicated administrator interface for system-wide management
- **Account Management**: Create and manage teacher accounts with secure authentication
- **Student Oversight**: View and manage all students across all classes
- **Responsive Design**: Works on desktop and mobile devices

## Authentication

- **Default Teacher Account**: Demo account (teacher@school.edu / admin123) plus custom teacher accounts
- **Administrator Account**: Secure admin access (admin / admin2024) for system management
- **Teacher Registration**: Administrators can create additional teacher accounts
- **Student Verification**: Students must be enrolled to access the system
- **Session Management**: Automatic login persistence and logout functionality

## Generated: July 27, 2026 (Updated: Database Restoration and Multi-Teacher Account Synchronization)
