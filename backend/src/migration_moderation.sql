CREATE TABLE IF NOT EXISTS ContentReports (
  ReportID INT NOT NULL AUTO_INCREMENT,
  ReporterUserID INT NOT NULL,
  EntityType VARCHAR(50) NOT NULL,
  EntityID INT NOT NULL,
  Reason TEXT NOT NULL,
  Status ENUM('Pending','Dismissed','Actioned') NOT NULL DEFAULT 'Pending',
  ReviewedBy INT NULL,
  ReviewedAt DATETIME NULL,
  Resolution TEXT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ReportID),
  KEY IX_ContentReports_Status (Status, CreatedAt),
  CONSTRAINT FK_ContentReports_Reporter FOREIGN KEY (ReporterUserID)
    REFERENCES Users(UserID) ON DELETE RESTRICT,
  CONSTRAINT FK_ContentReports_Reviewer FOREIGN KEY (ReviewedBy)
    REFERENCES Users(UserID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
