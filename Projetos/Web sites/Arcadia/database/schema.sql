CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(40) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio VARCHAR(500) NOT NULL DEFAULT '',
  public_id VARCHAR(12) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY users_username (username),
  UNIQUE KEY users_email (email),
  UNIQUE KEY users_public_id (public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS games (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  platform VARCHAR(80) NOT NULL DEFAULT '',
  genre VARCHAR(80) NOT NULL DEFAULT '',
  status ENUM('backlog','playing','completed','paused','abandoned') NOT NULL DEFAULT 'backlog',
  hours DECIMAL(7,1) NOT NULL DEFAULT 0,
  rating DECIMAL(3,1) NULL,
  release_date DATE NULL,
  description TEXT NOT NULL,
  notes TEXT NOT NULL,
  favorite TINYINT(1) NOT NULL DEFAULT 0,
  is_wishlist TINYINT(1) NOT NULL DEFAULT 0,
  cover_path VARCHAR(255) NULL,
  steam_app_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_games_title (title), INDEX idx_games_status (status), INDEX idx_games_created (created_at), INDEX idx_games_steam_app (steam_app_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT UNSIGNED NOT NULL PRIMARY KEY,
  theme VARCHAR(10) NOT NULL DEFAULT 'light',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS friendships (
  user_one INT UNSIGNED NOT NULL,
  user_two INT UNSIGNED NOT NULL,
  requester_id INT UNSIGNED NOT NULL,
  recipient_id INT UNSIGNED NOT NULL,
  status ENUM('pending','accepted') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_one,user_two),
  INDEX idx_friendships_recipient_status (recipient_id,status),
  INDEX idx_friendships_requester_status (requester_id,status),
  CONSTRAINT fk_friendships_user_one FOREIGN KEY (user_one) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friendships_user_two FOREIGN KEY (user_two) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  actor_id INT UNSIGNED NULL,
  type ENUM('friend_request','friend_accepted','message') NOT NULL,
  reference_id BIGINT UNSIGNED NULL,
  body VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_read (user_id,is_read,created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sender_id INT UNSIGNED NOT NULL,
  recipient_id INT UNSIGNED NOT NULL,
  body VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_chat_recipient_read (recipient_id,read_at,id),
  INDEX idx_chat_pair (sender_id,recipient_id,id),
  CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collections (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS game_collections (
  collection_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (collection_id, game_id),
  CONSTRAINT fk_gc_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  CONSTRAINT fk_gc_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
) ENGINE=InnoDB;
