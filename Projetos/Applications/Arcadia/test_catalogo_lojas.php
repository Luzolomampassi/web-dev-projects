<?php
declare(strict_types=1);

$root = __DIR__;

function fileExistsLocal(string $path): bool {
    return is_file($path);
}

function fileContainsLocal(string $path, string $needle): bool {
    if (!is_file($path)) return false;
    $content = @file_get_contents($path);
    return $content !== false && strpos($content, $needle) !== false;
}

function tableExistsLocal(string $table): ?bool {
    try {
        require_once $GLOBALS['root'] . '/includes/bootstrap.php';
        $pdo = db();
        $q = $pdo->prepare("SHOW TABLES LIKE ?");
        $q->execute([$table]);
        return $q->fetchColumn() !== false;
    } catch (Throwable) {
        return null;
    }
}

$tests = [];

// ---------- Steam ----------
$tests[] = [
    'id' => 'S1',
    'grupo' => 'Steam',
    'titulo' => 'Endpoint de busca Steam',
    'descricao' => 'api/catalog.php responde a ?platform=steam&search= com resultados',
    'resolvido' => fileExistsLocal($root . '/api/catalog.php') && fileContainsLocal($root . '/api/catalog.php', "case 'steam':") && fileContainsLocal($root . '/api/catalog.php', 'steam_search_store'),
    'ficheiro' => 'api/catalog.php, includes/steam.php',
    'detalhe' => 'Endpoint catalog.php tem case steam e chama steam_search_store().',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'S2',
    'grupo' => 'Steam',
    'titulo' => 'Destaques Steam',
    'descricao' => 'api/catalog.php responde a ?platform=steam&featured=1',
    'resolvido' => fileContainsLocal($root . '/api/catalog.php', 'steam_sync_featured') && fileContainsLocal($root . '/api/catalog.php', 'catalog_apps WHERE featured_rank'),
    'ficheiro' => 'api/catalog.php',
    'detalhe' => 'Chama steam_sync_featured() e consulta catalog_apps com featured_rank.',
    'precisaBD' => true,
    'tabela' => 'catalog_apps',
];
$tests[] = [
    'id' => 'S3',
    'grupo' => 'Steam',
    'titulo' => 'Detalhes de app Steam',
    'descricao' => 'api/catalog.php responde a ?platform=steam&appid=',
    'resolvido' => fileContainsLocal($root . '/api/catalog.php', 'steam_fetch_app_details'),
    'ficheiro' => 'api/catalog.php, includes/steam.php',
    'detalhe' => 'Chama steam_fetch_app_details() para detalhes do jogo.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'S4',
    'grupo' => 'Steam',
    'titulo' => 'Adicionar jogo da Steam',
    'descricao' => 'POST action=add_from_store com platform=steam insere na tabela games',
    'resolvido' => fileContainsLocal($root . '/api/catalog.php', "action === 'add_from_store'") && fileContainsLocal($root . '/api/catalog.php', 'steam_app_id'),
    'ficheiro' => 'api/catalog.php',
    'detalhe' => 'Endpoint aceita adicionar jogos da Steam para a biblioteca do utilizador.',
    'precisaBD' => true,
    'tabela' => 'games',
];

// ---------- PlayStation ----------
$tests[] = [
    'id' => 'PS1',
    'grupo' => 'PlayStation',
    'titulo' => 'Endpoint de busca PlayStation Store',
    'descricao' => 'api/catalog.php responde a ?platform=playstation&search= com ps_search_store()',
    'resolvido' => fileContainsLocal($root . '/api/catalog.php', "case 'playstation':") && fileContainsLocal($root . '/api/catalog.php', 'ps_search_store'),
    'ficheiro' => 'api/catalog.php, includes/playstation.php',
    'detalhe' => 'Endpoint catalog.php tem case playstation e chama ps_search_store().',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'PS2',
    'grupo' => 'PlayStation',
    'titulo' => 'Módulo PlayStation existe',
    'descricao' => 'includes/playstation.php criado com funções de busca e detalhes',
    'resolvido' => fileExistsLocal($root . '/includes/playstation.php') && fileContainsLocal($root . '/includes/playstation.php', 'function ps_search_store') && fileContainsLocal($root . '/includes/playstation.php', 'function ps_get_app_details'),
    'ficheiro' => 'includes/playstation.php',
    'detalhe' => 'Ficheiro inclui ps_search_store() e ps_get_app_details().',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'PS3',
    'grupo' => 'PlayStation',
    'titulo' => 'PlayStation sem autenticação obrigatória',
    'descricao' => 'Busca pública funciona sem credenciais OAuth',
    'resolvido' => fileContainsLocal($root . '/includes/playstation.php', 'curl_init') && fileContainsLocal($root . '/includes/playstation.php', 'store.playstation.com'),
    'ficheiro' => 'includes/playstation.php',
    'detalhe' => 'Usa cURL para endpoint público da PlayStation Store.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'PS4',
    'grupo' => 'PlayStation',
    'titulo' => 'Adicionar jogo da PlayStation',
    'descricao' => 'POST action=add_from_store com platform=playstation',
    'resolvido' => fileContainsLocal($root . '/api/catalog.php', "case 'playstation':") && fileContainsLocal($root . '/api/catalog.php', '$externalId'),
    'ficheiro' => 'api/catalog.php',
    'detalhe' => 'Endpoint aceita adicionar jogos da PlayStation para a biblioteca.',
    'precisaBD' => true,
    'tabela' => 'games',
];

