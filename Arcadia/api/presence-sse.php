<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

// Evita timeout em shared hosting
ignore_user_abort(true);
if (function_exists('set_time_limit')) {
    @set_time_limit(0);
}

try {
    $user = require_login();
    $uid = (int)$user['id'];

    // Cabeçalhos SSE
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('X-Accel-Buffering: no');
    header('Connection: keep-alive');

    // Atualizar last_seen do utilizador atual ao conectar
    $pdo = db();
    $pdo->prepare("INSERT INTO user_presence (user_id, last_seen) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()")->execute([$uid]);

    $lastPresenceCheck = 0;

    while (true) {
        if (connection_aborted() || connection_status() !== CONNECTION_NORMAL) {
            break;
        }

        try {
            // Verificar presença dos amigos (online/typing) a cada 5 segundos
            $now = time();
            if ($now - $lastPresenceCheck >= 5) {
                $lastPresenceCheck = $now;

                $q = $pdo->prepare("SELECT u.id, u.username, p.last_seen, p.is_typing, p.typing_until FROM friendships f JOIN users u ON u.id=IF(f.requester_id=?,f.recipient_id,f.requester_id) LEFT JOIN user_presence p ON p.user_id=u.id WHERE (f.user_one=? OR f.user_two=?) AND f.status='accepted'");
                $q->execute([$uid, $uid, $uid]);
                $presence = $q->fetchAll();

                foreach ($presence as $p) {
                    $isTyping = (int)$p['is_typing'] === 1 && $p['typing_until'] && strtotime($p['typing_until']) > $now;
                    echo "id: presence-{$p['id']}\n";
                    echo "data: " . json_encode([
                        'type' => 'presence',
                        'user_id' => (int)$p['id'],
                        'username' => $p['username'],
                        'is_online' => true, // Se está na lista de presença, está online
                        'last_seen' => $p['last_seen'],
                        'is_typing' => $isTyping,
                    ], JSON_UNESCAPED_UNICODE) . "\n\n";
                }
                ob_flush();
                flush();
            }

            // Atualizar próprio last_seen periodicamente
            $pdo->prepare("INSERT INTO user_presence (user_id, last_seen) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()")->execute([$uid]);

        } catch (Throwable $e) {
            break;
        }

        usleep(3000000); // 3 segundos
    }
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Não foi possível iniciar o presence SSE.']);
    exit;
}
