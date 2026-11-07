CREATE DATABASE IF NOT EXISTS student_planner DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_planner;

CREATE TABLE IF NOT EXISTS sys_user (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone           VARCHAR(20)  NOT NULL,
  password_hash   VARCHAR(100) NOT NULL,
  assessment_done TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME,
  last_login_at   DATETIME,
  UNIQUE KEY uk_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_record (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT NOT NULL,
  answers_json MEDIUMTEXT,
  stage        VARCHAR(32),
  profile_path VARCHAR(255),
  created_at   DATETIME,
  KEY idx_ar_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chat_message (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  role       VARCHAR(16) NOT NULL,
  content    TEXT,
  created_at DATETIME,
  KEY idx_user_session (user_id, session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
