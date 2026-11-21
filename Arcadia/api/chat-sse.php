<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

// Evita timeout em shared hosting e permite que o cliente termine a conexão
ignore_user_abort(true);
if (function_exists('set_time_limit')) {
    @set_time_limit(0);
}

try {
    $user = require_login();
    $uid = (int)$user['id'];
    $with = filter_var($_GET['with'] ?? null, FILTER_VALIDATE_INT);

    if (!$with || $with === $uid) {
        http_response_code(422);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Amigo inválido.']);
        exit;
    }

    // Verifica amizade
    $q = $pdo->prepare("SELECT 1 FROM friendships WHERE user_one=LEAST(?,?) AND user_two=GREATEST(?,?) AND status='accepted'");
    $q->execute([$uid, $with, $uid, $with]);
    if (!$q->fetchColumn()) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Só podes conversar com amigos aceites.']);
        exit;
    }

    // Cabeçalhos SSE
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('X-Accel-Buffering: no'); // desativa buffer do nginx
    header('Connection: keep-alive');

    $lastId = 0;

    while (true) {
        if (connection_aborted() || connection_status() !== CONNECTION_NORMAL) {
            break;
        }

        try {
            $q = $pdo->prepare('SELECT id,sender_id,recipient_id,body,created_at FROM chat_messages WHERE ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)) AND id>? ORDER BY id ASC LIMIT 50');
            $q->execute([$uid, $with, $with, $uid, $lastId]);
            $messages = $q->fetchAll();

            if ($messages) {
                foreach ($messages as $m) {
                    $lastId = (int)$m['id'];
                    echo "id: {$m['id']}\n";
                    echo "data: " . json_encode([
                        'id' => (int)$m['id'],
                        'sender_id' => (int)$m['sender_id'],
                        'recipient_id' => (int)$m['recipient_id'],
                        'body' => $m['body'],
                        'created_at' => $m['created_at'],
                        'mine' => (int)$m['sender_id'] === $uid,
                    ], JSON_UNESCAPED_UNICODE) . "\n\n";
                }
                ob_flush();
                flush();
            }

            // Marca mensagens recebidas como lidas
            $pdo->prepare('UPDATE chat_messages SET read_at=NOW() WHERE sender_id=? AND recipient_id=? AND read_at IS NULL')->execute([$with, $uid]);
        } catch (Throwable $e) {
            // Em caso de erro de BD no SSE, encerra silenciosamente para não quebrar o fluxo
            break;
        }

        usleep(3000000); // 3 segundos
    }
} catch (Throwable $e) {
    // Erro de autenticação ou configuração — retorna JSON para o cliente
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Não foi possível iniciar o chat em tempo real.']);
    exit;
}
