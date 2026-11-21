<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo = db();
    $user = require_login();
    $uid = (int)$user['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        // Retornar presença de todos os amigos (last_seen e is_typing)
        $q = $pdo->prepare("SELECT u.id, u.username, p.last_seen, p.is_typing, p.typing_until FROM friendships f JOIN users u ON u.id=IF(f.requester_id=?,f.recipient_id,f.requester_id) LEFT JOIN user_presence p ON p.user_id=u.id WHERE (f.user_one=? OR f.user_two=?) AND f.status='accepted'");
        $q->execute([$uid, $uid, $uid]);
        $presence = $q->fetchAll();

        // Marcar utilizador atual como online (atualizar last_seen)
        $pdo->prepare("INSERT INTO user_presence (user_id, last_seen) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()")->execute([$uid]);

        json_response(['presence' => $presence]);
    }

    if ($method !== 'POST') {
        json_response(['error' => 'Método não suportado.'], 405);
    }

    require_csrf();
    $action = (string)($_POST['action'] ?? '');

    if ($action === 'update_presence') {
        // Atualizar last_seen do utilizador atual
        $pdo->prepare("INSERT INTO user_presence (user_id, last_seen) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()")->execute([$uid]);
        json_response(['ok' => true]);
    }

    if ($action === 'typing') {
        $recipient = filter_var($_POST['recipient_id'] ?? null, FILTER_VALIDATE_INT);
        $isTyping = filter_var($_POST['is_typing'] ?? '0', FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
        if (!$recipient || $recipient === $uid) {
            json_response(['error' => 'Destinatário inválido.'], 422);
        }
        require_friend_local($pdo, $uid, $recipient);
        $typingUntil = $isTyping ? date('Y-m-d H:i:s', time() + 10) : null;
        $pdo->prepare("INSERT INTO user_presence (user_id, last_seen, is_typing, typing_until) VALUES (?, NOW(), ?, ?) ON DUPLICATE KEY UPDATE last_seen=NOW(), is_typing=?, typing_until=?")
            ->execute([$uid, (int)$isTyping, $typingUntil, (int)$isTyping, $typingUntil]);
        json_response(['ok' => true, 'is_typing' => (int)$isTyping, 'typing_until' => $typingUntil]);
    }

    json_response(['error' => 'Ação desconhecida.'], 422);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível aceder à base de dados.'], 503);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível concluir a operação.'], 500);
}

function require_friend_local(PDO $pdo, int $uid, int $other): void
{
    if ($other < 1 || $other === $uid) {
        json_response(['error' => 'Utilizador inválido.'], 422);
    }
    $q = $pdo->prepare("SELECT 1 FROM friendships WHERE user_one=LEAST(?,?) AND user_two=GREATEST(?,?) AND status='accepted'");
    $q->execute([$uid, $other, $uid, $other]);
    if (!$q->fetchColumn()) {
        json_response(['error' => 'Só podes interagir com amigos aceites.'], 403);
    }
}