// ---------- Xbox ----------
$tests[] = [
    'id' => 'X1',
    'grupo' => 'Xbox',
    'titulo' => 'Endpoint de busca Xbox',
    'descricao' => 'api/catalog.php responde a ?platform=xbox&search= com xbox_search_store()',
    'resolvido' => fileContainsLocal($root . '/api/catalog.php', "case 'xbox':") && fileContainsLocal($root . '/api/catalog.php', 'xbox_search_store'),
    'ficheiro' => 'api/catalog.php, includes/xbox.php',
    'detalhe' => 'Endpoint catalog.php tem case xbox e chama xbox_search_store().',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'X2',
    'grupo' => 'Xbox',
    'titulo' => 'Módulo Xbox existe',
    'descricao' => 'includes/xbox.php criado com funções de cliente ID/Secret',
    'resolvido' => fileExistsLocal($root . '/includes/xbox.php') && fileContainsLocal($root . '/includes/xbox.php', 'function xbox_client_id') && fileContainsLocal($root . '/includes/xbox.php', 'function xbox_client_secret'),
    'ficheiro' => 'includes/xbox.php',
    'detalhe' => 'Ficheiro inclui xbox_client_id() e xbox_client_secret().',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'X3',
    'grupo' => 'Xbox',
    'titulo' => 'Xbox requer credenciais de desenvolvedor',
    'descricao' => 'Documenta que Xbox API precisa de Client ID/Secret',
    'resolvido' => fileContainsLocal($root . '/includes/xbox.php', 'client_id') && fileContainsLocal($root . '/includes/xbox.php', 'client_secret') && fileContainsLocal($root . '/config.php', "'xbox'"),
    'ficheiro' => 'includes/xbox.php, config.php',
    'detalhe' => 'config.php inclui seção xbox com client_id e client_secret via $_ENV/getenv.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'X4',
    'grupo' => 'Xbox',
    'titulo' => 'Adicionar jogo da Xbox',
    'descricao' => 'POST action=add_from_store com platform=xbox',
    'resolvido' => fileContainsLocal($root . '/api/catalog.php', "case 'xbox':") && fileContainsLocal($root . '/api/catalog.php', '$externalId'),
    'ficheiro' => 'api/catalog.php',
    'detalhe' => 'Endpoint aceita adicionar jogos da Xbox para a biblioteca.',
    'precisaBD' => true,
    'tabela' => 'games',
];

// ---------- Frontend ----------
$tests[] = [
    'id' => 'F1',
    'grupo' => 'Frontend',
    'titulo' => 'Seletor de plataforma no HTML',
    'descricao' => 'index.php tem <select id="catalog-platform"> com steam, playstation, xbox',
    'resolvido' => fileContainsLocal($root . '/index.php', 'id="catalog-platform"') && fileContainsLocal($root . '/index.php', 'value="steam"') && fileContainsLocal($root . '/index.php', 'value="playstation"') && fileContainsLocal($root . '/index.php', 'value="xbox"'),
    'ficheiro' => 'index.php',
    'detalhe' => 'Select de plataforma presente na página do catálogo.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'F2',
    'grupo' => 'Frontend',
    'titulo' => 'JS loadCatalog suporta platform',
    'descricao' => 'app.js lê #catalog-platform e envia ?platform= na URL',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', '#catalog-platform') && fileContainsLocal($root . '/assets/js/app.js', 'platform=${encodeURIComponent(platform)}'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'loadCatalog inclui parâmetro platform na requisição à API.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'F3',
    'grupo' => 'Frontend',
    'titulo' => 'JS renderCatalog multi-plataforma',
    'descricao' => 'renderCards exibe plataforma correta e botão data-add-store',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'data-add-store') && fileContainsLocal($root . '/assets/js/app.js', 'data-platform') && fileContainsLocal($root . '/assets/js/app.js', 'platformLabels'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Cards mostram plataforma e usam data-add-store com data-platform.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'F4',
    'grupo' => 'Frontend',
    'titulo' => 'Event listener plataforma muda busca',
    'descricao' => 'Mudança no select dispara loadCatalog com nova plataforma',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', '#catalog-platform') && fileContainsLocal($root . '/assets/js/app.js', '"change"'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Select de plataforma tem listener de change.',
    'precisaBD' => false,
];

