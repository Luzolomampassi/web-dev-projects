<?php
declare(strict_types=1);

define('APP_ROOT', dirname(__DIR__));
define('UPLOAD_DIR', APP_ROOT . '/uploads');
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('arcadia_session');
    session_start();
}

function app_config(): array
{
    $path = APP_ROOT . '/config.php';
    if (!is_file($path)) {
        $path = APP_ROOT . '/config.example.php';
    }
    return require $path;
}

function db(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;
    $cfg = app_config()['database'];
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $cfg['host'], $cfg['port'], $cfg['name'], $cfg['charset']);
    $pdo = new PDO($dsn, $cfg['username'], $cfg['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    // Safe, idempotent upgrade for shared hosts where the database cannot be
    // created by an imported SQL script. Existing tables and records survive.
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, username VARCHAR(40) NOT NULL, email VARCHAR(190) NOT NULL, password_hash VARCHAR(255) NOT NULL, bio VARCHAR(500) NOT NULL DEFAULT '', public_id VARCHAR(12) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY users_username (username), UNIQUE KEY users_email (email), UNIQUE KEY users_public_id (public_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    foreach (['public_id' => 'VARCHAR(12) NULL'] as $column => $definition) {
        if (!$pdo->query("SHOW COLUMNS FROM users LIKE '$column'")->fetch()) $pdo->exec("ALTER TABLE users ADD `$column` $definition");
    }
    foreach (['public_id' => 'users_public_id'] as $column => $index) {
        if (!$pdo->query("SHOW INDEX FROM users WHERE Key_name=" . $pdo->quote($index))->fetch()) $pdo->exec("ALTER TABLE users ADD UNIQUE KEY `$index` (`$column`)");
    }
    $missingIds = $pdo->query('SELECT id FROM users WHERE public_id IS NULL OR public_id = ""')->fetchAll(PDO::FETCH_COLUMN);
    foreach ($missingIds as $missingId) {
        do {
            $publicId = 'AR-' . strtoupper(bin2hex(random_bytes(4)));
            $check = $pdo->prepare('SELECT 1 FROM users WHERE public_id=?'); $check->execute([$publicId]);
        } while ($check->fetchColumn());
        $pdo->prepare('UPDATE users SET public_id=? WHERE id=?')->execute([$publicId, $missingId]);
    }
    $pdo->exec("CREATE TABLE IF NOT EXISTS games (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,title VARCHAR(160) NOT NULL,platform VARCHAR(80) NOT NULL DEFAULT '',genre VARCHAR(80) NOT NULL DEFAULT '',status ENUM('backlog','playing','completed','paused','abandoned') NOT NULL DEFAULT 'backlog',hours DECIMAL(7,1) NOT NULL DEFAULT 0,rating DECIMAL(3,1) NULL,release_date DATE NULL,description TEXT NOT NULL,notes TEXT NOT NULL,favorite TINYINT(1) NOT NULL DEFAULT 0,is_wishlist TINYINT(1) NOT NULL DEFAULT 0,cover_path VARCHAR(255) NULL,steam_app_id INT UNSIGNED NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_games_title(title),INDEX idx_games_status(status),INDEX idx_games_created(created_at),INDEX idx_games_steam_app(steam_app_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    if (!$pdo->query("SHOW COLUMNS FROM games LIKE 'steam_app_id'")->fetch()) $pdo->exec('ALTER TABLE games ADD steam_app_id INT UNSIGNED NULL, ADD INDEX idx_games_steam_app (steam_app_id)');
    $pdo->exec("CREATE TABLE IF NOT EXISTS collections (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,name VARCHAR(80) NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS game_collections (collection_id INT UNSIGNED NOT NULL,game_id INT UNSIGNED NOT NULL,PRIMARY KEY(collection_id,game_id),CONSTRAINT fk_gc_collection FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,CONSTRAINT fk_gc_game FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    foreach (['games', 'collections'] as $table) {
        $exists = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($table))->fetchColumn();
        if ($exists) {
            $column = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'user_id'")->fetch();
            if (!$column) $pdo->exec("ALTER TABLE `$table` ADD user_id INT UNSIGNED NULL, ADD INDEX idx_{$table}_user (user_id)");
            if ($table === 'collections') {
                foreach ($pdo->query("SHOW INDEX FROM collections")->fetchAll() as $index) {
                    if ($index['Column_name'] === 'name' && (int)$index['Non_unique'] === 0 && $index['Key_name'] !== 'PRIMARY') {
                        $pdo->exec('ALTER TABLE collections DROP INDEX `' . str_replace('`', '', $index['Key_name']) . '`');
                    }
                }
            }
        }
    }
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_settings (user_id INT UNSIGNED NOT NULL PRIMARY KEY, theme VARCHAR(10) NOT NULL DEFAULT 'light', updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS friendships (user_one INT UNSIGNED NOT NULL,user_two INT UNSIGNED NOT NULL,requester_id INT UNSIGNED NOT NULL,recipient_id INT UNSIGNED NOT NULL,status ENUM('pending','accepted') NOT NULL DEFAULT 'pending',created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY(user_one,user_two),INDEX idx_friendships_recipient_status(recipient_id,status),INDEX idx_friendships_requester_status(requester_id,status),CONSTRAINT fk_friendships_user_one FOREIGN KEY(user_one) REFERENCES users(id) ON DELETE CASCADE,CONSTRAINT fk_friendships_user_two FOREIGN KEY(user_two) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,user_id INT UNSIGNED NOT NULL,actor_id INT UNSIGNED NULL,type ENUM('friend_request','friend_accepted','message') NOT NULL,reference_id BIGINT UNSIGNED NULL,body VARCHAR(255) NOT NULL,is_read TINYINT(1) NOT NULL DEFAULT 0,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX idx_notifications_user_read(user_id,is_read,created_at),CONSTRAINT fk_notifications_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,CONSTRAINT fk_notifications_actor FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS chat_messages (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,sender_id INT UNSIGNED NOT NULL,recipient_id INT UNSIGNED NOT NULL,body VARCHAR(2000) NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,read_at TIMESTAMP NULL DEFAULT NULL,INDEX idx_chat_recipient_read(recipient_id,read_at,id),INDEX idx_chat_pair(sender_id,recipient_id,id),CONSTRAINT fk_chat_sender FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,CONSTRAINT fk_chat_recipient FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    return $pdo;
}

function current_user(): ?array
{
    return isset($_SESSION['user']) && is_array($_SESSION['user']) ? $_SESSION['user'] : null;
}

function require_login(): array
{
    $user = current_user();
    if (!$user) json_response(['error' => 'Inicia sessão para continuar.'], 401);
    return $user;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function require_csrf(): void
{
    $token = $_POST['csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals(csrf_token(), $token)) {
        json_response(['error' => 'A sessão expirou. Atualiza a página e tenta novamente.'], 419);
    }
}

function clean_text(mixed $value, int $max): string
{
    $value = trim((string)$value);
    if (mb_strlen($value) > $max) throw new InvalidArgumentException('Um dos campos excede o tamanho permitido.');
    return $value;
}

function game_payload(array $row): array
{
    $row['favorite'] = (bool)$row['favorite'];
    $row['is_wishlist'] = (bool)$row['is_wishlist'];
    $row['hours'] = (float)$row['hours'];
    $row['rating'] = $row['rating'] === null ? null : (float)$row['rating'];
    return $row;
}
