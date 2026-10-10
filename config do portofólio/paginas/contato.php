<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['success' => false, 'message' => 'Método não permitido.']);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/x-www-form-urlencoded' && $contentType !== 'multipart/form-data') {
    respond(400, ['success' => false, 'message' => 'Pedido inválido. Atualize a página e tente novamente.']);
}

$fields = ['nome', 'email', 'assunto', 'mensagem'];
foreach ($fields as $field) {
    if (!isset($_POST[$field]) || !is_string($_POST[$field])) {
        respond(400, ['success' => false, 'message' => 'Preencha todos os campos corretamente.']);
    }
}

$nome = trim($_POST['nome']);
$email = trim($_POST['email']);
$assunto = trim($_POST['assunto']);
$mensagem = trim($_POST['mensagem']);
$website = isset($_POST['website']) && is_string($_POST['website']) ? trim($_POST['website']) : '';

// Honeypot for simple bots. Return a normal success response without sending mail.
if ($website !== '') {
    respond(200, ['success' => true, 'message' => 'Mensagem enviada com sucesso.']);
}

if ($nome === '' || $email === '' || $assunto === '' || $mensagem === '') {
    respond(422, ['success' => false, 'message' => 'Preencha todos os campos obrigatórios.']);
}
$nomeLength = preg_match_all('/./us', $nome);
if ($nomeLength === false || $nomeLength < 4) {
    respond(422, ['success' => false, 'message' => 'O nome deve ter pelo menos 4 caracteres.']);
}
if (strlen($nome) > 480 || strlen($assunto) > 720 || strlen($mensagem) > 40000) {
    respond(422, ['success' => false, 'message' => 'Um ou mais campos excedem o tamanho permitido.']);
}
foreach ([$nome, $email, $assunto] as $headerValue) {
    if (preg_match('/[\r\n]/', $headerValue)) {
        respond(422, ['success' => false, 'message' => 'Os dados enviados são inválidos.']);
    }
}
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(422, ['success' => false, 'message' => 'Informe um endereço de e-mail válido.']);
}

// Prefer server environment variables; .env is a simple local/deployment fallback.
$envPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env';
if (is_readable($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (strlen($value) >= 2 && (($value[0] === '"' && str_ends_with($value, '"')) || ($value[0] === "'" && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }
        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }
}

$config = [
    'host' => getenv('SMTP_HOST') ?: '',
    'port' => getenv('SMTP_PORT') ?: '',
    'username' => getenv('SMTP_USERNAME') ?: '',
    'password' => getenv('SMTP_PASSWORD') ?: '',
    'encryption' => strtolower(getenv('SMTP_ENCRYPTION') ?: 'tls'),
    'from_email' => getenv('MAIL_FROM_EMAIL') ?: '',
    'from_name' => getenv('MAIL_FROM_NAME') ?: 'Portfólio Luzolo Mampassi',
    'to_email' => getenv('CONTACT_TO_EMAIL') ?: '',
];
$port = filter_var($config['port'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 65535]]);
if ($config['host'] === '' || $port === false || $config['username'] === '' || $config['password'] === '' ||
    !in_array($config['encryption'], ['tls', 'ssl'], true) ||
    filter_var($config['from_email'], FILTER_VALIDATE_EMAIL) === false ||
    filter_var($config['to_email'], FILTER_VALIDATE_EMAIL) === false ||
    preg_match('/[\r\n]/', $config['from_name'])) {
    error_log('Contact form: SMTP configuration is missing or invalid.');
    respond(503, ['success' => false, 'message' => 'O formulário está temporariamente indisponível. Tente novamente mais tarde.']);
}

try {
    require dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config['host'];
    $mail->Port = $port;
    $mail->SMTPAuth = true;
    $mail->Username = $config['username'];
    $mail->Password = $config['password'];
    $mail->SMTPSecure = $config['encryption'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['to_email']);
    $mail->addReplyTo($email, $nome);
    $mail->Subject = 'Contacto do portfólio: ' . $assunto;
    $mail->Body = "Nome: {$nome}\nE-mail: {$email}\nAssunto: {$assunto}\n\nMensagem:\n{$mensagem}";
    $mail->send();
    respond(200, ['success' => true, 'message' => 'Mensagem enviada com sucesso. Obrigado pelo contacto.']);
} catch (Throwable $exception) {
    error_log('Contact form delivery failed: ' . $exception->getMessage());
    respond(502, ['success' => false, 'message' => 'Não foi possível enviar a mensagem agora. Tente novamente mais tarde.']);
}
