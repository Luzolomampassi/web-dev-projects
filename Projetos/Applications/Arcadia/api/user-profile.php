<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo = db();
    $user = require_login();
    $uid = (int)$user['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // ---------- GET: dados do perfil do utilizador autenticado ----------
    if ($method === 'GET') {
        $action = (string)($_GET['action'] ?? 'me');

        if ($action === 'me') {
            $q = $pdo->prepare('SELECT id, username, email, bio, public_id, avatar_path, banner_path, steam_id, epic_id, created_at FROM users WHERE id=?');
            $q->execute([$uid]);
            $profile = $q->fetch();
            if (!$profile) json_response(['error' => 'Utilizador não encontrado.'], 404);
            json_response(['user' => $profile]);
        }

        if ($action === 'friends') {
            $q = $pdo->prepare("
                SELECT u.id, u.username, u.public_id, u.avatar_path, u.bio, f.created_at AS friends_since
                FROM friendships f
                JOIN users u ON u.id = IF(f.requester_id = ?, f.recipient_id, f.requester_id)
                WHERE (f.user_one = ? OR f.user_two = ?) AND f.status = 'accepted'
                ORDER BY u.username
            ");
            $q->execute([$uid, $uid, $uid]);
            $friends = $q->fetchAll();
            json_response(['friends' => $friends]);
        }

        if ($action === 'favorite-games') {
            $q = $pdo->prepare("
                SELECT * FROM games WHERE user_id=? AND favorite=1 AND is_wishlist=0 ORDER BY updated_at DESC LIMIT 10
            ");
            $q->execute([$uid]);
            $games = $q->fetchAll();
            json_response(['games' => array_map('game_payload', $games)]);
        }

        if ($action === 'all-games') {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = max(1, min(100, (int)($_GET['limit'] ?? 10)));
            $offset = ($page - 1) * $limit;
            $q = $pdo->prepare("
                SELECT * FROM games WHERE user_id=? AND is_wishlist=0 ORDER BY updated_at DESC LIMIT ? OFFSET ?
            ");
            $q->execute([$uid, $limit, $offset]);
            $games = $q->fetchAll();
            $q = $pdo->prepare('SELECT COUNT(*) AS total FROM games WHERE user_id=? AND is_wishlist=0');
            $q->execute([$uid]);
            $total = (int)$q->fetchColumn();
            json_response([
                'games' => array_map('game_payload', $games),
                'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'pages' => (int)ceil($total / $limit)],
            ]);
        }

        json_response(['error' => 'Ação inválida.'], 422);
    }

    // ---------- POST: upload/atualizar media e integrações ----------
    if ($method !== 'POST') {
        json_response(['error' => 'Método não suportado.'], 405);
    }
    require_csrf();
    $action = (string)($_POST['action'] ?? '');

    // ---------- AVATAR ----------
    if ($action === 'upload-avatar') {
        if (!isset($_FILES['avatar']) || !is_uploaded_file($_FILES['avatar']['tmp_name'])) {
            json_response(['error' => 'Nenhum ficheiro enviado.'], 422);
        }
        if ($_FILES['avatar']['error'] !== UPLOAD_ERR_OK || $_FILES['avatar']['size'] > 5 * 1024 * 1024) {
            json_response(['error' => 'O ficheiro não foi carregado. Confirma que tem menos de 5 MB.'], 422);
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES['avatar']['tmp_name']);
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
        if (!isset($extensions[$mime])) {
            json_response(['error' => 'Formato de imagem não suportado. Usa JPG, PNG, WebP ou GIF.'], 422);
        }
        $ext = $extensions[$mime];
        $imageInfo = @getimagesize($_FILES['avatar']['tmp_name']);
        if ($imageInfo === false) {
            json_response(['error' => 'O ficheiro não é uma imagem válida.'], 422);
        }
        if ($imageInfo[0] > 2048 || $imageInfo[1] > 2048) {
            json_response(['error' => 'A imagem excede 2048 px de largura ou altura.'], 422);
        }
        if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) {
            throw new RuntimeException('Não foi possível preparar a pasta de uploads.');
        }
        $filename = 'avatar_' . $uid . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
        if (!move_uploaded_file($_FILES['avatar']['tmp_name'], UPLOAD_DIR . '/' . $filename)) {
            throw new RuntimeException('Não foi possível guardar o avatar.');
        }
        // Remover avatar antigo se existir
        $q = $pdo->prepare('SELECT avatar_path FROM users WHERE id=?');
        $q->execute([$uid]);
        $old = $q->fetchColumn();
        if ($old && is_file(UPLOAD_DIR . '/' . basename((string)$old))) {
            @unlink(UPLOAD_DIR . '/' . basename((string)$old));
        }
        $pdo->prepare('UPDATE users SET avatar_path=? WHERE id=?')->execute([$filename, $uid]);
        json_response(['ok' => true, 'avatar_path' => $filename]);
    }

    // ---------- BANNER ----------
    if ($action === 'upload-banner') {
        if (!isset($_FILES['banner']) || !is_uploaded_file($_FILES['banner']['tmp_name'])) {
            json_response(['error' => 'Nenhum ficheiro enviado.'], 422);
        }
        if ($_FILES['banner']['error'] !== UPLOAD_ERR_OK || $_FILES['banner']['size'] > 10 * 1024 * 1024) {
            json_response(['error' => 'O ficheiro não foi carregado. Confirma que tem menos de 10 MB.'], 422);
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES['banner']['tmp_name']);
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
        if (!isset($extensions[$mime])) {
            json_response(['error' => 'Formato de imagem não suportado. Usa JPG, PNG, WebP ou GIF (GIF permite animação).'], 422);
        }
        $ext = $extensions[$mime];
        $imageInfo = @getimagesize($_FILES['banner']['tmp_name']);
        if ($imageInfo === false) {
            json_response(['error' => 'O ficheiro não é uma imagem válida.'], 422);
        }
        if ($imageInfo[0] > 1920 || $imageInfo[1] > 1080) {
            json_response(['error' => 'A imagem excede 1920x1080 px.'], 422);
        }
        if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) {
            throw new RuntimeException('Não foi possível preparar a pasta de uploads.');
        }
        $filename = 'banner_' . $uid . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
        if (!move_uploaded_file($_FILES['banner']['tmp_name'], UPLOAD_DIR . '/' . $filename)) {
            throw new RuntimeException('Não foi possível guardar o banner.');
        }
        $q = $pdo->prepare('SELECT banner_path FROM users WHERE id=?');
        $q->execute([$uid]);
        $old = $q->fetchColumn();
        if ($old && is_file(UPLOAD_DIR . '/' . basename((string)$old))) {
            @unlink(UPLOAD_DIR . '/' . basename((string)$old));
        }
        $pdo->prepare('UPDATE users SET banner_path=? WHERE id=?')->execute([$filename, $uid]);
        json_response(['ok' => true, 'banner_path' => $filename]);
    }

    // ---------- REMOVER AVATAR ----------
    if ($action === 'remove-avatar') {
        $q = $pdo->prepare('SELECT avatar_path FROM users WHERE id=?');
        $q->execute([$uid]);
        $old = $q->fetchColumn();
        if ($old && is_file(UPLOAD_DIR . '/' . basename((string)$old))) {
            @unlink(UPLOAD_DIR . '/' . basename((string)$old));
        }
        $pdo->prepare('UPDATE users SET avatar_path=NULL WHERE id=?')->execute([$uid]);
        json_response(['ok' => true]);
    }

    // ---------- REMOVER BANNER ----------
    if ($action === 'remove-banner') {
        $q = $pdo->prepare('SELECT banner_path FROM users WHERE id=?');
        $q->execute([$uid]);
        $old = $q->fetchColumn();
        if ($old && is_file(UPLOAD_DIR . '/' . basename((string)$old))) {
            @unlink(UPLOAD_DIR . '/' . basename((string)$old));
        }
        $pdo->prepare('UPDATE users SET banner_path=NULL WHERE id=?')->execute([$uid]);
        json_response(['ok' => true]);
    }

    // ---------- INTEGRAÇÃO STEAM ----------
    if ($action === 'link-steam') {
        $steamId = (string)($_POST['steam_id'] ?? '');
        $accessToken = (string)($_POST['access_token'] ?? '');
        if ($steamId === '') {
            json_response(['error' => 'ID da Steam é obrigatório.'], 422);
        }
        // Verificar se este Steam ID já está ligado a outra conta
        $q = $pdo->prepare('SELECT id FROM users WHERE steam_id=? AND id<>?');
        $q->execute([$steamId, $uid]);
        if ($q->fetchColumn()) {
            json_response(['error' => 'Este ID da Steam já está ligado a outra conta.'], 409);
        }
        $pdo->prepare('UPDATE users SET steam_id=?, steam_access_token=? WHERE id=?')
            ->execute([$steamId, $accessToken, $uid]);
        json_response(['ok' => true, 'message' => 'Conta da Steam ligada com sucesso.']);
    }

    if ($action === 'unlink-steam') {
        $pdo->prepare('UPDATE users SET steam_id=NULL, steam_access_token=NULL WHERE id=?')->execute([$uid]);
        json_response(['ok' => true, 'message' => 'Conta da Steam desligada.']);
    }

    // ---------- INTEGRAÇÃO EPIC ----------
    if ($action === 'link-epic') {
        $epicId = (string)($_POST['epic_id'] ?? '');
        $accessToken = (string)($_POST['access_token'] ?? '');
        if ($epicId === '') {
            json_response(['error' => 'ID da Epic é obrigatório.'], 422);
        }
        $q = $pdo->prepare('SELECT id FROM users WHERE epic_id=? AND id<>?');
        $q->execute([$epicId, $uid]);
        if ($q->fetchColumn()) {
            json_response(['error' => 'Este ID da Epic já está ligado a outra conta.'], 409);
        }
        $pdo->prepare('UPDATE users SET epic_id=?, epic_access_token=? WHERE id=?')
            ->execute([$epicId, $accessToken, $uid]);
        json_response(['ok' => true, 'message' => 'Conta da Epic ligada com sucesso.']);
    }

    if ($action === 'unlink-epic') {
        $pdo->prepare('UPDATE users SET epic_id=NULL, epic_access_token=NULL WHERE id=?')->execute([$uid]);
        json_response(['ok' => true, 'message' => 'Conta da Epic desligada.']);
    }

    json_response(['error' => 'Ação desconhecida.'], 422);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível aceder à base de dados.'], 503);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível concluir a operação.'], 500);
}
