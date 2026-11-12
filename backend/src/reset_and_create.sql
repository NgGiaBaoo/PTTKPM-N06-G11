-- Chạy trên schema JOBRECRUITMENT của Aiven/MySQL Workbench.
-- CẢNH BÁO: script xóa toàn bộ dữ liệu nghiệp vụ hiện tại.

USE JOBRECRUITMENT;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ApplicationStatusHistory, ApplicationDocuments,
  StudentCVs, Notifications, AuditLogs, VerificationRequests,
  ProgramStudents, ProgramEmployers, Applications, Jobs,
  ConnectionPrograms, StudentProfiles, EmployerProfiles,
  SchoolStaffProfiles, Schools,
  EmailVerificationTokens, PasswordResetTokens,
  ContentReports,
  SchoolEmployers,
  Candidates, Employers,
  Users, sessions;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Users (
  UserID INT NOT NULL AUTO_INCREMENT,
  Username VARCHAR(50) NOT NULL,
  Email VARCHAR(255) NOT NULL,
  PasswordHash VARCHAR(255) NOT NULL,
  Role ENUM('Student','Employer','SchoolStaff','Admin') NOT NULL,
  AccountStatus ENUM('Pending','Active','Locked','Disabled') NOT NULL DEFAULT 'Active',
  EmailVerified BOOLEAN NOT NULL DEFAULT FALSE,
  EmailVerifiedAt DATETIME NULL,
  CreatedBy INT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (UserID),
  UNIQUE KEY UK_Users_Username (Username),
  UNIQUE KEY UK_Users_Email (Email),
  CONSTRAINT FK_Users_CreatedBy FOREIGN KEY (CreatedBy)
    REFERENCES Users(UserID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE EmailVerificationTokens (
  TokenID INT NOT NULL AUTO_INCREMENT, UserID INT NOT NULL,
  TokenHash CHAR(64) NOT NULL, ExpiresAt DATETIME NOT NULL,
  UsedAt DATETIME NULL, CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (TokenID), UNIQUE KEY UK_EmailVerificationToken_Hash (TokenHash),
  KEY IX_EmailVerificationToken_User (UserID, UsedAt, ExpiresAt),
  CONSTRAINT FK_EmailVerificationToken_User FOREIGN KEY (UserID)
    REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PasswordResetTokens (
  TokenID INT NOT NULL AUTO_INCREMENT, UserID INT NOT NULL,
  TokenHash CHAR(64) NOT NULL, ExpiresAt DATETIME NOT NULL,
  UsedAt DATETIME NULL, CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (TokenID), UNIQUE KEY UK_PasswordResetToken_Hash (TokenHash),
  KEY IX_PasswordResetToken_User (UserID, UsedAt, ExpiresAt),
  CONSTRAINT FK_PasswordResetToken_User FOREIGN KEY (UserID)
    REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ContentReports (
  ReportID INT NOT NULL AUTO_INCREMENT, ReporterUserID INT NOT NULL,
  EntityType VARCHAR(50) NOT NULL, EntityID INT NOT NULL, Reason TEXT NOT NULL,
  Status ENUM('Pending','Dismissed','Actioned') NOT NULL DEFAULT 'Pending',
  ReviewedBy INT NULL, ReviewedAt DATETIME NULL, Resolution TEXT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ReportID), KEY IX_ContentReports_Status (Status, CreatedAt),
  CONSTRAINT FK_ContentReports_Reporter FOREIGN KEY (ReporterUserID)
    REFERENCES Users(UserID) ON DELETE RESTRICT,
  CONSTRAINT FK_ContentReports_Reviewer FOREIGN KEY (ReviewedBy)
    REFERENCES Users(UserID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Schools (
  SchoolID INT NOT NULL AUTO_INCREMENT,
  SchoolCode VARCHAR(50) NOT NULL,
  SchoolName VARCHAR(255) NOT NULL,
  Email VARCHAR(255), Phone VARCHAR(30), Address VARCHAR(500),
  Status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (SchoolID), UNIQUE KEY UK_Schools_Code (SchoolCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE SchoolStaffProfiles (
  SchoolStaffID INT NOT NULL AUTO_INCREMENT,
  UserID INT NOT NULL, SchoolID INT NOT NULL, StaffCode VARCHAR(50) NOT NULL,
  FullName VARCHAR(255) NOT NULL, Department VARCHAR(255),
  Position VARCHAR(255), Phone VARCHAR(30),
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (SchoolStaffID),
  UNIQUE KEY UK_Staff_User (UserID),
  UNIQUE KEY UK_Staff_Code (SchoolID, StaffCode),
  CONSTRAINT FK_Staff_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
  CONSTRAINT FK_Staff_School FOREIGN KEY (SchoolID) REFERENCES Schools(SchoolID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE StudentProfiles (
  StudentID INT NOT NULL AUTO_INCREMENT,
  UserID INT NOT NULL, SchoolID INT NOT NULL, StudentCode VARCHAR(50) NOT NULL,
  FullName VARCHAR(255) NOT NULL, Email VARCHAR(255) NOT NULL,
  Phone VARCHAR(30), Major VARCHAR(255), Cohort VARCHAR(50),
  Skills TEXT, CareerOrientation TEXT,
  VerificationStatus ENUM('Unverified','Verified','Rejected') NOT NULL DEFAULT 'Unverified',
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (StudentID),
  UNIQUE KEY UK_Student_User (UserID),
  UNIQUE KEY UK_Student_Code (SchoolID, StudentCode),
  CONSTRAINT FK_Student_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
  CONSTRAINT FK_Student_School FOREIGN KEY (SchoolID) REFERENCES Schools(SchoolID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE EmployerProfiles (
  EmployerID INT NOT NULL AUTO_INCREMENT,
  UserID INT NOT NULL, CompanyName VARCHAR(255) NOT NULL,
  BusinessCode VARCHAR(100), Industry VARCHAR(255),
  Email VARCHAR(255) NOT NULL, Phone VARCHAR(30), Address VARCHAR(500),
  Description TEXT,
  VerificationStatus ENUM('Draft','Pending','Verified','Rejected','Revoked')
    NOT NULL DEFAULT 'Draft',
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (EmployerID), UNIQUE KEY UK_Employer_User (UserID),
  CONSTRAINT FK_EmployerProfiles_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE SchoolEmployers (
  SchoolID INT NOT NULL, EmployerID INT NOT NULL,
  Status ENUM('Active','Revoked') NOT NULL DEFAULT 'Active',
  ApprovedBy INT NULL, ApprovedAt DATETIME NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (SchoolID, EmployerID),
  CONSTRAINT FK_SchoolEmployers_School FOREIGN KEY (SchoolID)
    REFERENCES Schools(SchoolID) ON DELETE CASCADE,
  CONSTRAINT FK_SchoolEmployers_Employer FOREIGN KEY (EmployerID)
    REFERENCES EmployerProfiles(EmployerID) ON DELETE CASCADE,
  CONSTRAINT FK_SchoolEmployers_Approver FOREIGN KEY (ApprovedBy)
    REFERENCES Users(UserID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE VerificationRequests (
  VerificationRequestID INT NOT NULL AUTO_INCREMENT,
  EmployerID INT NOT NULL, ReviewedBy INT NULL,
  Status ENUM('Pending','Approved','Rejected','Revoked') NOT NULL DEFAULT 'Pending',
  SubmittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ReviewedAt DATETIME NULL, Reason TEXT,
  PRIMARY KEY (VerificationRequestID),
  KEY IX_Verification_Status (EmployerID, Status),
  CONSTRAINT FK_Verification_Employer FOREIGN KEY (EmployerID)
    REFERENCES EmployerProfiles(EmployerID) ON DELETE CASCADE,
  CONSTRAINT FK_Verification_Reviewer FOREIGN KEY (ReviewedBy)
    REFERENCES Users(UserID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Jobs (
  JobID INT NOT NULL AUTO_INCREMENT, EmployerID INT NOT NULL,
  JobTitle VARCHAR(255) NOT NULL,
  JobType ENUM('FullTime','PartTime','Internship') NOT NULL DEFAULT 'FullTime',
  Salary DECIMAL(15,2), Location VARCHAR(255), Description TEXT,
  Requirements TEXT, Benefits TEXT, Deadline DATE,
  Status ENUM('Draft','Published','Closed','Expired','Suspended','Archived')
    NOT NULL DEFAULT 'Draft',
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (JobID), KEY IX_Jobs_Employer (EmployerID), KEY IX_Jobs_Status (Status, Deadline),
  CONSTRAINT FK_Jobs_Employer FOREIGN KEY (EmployerID)
    REFERENCES EmployerProfiles(EmployerID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Applications (
  ApplicationID INT NOT NULL AUTO_INCREMENT,
  StudentID INT NOT NULL, JobID INT NOT NULL,
  ApplyDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  Status ENUM('Submitted','UnderReview','Accepted','Rejected','Withdrawn')
    NOT NULL DEFAULT 'Submitted',
  RejectionReason TEXT,
  PRIMARY KEY (ApplicationID), UNIQUE KEY UK_Application_Student_Job (StudentID, JobID),
  KEY IX_Applications_Job (JobID), KEY IX_Applications_Status (Status),
  CONSTRAINT FK_Applications_Student FOREIGN KEY (StudentID)
    REFERENCES StudentProfiles(StudentID) ON DELETE CASCADE,
  CONSTRAINT FK_Applications_Job FOREIGN KEY (JobID)
    REFERENCES Jobs(JobID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE StudentCVs (
  CVID INT NOT NULL AUTO_INCREMENT, StudentID INT NOT NULL,
  FileName VARCHAR(255) NOT NULL, FilePath VARCHAR(1000) NOT NULL,
  MimeType VARCHAR(100) NOT NULL, FileSize BIGINT NOT NULL,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  UploadedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CVID),
  CONSTRAINT FK_CV_Student FOREIGN KEY (StudentID)
    REFERENCES StudentProfiles(StudentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ApplicationDocuments (
  ApplicationDocumentID INT NOT NULL AUTO_INCREMENT, ApplicationID INT NOT NULL,
  DocumentType ENUM('CV','CoverLetter','Other') NOT NULL,
  FileName VARCHAR(255) NOT NULL, FilePath VARCHAR(1000) NOT NULL,
  MimeType VARCHAR(100) NOT NULL, FileSize BIGINT NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ApplicationDocumentID),
  CONSTRAINT FK_Document_Application FOREIGN KEY (ApplicationID)
    REFERENCES Applications(ApplicationID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ApplicationStatusHistory (
  HistoryID INT NOT NULL AUTO_INCREMENT, ApplicationID INT NOT NULL,
  OldStatus VARCHAR(50), NewStatus VARCHAR(50) NOT NULL,
  ChangedBy INT NOT NULL, Reason TEXT,
  ChangedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (HistoryID),
  CONSTRAINT FK_History_Application FOREIGN KEY (ApplicationID)
    REFERENCES Applications(ApplicationID) ON DELETE CASCADE,
  CONSTRAINT FK_History_User FOREIGN KEY (ChangedBy)
    REFERENCES Users(UserID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ConnectionPrograms (
  ProgramID INT NOT NULL AUTO_INCREMENT, SchoolID INT NOT NULL,
  Name VARCHAR(255) NOT NULL, Description TEXT,
  StartDate DATE NOT NULL, EndDate DATE NOT NULL, Location VARCHAR(255),
  Status ENUM('Draft','Open','Closed','Cancelled') NOT NULL DEFAULT 'Draft',
  CreatedBy INT NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ProgramID),
  CONSTRAINT FK_Program_School FOREIGN KEY (SchoolID) REFERENCES Schools(SchoolID) ON DELETE RESTRICT,
  CONSTRAINT FK_Program_Creator FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ProgramStudents (
  ProgramID INT NOT NULL, StudentID INT NOT NULL,
  Status ENUM('Registered','Attended','Completed','Cancelled') NOT NULL DEFAULT 'Registered',
  RegisteredAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ProgramID, StudentID),
  CONSTRAINT FK_ProgramStudent_Program FOREIGN KEY (ProgramID)
    REFERENCES ConnectionPrograms(ProgramID) ON DELETE CASCADE,
  CONSTRAINT FK_ProgramStudent_Student FOREIGN KEY (StudentID)
    REFERENCES StudentProfiles(StudentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ProgramEmployers (
  ProgramID INT NOT NULL, EmployerID INT NOT NULL,
  Status ENUM('Pending','Approved','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
  RegisteredAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ProgramID, EmployerID),
  CONSTRAINT FK_ProgramEmployer_Program FOREIGN KEY (ProgramID)
    REFERENCES ConnectionPrograms(ProgramID) ON DELETE CASCADE,
  CONSTRAINT FK_ProgramEmployer_Employer FOREIGN KEY (EmployerID)
    REFERENCES EmployerProfiles(EmployerID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Notifications (
  NotificationID INT NOT NULL AUTO_INCREMENT, UserID INT NOT NULL,
  Type VARCHAR(100) NOT NULL, Title VARCHAR(255) NOT NULL, Message TEXT NOT NULL,
  RelatedEntityType VARCHAR(100), RelatedEntityID INT NULL,
  IsRead BOOLEAN NOT NULL DEFAULT FALSE, CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ReadAt DATETIME NULL, PRIMARY KEY (NotificationID),
  KEY IX_Notifications_User_Read (UserID, IsRead),
  CONSTRAINT FK_Notification_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE AuditLogs (
  AuditLogID BIGINT NOT NULL AUTO_INCREMENT, ActorUserID INT NOT NULL,
  Action VARCHAR(100) NOT NULL, EntityType VARCHAR(100) NOT NULL, EntityID INT NULL,
  OldValue JSON NULL, NewValue JSON NULL, Reason TEXT,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (AuditLogID),
  CONSTRAINT FK_Audit_Actor FOREIGN KEY (ActorUserID) REFERENCES Users(UserID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu. Mật khẩu mọi tài khoản: ChangeMe123!
INSERT INTO Schools (SchoolCode, SchoolName, Email, Phone, Address)
VALUES ('DHKTCN','Trường Đại học Kỹ thuật Công nghệ','contact@dhktcn.edu.vn',
  '0280000000','Thành phố Hồ Chí Minh');
SET @school_id = LAST_INSERT_ID();

INSERT INTO Users (Username, Email, PasswordHash, Role, EmailVerified, EmailVerifiedAt)
VALUES ('admin','admin@system.local',
  '$2b$10$0orseQ0FbGDCkl9qvZeWJOJhYvgfbSKcAezg30D77qdLUVLvPcQXm','Admin',TRUE,CURRENT_TIMESTAMP);
SET @admin_id = LAST_INSERT_ID();

INSERT INTO Users (Username, Email, PasswordHash, Role, EmailVerified, EmailVerifiedAt, CreatedBy)
VALUES ('school.staff.01','staff01@dhktcn.edu.vn',
  '$2b$10$0orseQ0FbGDCkl9qvZeWJOJhYvgfbSKcAezg30D77qdLUVLvPcQXm','SchoolStaff',TRUE,CURRENT_TIMESTAMP,@admin_id);
SET @staff_user_id = LAST_INSERT_ID();

INSERT INTO Users (Username, Email, PasswordHash, Role, EmailVerified, EmailVerifiedAt)
VALUES ('employer.acme','hr@acme.example',
  '$2b$10$0orseQ0FbGDCkl9qvZeWJOJhYvgfbSKcAezg30D77qdLUVLvPcQXm','Employer',TRUE,CURRENT_TIMESTAMP);
SET @employer_user_id = LAST_INSERT_ID();

INSERT INTO Users (Username, Email, PasswordHash, Role, EmailVerified, EmailVerifiedAt)
VALUES ('student.an','an@student.example',
  '$2b$10$0orseQ0FbGDCkl9qvZeWJOJhYvgfbSKcAezg30D77qdLUVLvPcQXm','Student',TRUE,CURRENT_TIMESTAMP);
SET @student_user_id = LAST_INSERT_ID();

INSERT INTO SchoolStaffProfiles
  (UserID,SchoolID,StaffCode,FullName,Department,Position,Phone)
VALUES (@staff_user_id,@school_id,'CB001','Nguyễn Thị Lan',
  'Phòng Quan hệ Doanh nghiệp','Cán bộ phụ trách hợp tác','0901000001');

INSERT INTO StudentProfiles
  (UserID,SchoolID,StudentCode,FullName,Email,Phone,Major,Cohort,Skills,CareerOrientation,VerificationStatus)
VALUES (@student_user_id,@school_id,'SV20260001','Nguyễn Văn An','an@student.example',
  '0902000001','Công nghệ phần mềm','K2026','Node.js, React, MySQL','Backend Developer','Verified');
SET @student_id = LAST_INSERT_ID();

INSERT INTO EmployerProfiles
  (UserID,CompanyName,BusinessCode,Industry,Email,Phone,Address,Description,VerificationStatus)
VALUES (@employer_user_id,'Acme Technology','ACME-001','Công nghệ thông tin',
  'hr@acme.example','0903000001','Quận 1, TP.HCM','Doanh nghiệp phần mềm','Verified');
SET @employer_id = LAST_INSERT_ID();

INSERT INTO VerificationRequests (EmployerID,ReviewedBy,Status,ReviewedAt,Reason)
VALUES (@employer_id,@staff_user_id,'Approved',NOW(),'Hồ sơ hợp lệ.');

INSERT INTO Jobs
  (EmployerID,JobTitle,JobType,Salary,Location,Description,Requirements,Benefits,Deadline,Status)
VALUES (@employer_id,'Backend Developer Intern','Internship',5000000,'TP.HCM',
  'Phát triển API Node.js.','Biết JavaScript và SQL.','Có người hướng dẫn.',
  '2026-12-31','Published');
SET @job_id = LAST_INSERT_ID();

INSERT INTO ConnectionPrograms
  (SchoolID,Name,Description,StartDate,EndDate,Location,Status,CreatedBy)
VALUES (@school_id,'Ngày hội việc làm 2026','Kết nối sinh viên và doanh nghiệp.',
  '2026-11-15','2026-11-15','Hội trường A','Open',@staff_user_id);
SET @program_id = LAST_INSERT_ID();

INSERT INTO ProgramStudents (ProgramID,StudentID) VALUES (@program_id,@student_id);
INSERT INTO ProgramEmployers (ProgramID,EmployerID,Status)
VALUES (@program_id,@employer_id,'Approved');

INSERT INTO Applications (StudentID,JobID,Status)
VALUES (@student_id,@job_id,'Submitted');
SET @application_id = LAST_INSERT_ID();

INSERT INTO ApplicationStatusHistory
  (ApplicationID,OldStatus,NewStatus,ChangedBy,Reason)
VALUES (@application_id,NULL,'Submitted',@student_user_id,'Sinh viên gửi hồ sơ.');

INSERT INTO Notifications
  (UserID,Type,Title,Message,RelatedEntityType,RelatedEntityID)
VALUES
  (@student_user_id,'APPLICATION_CREATED','Ứng tuyển thành công',
   'Hồ sơ ứng tuyển đã được gửi.','Application',@application_id),
  (@employer_user_id,'NEW_APPLICATION','Có hồ sơ mới',
   'Doanh nghiệp có hồ sơ ứng tuyển mới.','Application',@application_id);
