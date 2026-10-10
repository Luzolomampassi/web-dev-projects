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
        json_response(['authenticated' => true, 'user' => $user, 'settings' => $q->fetch() ?: ['theme' => 'light']]);
    }
    require_csrf();
    $action = $_POST['action'] ?? '';
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
            // Claim any pre-account data from the original single-user version.
            $pdo->prepare('UPDATE games SET user_id=? WHERE user_id IS NULL')->execute([$id]);
            $pdo->prepare('UPDATE collections SET user_id=? WHERE user_id IS NULL')->execute([$id]);
        } else {
            $q=$pdo->prepare('SELECT id,username,email,password_hash,bio FROM users WHERE email=?'); $q->execute([$email]); $row=$q->fetch();
            if (!$row || !password_verify($password,$row['password_hash'])) json_response(['error'=>'Email ou palavra-passe incorretos.'],401);
            $id=(int)$row['id']; $username=$row['username'];
        }
        session_regenerate_id(true);
        $_SESSION['user']=['id'=>$id,'username'=>$username,'email'=>$email,'bio'=>$action==='register'?'':($row['bio']??'')];
        $pdo->prepare("INSERT IGNORE INTO user_settings (user_id,theme) VALUES (?,'light')")->execute([$id]);
        json_response(['ok'=>true,'user'=>$_SESSION['user']]);
    }
    if ($action === 'logout') { $_SESSION=[]; session_regenerate_id(true); json_response(['ok'=>true]); }
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
