<?php
declare(strict_types=1);

function ensure_platform_schema(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS http_cache (
        cache_key CHAR(64) NOT NULL PRIMARY KEY,
        url VARCHAR(500) NOT NULL,
        body MEDIUMTEXT NOT NULL,
        http_status SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        expires_at DATETIME NOT NULL,
        INDEX idx_http_cache_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS sync_state (
        job VARCHAR(64) NOT NULL PRIMARY KEY,
        last_run TIMESTAMP NULL,
        last_success TIMESTAMP NULL,
        cursor_value VARCHAR(80) NULL,
        meta TEXT NULL,
        last_error VARCHAR(500) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS catalog_apps (
        appid INT UNSIGNED NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(32) NOT NULL DEFAULT 'unknown',
        is_free TINYINT(1) NOT NULL DEFAULT 0,
        coming_soon TINYINT(1) NOT NULL DEFAULT 0,
        early_access TINYINT(1) NOT NULL DEFAULT 0,
        release_date DATE NULL,
        release_date_raw VARCHAR(80) NOT NULL DEFAULT '',
        short_description TEXT NULL,
        detailed_description TEXT NULL,
        header_image VARCHAR(500) NULL,
        capsule_image VARCHAR(500) NULL,
        developers VARCHAR(255) NOT NULL DEFAULT '',
        publishers VARCHAR(255) NOT NULL DEFAULT '',
        genres VARCHAR(500) NOT NULL DEFAULT '',
        categories VARCHAR(700) NOT NULL DEFAULT '',
        platforms_windows TINYINT(1) NOT NULL DEFAULT 1,
        platforms_mac TINYINT(1) NOT NULL DEFAULT 0,
        platforms_linux TINYINT(1) NOT NULL DEFAULT 0,
        price_cents INT NULL,
        price_initial_cents INT NULL,
        discount_percent SMALLINT NOT NULL DEFAULT 0,
        currency VARCHAR(8) NULL,
        metacritic_score SMALLINT NULL,
        metacritic_url VARCHAR(500) NULL,
        steam_review_desc VARCHAR(80) NULL,
        steam_review_percent SMALLINT NULL,
        steam_review_count INT NULL,
        recommendations INT UNSIGNED NULL,
        current_players INT UNSIGNED NULL,
        current_players_at TIMESTAMP NULL,
        featured_rank INT NULL,
        new_release_rank INT NULL,
        coming_soon_rank INT NULL,
        pc_req_min TEXT NULL,
        pc_req_rec TEXT NULL,
        screenshots TEXT NULL,
        movies TEXT NULL,
        website VARCHAR(500) NULL,
        last_modified INT UNSIGNED NULL,
        details_fetched_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_catalog_name (name),
        INDEX idx_catalog_type (type),
        INDEX idx_catalog_release (release_date),
        INDEX idx_catalog_price (price_cents),
        INDEX idx_catalog_meta (metacritic_score),
        INDEX idx_catalog_steam_score (steam_review_percent),
        INDEX idx_catalog_featured (featured_rank),
        INDEX idx_catalog_players (current_players),
        INDEX idx_catalog_coming (coming_soon),
        INDEX idx_catalog_free (is_free)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_catalog (
        user_id INT UNSIGNED NOT NULL,
        appid INT UNSIGNED NOT NULL,
        in_library TINYINT(1) NOT NULL DEFAULT 0,
        favorite TINYINT(1) NOT NULL DEFAULT 0,
        status ENUM('backlog','playing','completed','paused','abandoned') NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, appid),
        INDEX idx_user_catalog_lib (user_id, in_library),
        INDEX idx_user_catalog_fav (user_id, favorite),
        CONSTRAINT fk_user_catalog_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS community_reviews (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        appid INT UNSIGNED NOT NULL,
        rating TINYINT UNSIGNED NOT NULL,
        comment VARCHAR(2000) NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_review_user_app (user_id, appid),
        INDEX idx_reviews_app (appid, updated_at),
        CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS review_reports (
        review_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        reason VARCHAR(240) NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (review_id, user_id),
        CONSTRAINT fk_report_review FOREIGN KEY (review_id) REFERENCES community_reviews(id) ON DELETE CASCADE,
        CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS game_views (
        user_id INT UNSIGNED NOT NULL,
        appid INT UNSIGNED NOT NULL,
        viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, appid),
        INDEX idx_views_user_time (user_id, viewed_at),
        CONSTRAINT fk_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS news_sources (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(40) NOT NULL UNIQUE,
        name VARCHAR(80) NOT NULL,
        kind ENUM('rss','steam') NOT NULL,
        url VARCHAR(500) NOT NULL DEFAULT '',
        enabled TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS news_articles (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        source_id INT UNSIGNED NOT NULL,
        external_id VARCHAR(190) NOT NULL,
        canonical_url VARCHAR(500) NOT NULL,
        title VARCHAR(300) NOT NULL,
        summary TEXT NULL,
        image_url VARCHAR(500) NULL,
        author VARCHAR(120) NOT NULL DEFAULT '',
        category VARCHAR(40) NOT NULL DEFAULT 'announcements',
        published_at DATETIME NULL,
        fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        appid INT UNSIGNED NULL,
        UNIQUE KEY uniq_news_source_ext (source_id, external_id),
        UNIQUE KEY uniq_news_url (canonical_url),
        INDEX idx_news_published (published_at),
        INDEX idx_news_category (category),
        INDEX idx_news_appid (appid),
        CONSTRAINT fk_news_source FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS news_reads (
        user_id INT UNSIGNED NOT NULL,
        article_id INT UNSIGNED NOT NULL,
        shown_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        opened_at TIMESTAMP NULL,
        PRIMARY KEY (user_id, article_id),
        INDEX idx_news_reads_opened (user_id, opened_at),
        CONSTRAINT fk_news_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_news_reads_article FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    if (!$pdo->query("SHOW COLUMNS FROM user_settings LIKE 'catalog_view'")->fetch()) {
        $pdo->exec("ALTER TABLE user_settings ADD catalog_view VARCHAR(10) NOT NULL DEFAULT 'grid'");
    }

    $sources = [
        ['steam', 'Steam', 'steam', ''],
        ['ign', 'IGN', 'rss', 'https://feeds.ign.com/ign/games-all'],
        ['eurogamer', 'Eurogamer', 'rss', 'https://www.eurogamer.net/feed'],
        ['pcgamer', 'PC Gamer', 'rss', 'https://www.pcgamer.com/rss/'],
        ['gamespot', 'GameSpot', 'rss', 'https://www.gamespot.com/feeds/news/'],
    ];
    $ins = $pdo->prepare('INSERT IGNORE INTO news_sources (slug,name,kind,url) VALUES (?,?,?,?)');
    foreach ($sources as $s) {
        $ins->execute($s);
    }

    try {
        if (!$pdo->query("SHOW INDEX FROM games WHERE Key_name='uniq_games_user_steam'")->fetch()) {
            $pdo->exec('ALTER TABLE games ADD UNIQUE KEY uniq_games_user_steam (user_id, steam_app_id)');
        }
    } catch (Throwable) {
    }

    try {
        $pdo->exec("ALTER TABLE notifications MODIFY type ENUM('friend_request','friend_accepted','message','game_alert') NOT NULL");
    } catch (Throwable) {
    }
}