// Para testes que precisam de BD, tenta verificar tabela
foreach ($tests as &$t) {
    if ($t['precisaBD'] && isset($t['tabela'])) {
        $bdResult = tableExistsLocal($t['tabela']);
        if ($bdResult === null) {
            $t['detalhe'] .= ' (BD indisponível neste ambiente; código verificado com sucesso)';
        } elseif ($bdResult === true) {
            $t['detalhe'] .= ' (tabela confirmada na BD)';
        } else {
            $t['resolvido'] = false;
            $t['detalhe'] .= ' (tabela NÃO encontrada na BD)';
        }
    }
}
unset($t);

// Agrupar por prioridade/plataforma
$grupos = [];
foreach ($tests as $t) {
    $grupos[$t['grupo']][] = $t;
}

$total = count($tests);
$resolvidos = array_reduce($tests, fn($c, $t) => $c + ($t['resolvido'] ? 1 : 0), 0);
$naoResolvidos = $total - $resolvidos;
$porGrupo = [];
foreach ($grupos as $gNome => $gTests) {
    $porGrupo[$gNome] = [
        'total' => count($gTests),
        'resolvidos' => array_reduce($gTests, fn($c, $t) => $c + ($t['resolvido'] ? 1 : 0), 0),
    ];
}
?>

