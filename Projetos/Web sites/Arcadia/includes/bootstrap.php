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
    return $pdo;
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
