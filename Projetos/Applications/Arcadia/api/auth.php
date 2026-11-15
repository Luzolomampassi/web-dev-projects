<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo = db();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        if (!current_user()) json_response(['authenticated' => false]);
        $user = current_user();
        $q = $pdo->prepare('SELECT theme FROM user_settings WHERE user_id=?'); $q->execute([$user['id']]);
        $profile = $pdo->prepare('SELECT username,email,bio,public_id FROM users WHERE id=?'); $profile->execute([$user['id']]);
        $current = array_merge($user, $profile->fetch() ?: []); $_SESSION['user'] = $current;
        json_response(['authenticated' => true, 'user' => $current, 'settings' => $q->fetch() ?: ['theme' => 'light']]);
    }
    $action = $_POST['action'] ?? '';

    // Ações que não exigem CSRF (chamadas via link de email ou sem sessão)
    $noCsrfActions = ['forgot_password', 'reset_password', 'verify_email'];

    if (!in_array($action, $noCsrfActions, true)) {
        require_csrf();
    }

    // Rate limiting para login e registo (máximo 5 tentativas por 15 minutos por IP/email)
    if ($action === 'register' || $action === 'login') {
        $identifier = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        if ($email !== '') {
            $identifier .= ':' . $email;
        }
        $q = $pdo->prepare('SELECT COUNT(*) AS cnt FROM login_attempts WHERE identifier=? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)');
        $q->execute([$identifier]);
        if ((int)$q->fetchColumn() >= 5) {
            json_response(['error' => 'Muitas tentativas. Tente novamente daqui a 15 minutos.'], 429);
        }
    }

    if ($action === 'register' || $action === 'login') {
        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        $password = (string)($_POST['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error' => 'Introduz um endereço de email válido.'], 422);
        if ($action === 'register') {
            $username = clean_text($_POST['username'] ?? '', 40);
            if (!preg_match('/^[\pL\pN_.-]{3,40}$/u', $username)) json_response(['error' => 'O nome deve ter 3 a 40 caracteres: letras, números, ponto, hífen ou underscore.'], 422);
            if (strlen($password) < 8) json_response(['error' => 'A palavra-passe deve ter pelo menos 8 caracteres.'], 422);
            $q=$pdo->prepare('INSERT INTO users (username,email,password_hash) VALUES (?,?,?)');
            try { $q->execute([$username,$email,password_hash($password,PASSWORD_DEFAULT)]); }
            catch (PDOException $e) { if ((string)$e->getCode()==='23000') json_response(['error'=>'Esse email ou nome de jogador já está registado.'],409); throw $e; }
            $id=(int)$pdo->lastInsertId();
            do { $publicId='AR-'.strtoupper(bin2hex(random_bytes(4))); $check=$pdo->prepare('SELECT 1 FROM users WHERE public_id=?'); $check->execute([$publicId]); } while ($check->fetchColumn());
            $pdo->prepare('UPDATE users SET public_id=? WHERE id=?')->execute([$publicId,$id]);
        } else {
            $q=$pdo->prepare('SELECT id,username,email,password_hash,bio,public_id FROM users WHERE email=?'); $q->execute([$email]); $row=$q->fetch();
            if (!$row || !password_verify($password,$row['password_hash'])) {
                $pdo->prepare('INSERT INTO login_attempts (identifier) VALUES (?)')->execute([$identifier]);
                $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)')->execute();
                json_response(['error'=>'Email ou palavra-passe incorretos.'],401);
            }
            $id=(int)$row['id']; $username=$row['username'];
        }
        session_regenerate_id(true);
        $_SESSION['user']=['id'=>$id,'username'=>$username,'email'=>$email,'bio'=>$action==='register'?'':($row['bio']??''),'public_id'=>$action==='register'?$publicId:($row['public_id']??'')];
        $pdo->prepare("INSERT IGNORE INTO user_settings (user_id,theme) VALUES (?,'light')")->execute([$id]);
        json_response(['ok'=>true,'user'=>$_SESSION['user']]);
    }
    if ($action === 'logout') { $_SESSION=[]; session_regenerate_id(true); json_response(['ok'=>true]); }

    // --- Ações sem sessão obrigatória (esqueci a palavra-passe, verificação de email) ---
    if ($action === 'forgot_password') {
        // Rate limiting específico para forgot_password (máximo 3 por 15 min por IP/email)
        $fpIdentifier = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $fpEmail = strtolower(trim((string)($_POST['email'] ?? '')));
        if ($fpEmail !== '') {
            $fpIdentifier .= ':' . $fpEmail;
        }
        $qFp = $pdo->prepare('SELECT COUNT(*) AS cnt FROM login_attempts WHERE identifier=? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)');
        $qFp->execute(['fp:' . $fpIdentifier]);
        if ((int)$qFp->fetchColumn() >= 3) {
            json_response(['ok' => true, 'message' => 'Se o email existir, receberá instruções de redefinição.']);
        }
        $pdo->prepare('INSERT INTO login_attempts (identifier) VALUES (?)')->execute(['fp:' . $fpIdentifier]);

        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['ok' => true, 'message' => 'Se o email existir, receberá instruções de redefinição.']);
        $q = $pdo->prepare('SELECT id FROM users WHERE email=?'); $q->execute([$email]); $row = $q->fetch();
        if ($row) {
            $token = bin2hex(random_bytes(32));
            $pdo->prepare('DELETE FROM password_resets WHERE user_id=?')->execute([(int)$row['id']]);
            $pdo->prepare('INSERT INTO password_resets (user_id, token) VALUES (?,?)')->execute([(int)$row['id'], $token]);
            // Em produção, envia email com link: reset-password.php?token=... ou api/auth.php?action=reset_password&token=...
        }
        // Sempre retorna a mesma mensagem independentemente de o email existir (evita enumeração)
        json_response(['ok' => true, 'message' => 'Se o email existir, receberá instruções de redefinição.']);
    }

    if ($action === 'reset_password') {
        $token = trim((string)($_POST['token'] ?? ''));
        $next = (string)($_POST['new_password'] ?? '');
        if ($token === '' || strlen($next) < 8) json_response(['error' => 'Token inválido ou nova palavra-passe curta demais.'], 422);
        $q = $pdo->prepare('SELECT pr.user_id, pr.expires_at, pr.used_at FROM password_resets pr WHERE pr.token=?'); $q->execute([$token]); $reset = $q->fetch();
        if (!$reset) json_response(['error' => 'Token inválido.'], 422);
        if ((int)$reset['used_at'] !== null) json_response(['error' => 'Este token já foi utilizado.'], 422);
        if (strtotime($reset['expires_at']) < time()) json_response(['error' => 'O token expirou. Solicite uma nova redefinição.'], 422);
        $pdo->prepare('UPDATE users SET password_hash=? WHERE id=?')->execute([password_hash($next, PASSWORD_DEFAULT), (int)$reset['user_id']]);
        $pdo->prepare('UPDATE password_resets SET used_at=NOW() WHERE token=?')->execute([$token]);
        json_response(['ok' => true, 'message' => 'Palavra-passe redefinida com sucesso.']);
    }

    if ($action === 'verify_email') {
        $token = trim((string)($_POST['token'] ?? ''));
        if ($token === '') json_response(['error' => 'Token de verificação inválido.'], 422);
        $q = $pdo->prepare('SELECT ev.user_id, ev.is_verified, ev.expires_at FROM email_verifications ev WHERE ev.token=?'); $q->execute([$token]); $ver = $q->fetch();
        if (!$ver) json_response(['error' => 'Token inválido.'], 422);
        if ((int)$ver['is_verified'] === 1) json_response(['ok' => true, 'message' => 'Email já verificado.']);
        if (strtotime($ver['expires_at']) < time()) json_response(['error' => 'O token de verificação expirou. Solicite um novo.'], 422);
        $pdo->prepare('UPDATE email_verifications SET is_verified=1, verified_at=NOW() WHERE token=?')->execute([$token]);
        json_response(['ok' => true, 'message' => 'Email verificado com sucesso.']);
    }

    if ($action === 'resend_verification') {
        $user = require_login(); $id = (int)$user['id'];
        $token = bin2hex(random_bytes(32));
        $pdo->prepare('DELETE FROM email_verifications WHERE user_id=? AND is_verified=0')->execute([$id]);
        $pdo->prepare('INSERT INTO email_verifications (user_id, token) VALUES (?,?)')->execute([$id, $token]);
        json_response(['ok' => true, 'message' => 'Novo token de verificação gerado.', 'token' => $token]);
    }

    $user=require_login(); $id=(int)$user['id'];
    if ($action === 'profile') {
        $username=clean_text($_POST['username']??'',40); $bio=clean_text($_POST['bio']??'',500);
        if (!preg_match('/^[\pL\pN_.-]{3,40}$/u',$username)) json_response(['error'=>'O nome deve ter 3 a 40 caracteres.'],422);
        $pdo->prepare('UPDATE users SET username=?,bio=? WHERE id=?')->execute([$username,$bio,$id]);
        $_SESSION['user']['username']=$username; $_SESSION['user']['bio']=$bio;
        json_response(['ok'=>true,'user'=>$_SESSION['user']]);
    }
    if ($action === 'settings') {
        $theme=($_POST['theme']??'light')==='dark'?'dark':'light';
        $pdo->prepare('INSERT INTO user_settings (user_id,theme) VALUES (?,?) ON DUPLICATE KEY UPDATE theme=VALUES(theme)')->execute([$id,$theme]);
        json_response(['ok'=>true,'theme'=>$theme]);
    }
    if ($action === 'password') {
        $current=(string)($_POST['current_password']??''); $next=(string)($_POST['new_password']??'');
        $q=$pdo->prepare('SELECT password_hash FROM users WHERE id=?');$q->execute([$id]);
        if (!password_verify($current,(string)$q->fetchColumn())) json_response(['error'=>'A palavra-passe atual está incorreta.'],422);
        if (strlen($next)<8) json_response(['error'=>'A nova palavra-passe deve ter pelo menos 8 caracteres.'],422);
        $pdo->prepare('UPDATE users SET password_hash=? WHERE id=?')->execute([password_hash($next,PASSWORD_DEFAULT),$id]);
        json_response(['ok'=>true]);
    }
    json_response(['error'=>'Ação desconhecida.'],422);
} catch (PDOException $e) { json_response(['error'=>'Não foi possível ligar à base de dados. Confirma os dados do MySQL em config.php.'],503); }
catch (Throwable $e) { json_response(['error'=>'Não foi possível concluir a operação.'],500); }
