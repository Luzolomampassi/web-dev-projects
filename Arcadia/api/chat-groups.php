<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo = db();
    $user = require_login();
    $uid = (int)$user['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // ---------- LISTAR GRUPOS DO UTILIZADOR ----------
    if ($method === 'GET') {
        $action = (string)($_GET['action'] ?? 'list');

        if ($action === 'list') {
            $q = $pdo->prepare("
                SELECT g.id, g.name, g.created_by, g.created_at,
                       u.username AS creator_name,
                       (SELECT COUNT(*) FROM chat_group_members gm WHERE gm.group_id = g.id) AS member_count,
                       (SELECT 1 FROM chat_group_members gm WHERE gm.group_id = g.id AND gm.user_id = ?) AS is_member
                FROM chat_groups g
                JOIN users u ON u.id = g.created_by
                WHERE EXISTS (SELECT 1 FROM chat_group_members gm WHERE gm.group_id = g.id AND gm.user_id = ?)
                ORDER BY g.created_at DESC
            ");
            $q->execute([$uid, $uid]);
            $groups = $q->fetchAll();
            json_response(['groups' => $groups]);
        }

        if ($action === 'members') {
            $gid = filter_var($_GET['group_id'] ?? null, FILTER_VALIDATE_INT);
            if (!$gid) json_response(['error' => 'Grupo inválido.'], 422);
            // Verificar se o user é membro
            $q = $pdo->prepare('SELECT 1 FROM chat_group_members WHERE group_id=? AND user_id=?');
            $q->execute([$gid, $uid]);
            if (!$q->fetchColumn()) json_response(['error' => 'Não és membro deste grupo.'], 403);
            $q = $pdo->prepare("
                SELECT u.id, u.username, gm.role, gm.joined_at
                FROM chat_group_members gm
                JOIN users u ON u.id = gm.user_id
                WHERE gm.group_id = ?
                ORDER BY gm.role DESC, u.username
            ");
            $q->execute([$gid]);
            $members = $q->fetchAll();
            json_response(['members' => $members]);
        }

        if ($action === 'messages') {
            $gid = filter_var($_GET['group_id'] ?? null, FILTER_VALIDATE_INT);
            if (!$gid) json_response(['error' => 'Grupo inválido.'], 422);
            $q = $pdo->prepare('SELECT 1 FROM chat_group_members WHERE group_id=? AND user_id=?');
            $q->execute([$gid, $uid]);
            if (!$q->fetchColumn()) json_response(['error' => 'Não és membro deste grupo.'], 403);
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
            $offset = ($page - 1) * $limit;
            $q = $pdo->prepare("
                SELECT m.id, m.sender_id, u.username AS sender_name, m.body, m.created_at, m.read_at
                FROM chat_messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.group_id = ?
                ORDER BY m.id DESC
                LIMIT ? OFFSET ?
            ");
            $q->execute([$gid, $limit, $offset]);
            $messages = array_reverse($q->fetchAll());
            json_response(['messages' => $messages, 'pagination' => ['page' => $page, 'limit' => $limit]]);
        }

        json_response(['error' => 'Ação inválida.'], 422);
    }

    // ---------- POST ----------
    if ($method !== 'POST') {
        json_response(['error' => 'Método não suportado.'], 405);
    }
    require_csrf();
    $action = (string)($_POST['action'] ?? '');

    if ($action === 'create') {
        $name = clean_text($_POST['name'] ?? '', 100);
        if ($name === '') json_response(['error' => 'Dá um nome ao grupo.'], 422);
        $pdo->beginTransaction();
        $pdo->prepare('INSERT INTO chat_groups (name, created_by) VALUES (?, ?)')->execute([$name, $uid]);
        $gid = (int)$pdo->lastInsertId();
        $pdo->prepare('INSERT INTO chat_group_members (group_id, user_id, role) VALUES (?, ?, ?)')->execute([$gid, $uid, 'admin']);
        $pdo->commit();
        json_response(['ok' => true, 'group_id' => $gid, 'name' => $name]);
    }

    if ($action === 'add_member') {
        $gid = filter_var($_POST['group_id'] ?? null, FILTER_VALIDATE_INT);
        $targetId = filter_var($_POST['user_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$gid || !$targetId) json_response(['error' => 'Grupo ou utilizador inválido.'], 422);
        // Verificar se o utilizador atual é admin do grupo
        $q = $pdo->prepare("SELECT role FROM chat_group_members WHERE group_id=? AND user_id=?");
        $q->execute([$gid, $uid]);
        $membership = $q->fetch();
        if (!$membership || $membership['role'] !== 'admin') {
            json_response(['error' => 'Apenas admins podem adicionar membros.'], 403);
        }
        // Verificar se o alvo existe
        $q = $pdo->prepare('SELECT 1 FROM users WHERE id=?');
        $q->execute([$targetId]);
        if (!$q->fetchColumn()) json_response(['error' => 'Utilizador não encontrado.'], 404);
        // Adicionar (ou ignorar se já for membro)
        $pdo->prepare('INSERT IGNORE INTO chat_group_members (group_id, user_id, role) VALUES (?, ?, ?)')->execute([$gid, $targetId, 'member']);
        json_response(['ok' => true]);
    }

    if ($action === 'leave') {
        $gid = filter_var($_POST['group_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$gid) json_response(['error' => 'Grupo inválido.'], 422);
        // Verificar se é membro
        $q = $pdo->prepare('SELECT role FROM chat_group_members WHERE group_id=? AND user_id=?');
        $q->execute([$gid, $uid]);
        $membership = $q->fetch();
        if (!$membership) json_response(['error' => 'Não és membro deste grupo.'], 403);
        // Se for o único admin, não pode sair sem transferir admin
        if ($membership['role'] === 'admin') {
            $q = $pdo->prepare('SELECT COUNT(*) FROM chat_group_members WHERE group_id=? AND role="admin"');
            $q->execute([$gid]);
            $adminCount = (int)$q->fetchColumn();
            if ($adminCount <= 1) {
                json_response(['error' => 'Transfira a administração antes de sair do grupo.'], 400);
            }
        }
        $pdo->prepare('DELETE FROM chat_group_members WHERE group_id=? AND user_id=?')->execute([$gid, $uid]);
        json_response(['ok' => true]);
    }

    if ($action === 'delete') {
        $gid = filter_var($_POST['group_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$gid) json_response(['error' => 'Grupo inválido.'], 422);
        $q = $pdo->prepare('SELECT created_by FROM chat_groups WHERE id=?');
        $q->execute([$gid]);
        $group = $q->fetch();
        if (!$group) json_response(['error' => 'Grupo não encontrado.'], 404);
        if ((int)$group['created_by'] !== $uid) json_response(['error' => 'Apenas o criador pode apagar o grupo.'], 403);
        $pdo->prepare('DELETE FROM chat_group_members WHERE group_id=?')->execute([$gid]);
        $pdo->prepare('DELETE FROM chat_messages WHERE group_id=?')->execute([$gid]);
        $pdo->prepare('DELETE FROM chat_groups WHERE id=?')->execute([$gid]);
        json_response(['ok' => true]);
    }

    json_response(['error' => 'Ação desconhecida.'], 422);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível aceder à base de dados.'], 503);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível concluir a operação.'], 500);
}
