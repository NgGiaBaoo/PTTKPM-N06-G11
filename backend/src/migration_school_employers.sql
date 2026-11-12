CREATE TABLE IF NOT EXISTS SchoolEmployers (
  SchoolID INT NOT NULL,
  EmployerID INT NOT NULL,
  Status ENUM('Active','Revoked') NOT NULL DEFAULT 'Active',
  ApprovedBy INT NULL,
  ApprovedAt DATETIME NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (SchoolID, EmployerID),
  CONSTRAINT FK_SchoolEmployers_School FOREIGN KEY (SchoolID)
    REFERENCES Schools(SchoolID) ON DELETE CASCADE,
  CONSTRAINT FK_SchoolEmployers_Employer FOREIGN KEY (EmployerID)
    REFERENCES EmployerProfiles(EmployerID) ON DELETE CASCADE,
  CONSTRAINT FK_SchoolEmployers_Approver FOREIGN KEY (ApprovedBy)
    REFERENCES Users(UserID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
