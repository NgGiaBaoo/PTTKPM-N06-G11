-- Authentication security migration.
-- Run against the same schema selected by DB_NAME.
-- Run this migration once per database; the ALTER below intentionally avoids
-- unsupported MySQL syntax such as ADD COLUMN IF NOT EXISTS.

ALTER TABLE Users
  ADD COLUMN EmailVerified BOOLEAN NOT NULL DEFAULT FALSE AFTER AccountStatus,
  ADD COLUMN EmailVerifiedAt DATETIME NULL AFTER EmailVerified;

-- Existing accounts created before email verification are trusted by the
-- administrator. New public registrations explicitly use FALSE.
UPDATE Users SET EmailVerified = TRUE, EmailVerifiedAt = COALESCE(EmailVerifiedAt, CURRENT_TIMESTAMP)
WHERE AccountStatus = 'Active' AND EmailVerified = FALSE;

CREATE TABLE IF NOT EXISTS EmailVerificationTokens (
  TokenID INT NOT NULL AUTO_INCREMENT,
  UserID INT NOT NULL,
  TokenHash CHAR(64) NOT NULL,
  ExpiresAt DATETIME NOT NULL,
  UsedAt DATETIME NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (TokenID),
  UNIQUE KEY UK_EmailVerificationToken_Hash (TokenHash),
  KEY IX_EmailVerificationToken_User (UserID, UsedAt, ExpiresAt),
  CONSTRAINT FK_EmailVerificationToken_User FOREIGN KEY (UserID)
    REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PasswordResetTokens (
  TokenID INT NOT NULL AUTO_INCREMENT,
  UserID INT NOT NULL,
  TokenHash CHAR(64) NOT NULL,
  ExpiresAt DATETIME NOT NULL,
  UsedAt DATETIME NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (TokenID),
  UNIQUE KEY UK_PasswordResetToken_Hash (TokenHash),
  KEY IX_PasswordResetToken_User (UserID, UsedAt, ExpiresAt),
  CONSTRAINT FK_PasswordResetToken_User FOREIGN KEY (UserID)
    REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
