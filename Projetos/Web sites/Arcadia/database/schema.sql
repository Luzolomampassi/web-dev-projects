CREATE DATABASE IF NOT EXISTS arcadia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE arcadia;

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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_games_title (title), INDEX idx_games_status (status), INDEX idx_games_created (created_at)
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
