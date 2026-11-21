<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

$publicId = $_GET['public_id'] ?? $_GET['id'] ?? '';

if ($publicId === '') {
    http_response_code(400);
    echo 'Parâmetro public_id ou id é obrigatório.';
    exit;
}

try {
    $pdo = db();

    $q = $pdo->prepare('SELECT id, username, bio, public_id, created_at FROM users WHERE public_id=? OR id=?');
    $q->execute([$publicId, $publicId]);
    $profile = $q->fetch();

    if (!$profile) {
        http_response_code(404);
        echo 'Jogador não encontrado.';
        exit;
    }

    $uid = (int)$profile['id'];

    // Jogos públicos (não privados)
    $q = $pdo->prepare("SELECT id,title,platform,genre,status,hours,rating,release_date,cover_path,is_wishlist,favorite FROM games WHERE user_id=? AND is_wishlist=0 ORDER BY CASE status WHEN 'playing' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, updated_at DESC");
    $q->execute([$uid]);
    $games = $q->fetchAll();

    // Coleções públicas
    $q = $pdo->prepare('SELECT c.id,c.name,COUNT(gc.game_id) AS game_count FROM collections c LEFT JOIN game_collections gc ON gc.collection_id=c.id WHERE c.user_id=? GROUP BY c.id ORDER BY c.name');
    $q->execute([$uid]);
    $collections = $q->fetchAll();

    $memberSince = date('M Y', strtotime($profile['created_at']));
    $totalGames = count($games);
    $completed = count(array_filter($games, fn($g) => $g['status'] === 'completed'));
    $hours = array_sum(array_column($games, 'hours'));

} catch (Throwable $e) {
    http_response_code(500);
    echo 'Erro ao carregar perfil: ' . htmlspecialchars($e->getMessage());
    exit;
}
?>
<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= htmlspecialchars($profile['username']) ?> — Perfil Arcadia</title>
    <link rel="stylesheet" href="assets/css/app.css?v=public-profile-20261115">
    <style>
        body { background: var(--bg); color: var(--text); font-family: "DM Sans", sans-serif; margin: 0; padding: 24px; }
        .public-card { max-width: 700px; margin: 0 auto; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 24px; }
        .public-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .public-avatar { width: 64px; height: 64px; border-radius: 50%; background: #32303a; color: #b3a8d9; display: grid; place-items: center; font-weight: 700; font-size: 24px; }
        .public-info h1 { margin: 0; font: 600 24px "Space Grotesk", sans-serif; }
        .public-info p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
        .public-id { display: inline-block; margin-top: 8px; font-size: 11px; color: var(--muted); }
        .public-stats { display: flex; gap: 16px; margin-bottom: 20px; }
        .stat { text-align: center; }
        .stat strong { display: block; font: 600 20px "Space Grotesk", sans-serif; }
        .stat span { color: var(--muted); font-size: 11px; }
        .public-section { margin-bottom: 24px; }
        .public-section h2 { font: 600 18px "Space Grotesk", sans-serif; margin: 0 0 12px; color: var(--text); }
        .games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
        .game-card { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--surface2); }
        .game-cover { height: 90px; background: #2a2733; display: grid; place-items: center; color: #888; font-size: 10px; }
        .game-card h3 { margin: 8px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .game-meta { font-size: 10px; color: var(--muted); margin: 0 8px 8px; }
        .collections-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .collection-tag { background: #2a2733; color: #b3a8d9; padding: 6px 10px; border-radius: 6px; font-size: 11px; border: 1px solid var(--line); }
        .back-link { display: inline-block; margin-top: 20px; color: var(--muted); text-decoration: none; font-size: 12px; }
        .back-link:hover { color: var(--text); }
        .empty { text-align: center; color: var(--muted); padding: 24px; }
    </style>
</head>
<body>
    <div class="public-card">
        <div class="public-header">
            <div class="public-avatar"><?= htmlspecialchars(mb_strtoupper(mb_substr($profile['username'], 0, 1))) ?></div>
            <div class="public-info">
                <h1><?= htmlspecialchars($profile['username']) ?></h1>
                <p>Membro desde <?= htmlspecialchars($memberSince) ?> · ID Arcadia: <strong><?= htmlspecialchars($profile['public_id']) ?></strong></p>
                <p><?= htmlspecialchars($profile['bio'] ?? 'Este jogador ainda não adicionou uma biografia.') ?></p>
            </div>
        </div>

        <div class="public-stats">
            <div class="stat"><strong><?= $totalGames ?></strong><span>Jogos na biblioteca</span></div>
            <div class="stat"><strong><?= $completed ?></strong><span>Concluídos</span></div>
            <div class="stat"><strong><?= number_format($hours) ?></strong><span>Horas registadas</span></div>
            <div class="stat"><strong><?= count($collections) ?></strong><span>Coleções</span></div>
        </div>

        <div class="public-section">
            <h2>Biblioteca</h2>
            <?php if ($totalGames > 0): ?>
                <div class="games-grid">
                    <?php foreach ($games as $g): ?>
                        <article class="game-card">
                            <div class="game-cover">
                                <?php if ($g['cover_path']): ?>
                                    <img src="uploads/<?= htmlspecialchars($g['cover_path']) ?>" alt="<?= htmlspecialchars($g['title']) ?>" style="width:100%;height:100%;object-fit:cover">
                                <?php else: ?>
                                    <?= htmlspecialchars(mb_strtoupper(mb_substr($g['title'], 0, 1))) ?>
                                <?php endif; ?>
                            </div>
                            <h3><?= htmlspecialchars($g['title']) ?></h3>
                            <p class="game-meta"><?= htmlspecialchars($g['platform'] ?: '—') ?> · <?= htmlspecialchars(ucfirst($g['status'])) ?></p>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="empty">Este jogador ainda não tem jogos na biblioteca.</div>
            <?php endif; ?>
        </div>

        <?php if (count($collections) > 0): ?>
            <div class="public-section">
                <h2>Coleções</h2>
                <div class="collections-list">
                    <?php foreach ($collections as $c): ?>
                        <span class="collection-tag"><?= htmlspecialchars($c['name']) ?> · <?= (int)$c['game_count'] ?> jogos</span>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>

        <a class="back-link" href="index.php">← Voltar ao Arcadia</a>
    </div>
</body>
</html>