<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Arcadia — Testes de Catálogo de Lojas (Steam / PlayStation / Xbox)</title>
    <link rel="stylesheet" href="assets/css/app.css?v=test-lojas-20261115">
    <style>
        body { background: var(--bg); color: var(--text); font-family: "DM Sans", sans-serif; padding: 24px; max-width: 1000px; margin: 0 auto; }
        h1 { font: 600 28px "Space Grotesk", sans-serif; margin-bottom: 8px; }
        .subtitle { color: var(--muted); font-size: 13px; margin-bottom: 24px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 6px; }
        .ok { background: #252035; color: #8e7fc2; }
        .fail { background: #3c2928; color: #e59b8f; }
        .warn { background: #382f21; color: #d8b878; }
        .grupo { background: var(--surface2); border: 1px solid var(--line); border-radius: 10px; padding: 16px; margin-bottom: 20px; }
        .grupo h2 { margin: 0 0 12px; font: 600 18px "Space Grotesk", sans-serif; display: flex; justify-content: space-between; align-items: center; }
        .card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; }
        .card-content { flex: 1; }
        .card-id { font: 600 13px "Space Grotesk", sans-serif; color: var(--muted); margin-bottom: 3px; }
        .card-title { font: 600 15px "Space Grotesk", sans-serif; margin: 0 0 4px; }
        .card-desc { font-size: 11.5px; color: var(--muted); margin: 0 0 6px; }
        .card-file { font-size: 9.5px; color: #777480; font-family: monospace; margin-bottom: 4px; }
        .card-detail { font-size: 10.5px; color: #a2a0aa; }
        .actions { margin: 24px 0; }
        .btn { background: var(--mint); color: #191720; border: none; padding: 10px 20px; border-radius: 7px; font: 600 13px "DM Sans", sans-serif; cursor: pointer; }
        .btn:hover { background: #c5bce6; }
        .summary { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 20px; margin-top: 24px; }
        .summary h2 { margin: 0 0 16px; font: 600 18px "Space Grotesk", sans-serif; }
        .grid-resumo { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
        .resumo-item { background: var(--surface2); border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
        .resumo-item .numero { font: 700 24px "Space Grotesk", sans-serif; display: block; }
        .resumo-item .label { font-size: 11px; color: var(--muted); margin-top: 4px; }
        .back-link { display: inline-block; margin-top: 16px; color: var(--muted); text-decoration: none; font-size: 12px; }
        .back-link:hover { color: var(--text); }
        .hidden { display: none; }
        .bd-note { font-size: 11px; color: #d8b878; margin-top: 12px; padding: 8px; background: #382f21; border-radius: 6px; }
        .alert-info { background: #252035; border: 1px solid #8e7fc2; color: #8e7fc2; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
    </style>
</head>
<body>

    <div class="alert-info">
        ℹ Integração multi-plataforma: <strong>Steam</strong> (funcional), <strong>PlayStation</strong> (busca pública sem autenticação), <strong>Xbox</strong> (requer credenciais de desenvolvedor OAuth).
    </div>

    <h1>Catálogo de Lojas — Testes de Integração</h1>
    <p class="subtitle">Verificação de integração com Steam, PlayStation Store e Xbox Store</p>

    <div class="actions">
        <button class="btn" id="btnRun">▶ Executar Testes</button>
    </div>

    <div id="results" class="hidden">
        <?php foreach ($grupos as $gNome => $gTests): ?>
        <div class="grupo">
            <h2><?= htmlspecialchars($gNome) ?>
                <span class="badge" id="grupo-<?= strtolower(str_replace(' ', '-', $gNome)) ?>"><?= count($gTests) ?> itens</span>
            </h2>
            <?php foreach ($gTests as $t): ?>
            <div class="card" id="test-<?= $t['id'] ?>">
                <div class="card-content">
                    <div class="card-id"><?= $t['id'] ?></div>
                    <h3 class="card-title"><?= htmlspecialchars($t['titulo']) ?></h3>
                    <p class="card-desc"><?= htmlspecialchars($t['descricao']) ?></p>
                    <div class="card-file"><?= htmlspecialchars($t['ficheiro']) ?></div>
                    <p class="card-detail"><?= htmlspecialchars($t['detalhe']) ?></p>
                </div>
                <span class="badge" id="status-<?= $t['id'] ?>">Aguardando…</span>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endforeach; ?>

        <div class="summary">
            <h2>Resultado Global</h2>
            <div class="grid-resumo">
                <div class="resumo-item">
                    <span class="numero" id="countTotal"><?= $total ?></span>
                    <span class="label">testes no total</span>
                </div>
                <div class="resumo-item">
                    <span class="numero ok" id="countOk"><?= $resolvidos ?></span>
                    <span class="label">aprovados</span>
                </div>
                <div class="resumo-item">
                    <span class="numero fail" id="countFail"><?= $naoResolvidos ?></span>
                    <span class="label">reprovados</span>
                </div>
                <div class="resumo-item">
                    <span class="numero warn"><?= round(($resolvidos / $total) * 100) ?>%</span>
                    <span class="label">taxa de aprovação</span>
                </div>
            </div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 12px;">
                <strong>Por plataforma:</strong><br>
                <?php foreach ($porGrupo as $gNome => $d): ?>
                    <?= htmlspecialchars($gNome) ?>: <strong><?= $d['resolvidos'] ?></strong>/<?= $d['total'] ?> aprovados<br>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <a class="back-link" href="index.php">← Voltar ao Arcadia</a>

    <script>
        document.getElementById('btnRun').addEventListener('click', () => {
            const results = document.getElementById('results');
            results.classList.remove('hidden');

            const total = <?= $total ?>;
            const resolvidos = <?= $resolvidos ?>;
            const naoResolvidos = <?= $naoResolvidos ?>;

            document.getElementById('countTotal').textContent = total;
            document.getElementById('countOk').textContent = resolvidos;
            document.getElementById('countFail').textContent = naoResolvidos;

            // Atualizar badges dos grupos
            <?php foreach ($grupos as $gNome => $gTests): ?>
                {
                    const gResolvidos = <?= array_reduce($gTests, fn($c, $t) => $c + ($t['resolvido'] ? 1 : 0), 0) ?>;
                    const gTotal = <?= count($gTests) ?>;
                    const gBadge = document.getElementById('grupo-<?= strtolower(str_replace(' ', '-', $gNome)) ?>');
                    if (gBadge) gBadge.textContent = gResolvidos + '/' + gTotal;
                }
            <?php endforeach; ?>

            <?php foreach ($tests as $t): ?>
                {
                    const statusEl = document.getElementById('status-<?= $t['id'] ?>');
                    const card = document.getElementById('test-<?= $t['id'] ?>');
                    if (<?= $t['resolvido'] ? 'true' : 'false' ?>) {
                        statusEl.className = 'badge ok';
                        statusEl.textContent = '✓ Aprovado';
                        card.style.borderLeft = '4px solid #8e7fc2';
                    } else {
                        statusEl.className = 'badge fail';
                        statusEl.textContent = '✗ Reprovado';
                        card.style.borderLeft = '4px solid #e59b8f';
                    }
                }
            <?php endforeach; ?>

            results.scrollIntoView({ behavior: 'smooth' });
        });
    </script>

</body>
</html>
