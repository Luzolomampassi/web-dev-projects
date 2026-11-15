<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo = db();
    $user = require_login();
    $uid = (int)$user['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        // Listar chamadas pendentes/ativas para este utilizador
        $q = $pdo->prepare("
            SELECT c.id, c.caller_id, c.receiver_id, c.group_id, c.status, c.created_at,
                   u1.username AS caller_name, u2.username AS receiver_name
            FROM call_sessions c
            JOIN users u1 ON u1.id = c.caller_id
            LEFT JOIN users u2 ON u2.id = c.receiver_id
            WHERE c.caller_id = ? OR c.receiver_id = ?
            ORDER BY c.created_at DESC
            LIMIT 50
        ");
        $q->execute([$uid, $uid]);
        $calls = $q->fetchAll();
        json_response(['calls' => $calls]);
    }

    if ($method !== 'POST') {
        json_response(['error' => 'Método não suportado.'], 405);
    }

    require_csrf();
    $action = (string)($_POST['action'] ?? '');

    if ($action === 'create') {
        $receiverId = filter_var($_POST['receiver_id'] ?? null, FILTER_VALIDATE_INT);
        $groupId = filter_var($_POST['group_id'] ?? null, FILTER_VALIDATE_INT);
        $callType = (string)($_POST['call_type'] ?? 'voice'); // 'voice' ou 'video'

        if (!$receiverId && !$groupId) {
            json_response(['error' => 'Destinatário ou grupo é obrigatório.'], 422);
        }

        // Se for grupo, verificar se é membro
        if ($groupId) {
            $q = $pdo->prepare('SELECT 1 FROM chat_group_members WHERE group_id=? AND user_id=?');
            $q->execute([$groupId, $uid]);
            if (!$q->fetchColumn()) {
                json_response(['error' => 'Não és membro deste grupo.'], 403);
            }
        }

        // Se for individual, verificar amizade
        if ($receiverId) {
            if ($receiverId === $uid) {
                json_response(['error' => 'Não podes ligar para ti mesmo.'], 422);
            }
            $q = $pdo->prepare("SELECT 1 FROM friendships WHERE user_one=LEAST(?,?) AND user_two=GREATEST(?,?) AND status='accepted'");
            $q->execute([$uid, $receiverId, $uid, $receiverId]);
            if (!$q->fetchColumn()) {
                json_response(['error' => 'Só podes ligar para amigos aceites.'], 403);
            }
        }

        // Verificar se já existe uma chamada ativa entre estes pares
        $q = $pdo->prepare("
            SELECT id FROM call_sessions
            WHERE (caller_id=? OR receiver_id=?) AND status IN ('ringing','active')
            LIMIT 1
        ");
        $q->execute([$uid, $uid]);
        if ($q->fetchColumn()) {
            json_response(['error' => 'Já tens uma chamada ativa.'], 409);
        }

        $pdo->prepare('INSERT INTO call_sessions (caller_id, receiver_id, group_id, call_type, status) VALUES (?, ?, ?, ?, ?)')
            ->execute([$uid, $receiverId, $groupId, $callType, 'ringing']);
        $callId = (int)$pdo->lastInsertId();

        // Notificar destinatário(s)
        if ($receiverId) {
            $pdo->prepare("INSERT INTO notifications (user_id, actor_id, type, reference_id, body) VALUES (?, ?, 'call', ?, ?)")
                ->execute([$receiverId, $uid, $callId, $user['username'] . ' está a ligar-te.']);
        } else {
            $q = $pdo->prepare('SELECT user_id FROM chat_group_members WHERE group_id=? AND user_id<>?');
            $q->execute([$groupId, $uid]);
            $notif = $pdo->prepare("INSERT INTO notifications (user_id, actor_id, type, reference_id, body) VALUES (?, ?, 'call', ?, ?)");
            while ($m = $q->fetch()) {
                $notif->execute([(int)$m['user_id'], $uid, $callId, $user['username'] . ' iniciou uma chamada de voz no grupo.']);
            }
        }

        json_response(['ok' => true, 'call_id' => $callId, 'status' => 'ringing']);
    }

    if ($action === 'answer') {
        $callId = filter_var($_POST['call_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$callId) json_response(['error' => 'ID da chamada inválido.'], 422);

        $q = $pdo->prepare('SELECT id, receiver_id, status FROM call_sessions WHERE id=?');
        $q->execute([$callId]);
        $call = $q->fetch();
        if (!$call) json_response(['error' => 'Chamada não encontrada.'], 404);
        if ((int)$call['receiver_id'] !== $uid) json_response(['error' => 'Apenas o destinatário pode atender.'], 403);
        if ((string)$call['status'] !== 'ringing') json_response(['error' => 'Esta chamada já não está disponível.'], 409);

        $pdo->prepare('UPDATE call_sessions SET status=? WHERE id=?')->execute(['active', $callId]);
        json_response(['ok' => true, 'status' => 'active']);
    }

    if ($action === 'decline' || $action === 'end') {
        $callId = filter_var($_POST['call_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$callId) json_response(['error' => 'ID da chamada inválido.'], 422);

        $q = $pdo->prepare('SELECT id, caller_id, receiver_id, status FROM call_sessions WHERE id=?');
        $q->execute([$callId]);
        $call = $q->fetch();
        if (!$call) json_response(['error' => 'Chamada não encontrada.'], 404);
        if ((int)$call['caller_id'] !== $uid && (int)$call['receiver_id'] !== $uid) {
            json_response(['error' => 'Não participas desta chamada.'], 403);
        }

        $status = ($action === 'decline') ? 'declined' : 'ended';
        $pdo->prepare('UPDATE call_sessions SET status=? WHERE id=?')->execute([$status, $callId]);
        json_response(['ok' => true, 'status' => $status]);
    }

    if ($action === 'signal') {
        // Troca de SDP/ICE candidates via sinalização (armazenada em memória/sessão para simplificar)
        $callId = filter_var($_POST['call_id'] ?? null, FILTER_VALIDATE_INT);
        $sdp = $_POST['sdp'] ?? '';
        $type = $_POST['type'] ?? ''; // offer ou answer
        $candidate = $_POST['candidate'] ?? null;

        if (!$callId || !$sdp || !$type) {
            json_response(['error' => 'Dados de sinalização incompletos.'], 422);
        }

        $q = $pdo->prepare('SELECT id, caller_id, receiver_id FROM call_sessions WHERE id=?');
        $q->execute([$callId]);
        $call = $q->fetch();
        if (!$call) json_response(['error' => 'Chamada não encontrada.'], 404);
        if ((int)$call['caller_id'] !== $uid && (int)$call['receiver_id'] !== $uid) {
            json_response(['error' => 'Não participas desta chamada.'], 403);
        }

        // Armazenar sinalização na sessão para o outro peer buscar
        $signalKey = 'call_signal_' . $callId . '_' . $uid;
        $_SESSION[$signalKey] = [
            'sdp' => $sdp,
            'type' => $type,
            'candidate' => $candidate,
            'from' => $uid,
            'updated_at' => time(),
        ];

        // Limpar sinais antigos (mais de 5 minutos)
        foreach ($_SESSION as $k => $v) {
            if (strpos($k, 'call_signal_') === 0 && is_array($v) && isset($v['updated_at']) && time() - $v['updated_at'] > 300) {
                unset($_SESSION[$k]);
            }
        }

        json_response(['ok' => true]);
    }

    if ($action === 'get_signal') {
        $callId = filter_var($_POST['call_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$callId) json_response(['error' => 'ID da chamada inválido.'], 422);

        $q = $pdo->prepare('SELECT id, caller_id, receiver_id FROM call_sessions WHERE id=?');
        $q->execute([$callId]);
        $call = $q->fetch();
        if (!$call) json_response(['error' => 'Chamada não encontrada.'], 404);
        if ((int)$call['caller_id'] !== $uid && (int)$call['receiver_id'] !== $uid) {
            json_response(['error' => 'Não participas desta chamada.'], 403);
        }

        $otherId = ((int)$call['caller_id'] === $uid) ? (int)$call['receiver_id'] : (int)$call['caller_id'];
        $signalKey = 'call_signal_' . $callId . '_' . $otherId;
        $signal = $_SESSION[$signalKey] ?? null;

        if ($signal) {
            unset($_SESSION[$signalKey]); // consumir o sinal (one-time)
            json_response(['ok' => true, 'signal' => $signal]);
        } else {
            json_response(['ok' => true, 'signal' => null]);
        }
    }

    json_response(['error' => 'Ação desconhecida.'], 422);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível aceder à base de dados.'], 503);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível concluir a operação.'], 500);
}
