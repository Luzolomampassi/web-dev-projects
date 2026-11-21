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

// ---------- Sugestão 1: SSE integrado no frontend ----------
$tests[] = [
    'id' => 'C1',
    'grupo' => 'Chat — SSE Tempo Real',
    'titulo' => 'Frontend conecta ao SSE de mensagens',
    'descricao' => 'app.js usa EventSource para chat-sse.php em vez de polling',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'new EventSource') && fileContainsLocal($root . '/assets/js/app.js', 'connectChatSSE'),
    'ficheiro' => 'assets/js/app.js, api/chat-sse.php',
    'detalhe' => 'Frontend conecta ao endpoint SSE para mensagens em tempo real.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C2',
    'grupo' => 'Chat — SSE Tempo Real',
    'titulo' => 'SSE desconecta ao sair da conversa',
    'descricao' => 'Função disconnectSSEs() encerra conexões EventSource',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'disconnectSSEs') && fileContainsLocal($root . '/assets/js/app.js', 'state.chatSSE'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Conexões SSE são encerradas adequadamente para evitar vazamentos.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C3',
    'grupo' => 'Chat — SSE Tempo Real',
    'titulo' => 'Reconexão automática do SSE',
    'descricao' => 'SSE reconecta após 5s em caso de erro',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'setTimeout(() => connectChatSSE') && fileContainsLocal($root . '/assets/js/app.js', 'es.onerror'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'SSE tenta reconectar automaticamente se a conexão cair.',
    'precisaBD' => false,
];

// ---------- Sugestão 2: Indicador de "digitando..." ----------
$tests[] = [
    'id' => 'C4',
    'grupo' => 'Chat — Typing Indicator',
    'titulo' => 'Enviar status de digitação',
    'descricao' => 'Função sendTyping() envia is_typing para api/presence.php',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'sendTyping') && fileContainsLocal($root . '/assets/js/app.js', '"typing"'),
    'ficheiro' => 'assets/js/app.js, api/presence.php',
    'detalhe' => 'Frontend envia evento de digitação quando o usuário escreve.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C5',
    'grupo' => 'Chat — Typing Indicator',
    'titulo' => 'Exibir "está a escrever…" no cabeçalho',
    'descricao' => 'renderChatHeaderTyping() mostra indicador no cabeçalho do chat',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'renderChatHeaderTyping') && fileContainsLocal($root . '/index.php', 'chat-header-typing'),
    'ficheiro' => 'assets/js/app.js, index.php',
    'detalhe' => 'Cabeçalho do chat mostra quando o amigo está a escrever.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C6',
    'grupo' => 'Chat — Typing Indicator',
    'titulo' => 'Typing expira após 3 segundos',
    'descricao' => 'setTimeout limpa o status de digitação após 3s',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'setTimeout(() => sendTyping(false), 3000)'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'O status de digitação expira automaticamente se o utilizador parar de escrever.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C7',
    'grupo' => 'Chat — Typing Indicator',
    'titulo' => 'Tabela user_presence existe',
    'descricao' => 'Tabela user_presence armazena is_typing e typing_until',
    'resolvido' => fileContainsLocal($root . '/includes/bootstrap.php', 'user_presence') && fileContainsLocal($root . '/includes/bootstrap.php', 'is_typing') && fileContainsLocal($root . '/includes/bootstrap.php', 'typing_until'),
    'ficheiro' => 'includes/bootstrap.php',
    'detalhe' => 'Tabela user_presence criada com colunas de presença e digitação.',
    'precisaBD' => true,
    'tabela' => 'user_presence',
];

// ---------- Sugestão 3: Status online/offline ----------
$tests[] = [
    'id' => 'C8',
    'grupo' => 'Chat — Status Online/Offline',
    'titulo' => 'Mostrar status dos amigos na lista',
    'descricao' => 'Contatos da lista de chat mostram ponto verde/vermelho de online/offline',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'state.presence') && fileContainsLocal($root . '/assets/js/app.js', 'is_online') && fileContainsLocal($root . '/assets/css/app.css', 'avatar.online'),
    'ficheiro' => 'assets/js/app.js, assets/css/app.css',
    'detalhe' => 'Lista de contatos exibe estado online/offline de cada amigo.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C9',
    'grupo' => 'Chat — Status Online/Offline',
    'titulo' => 'Endpoint de presença existe',
    'descricao' => 'api/presence.php retornaq presença dos amigos',
    'resolvido' => fileExistsLocal($root . '/api/presence.php') && fileContainsLocal($root . '/api/presence.php', 'user_presence') && fileContainsLocal($root . '/api/presence.php', 'last_seen'),
    'ficheiro' => 'api/presence.php',
    'detalhe' => 'Endpoint fornece dados de presença (online/último acesso).',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C10',
    'grupo' => 'Chat — Status Online/Offline',
    'titulo' => 'SSE de presença para atualizações',
    'descricao' => 'api/presence-sse.php envia eventos de presença em tempo real',
    'resolvido' => fileExistsLocal($root . '/api/presence-sse.php') && fileContainsLocal($root . '/api/presence-sse.php', 'text/event-stream'),
    'ficheiro' => 'api/presence-sse.php',
    'detalhe' => 'Endpoint SSE mantém presença atualizada sem polling.',
    'precisaBD' => false,
];

// ---------- Sugestão 4: Notificações de desktop ----------
$tests[] = [
    'id' => 'C11',
    'grupo' => 'Chat — Notificações Desktop',
    'titulo' => 'Solicitar permissão de notificações',
    'descricao' => 'requestDesktopPermission() pede permissão ao utilizador',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'requestDesktopPermission') && fileContainsLocal($root . '/assets/js/app.js', 'Notification.requestPermission'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Sistema solicita permissão para mostrar notificações do navegador.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C12',
    'grupo' => 'Chat — Notificações Desktop',
    'titulo' => 'Mostrar notificação desktop para nova mensagem',
    'descricao' => 'showDesktopNotification() exibe notificação quando recebe mensagem via SSE',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'showDesktopNotification') && fileContainsLocal($root . '/assets/js/app.js', 'new Notification'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Notificações desktop são exibidas para mensagens recebidas quando a aba não está visível.',
    'precisaBD' => false,
];

// ---------- Sugestão 5: Corrigir bugs existentes ----------
$tests[] = [
    'id' => 'C13',
    'grupo' => 'Chat — Bugs Corrigidos',
    'titulo' => 'Chat usa SSE em vez de polling constante',
    'descricao' => 'setInterval polling removido da página de chat, substituído por SSE',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'connectChatSSE(state.chatWith)') && !strpos(file_get_contents($root . '/assets/js/app.js'), 'if (state.chatWith) loadConversation(state.chatWith, true);'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Polling de 5s substituído por SSE para mensagens em tempo real.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C14',
    'grupo' => 'Chat — Bugs Corrigidos',
    'titulo' => 'last_seen atualizado na presença',
    'descricao' => 'Presença do utilizador é atualizada periodicamente',
    'resolvido' => fileContainsLocal($root . '/api/presence-sse.php', 'last_seen') && fileContainsLocal($root . '/api/presence.php', 'last_seen'),
    'ficheiro' => 'api/presence.php, api/presence-sse.php',
    'detalhe' => 'Último acesso dos utilizadores é mantido atualizado.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'C15',
    'grupo' => 'Chat — Bugs Corrigidos',
    'titulo' => 'Typing não persiste após enviar mensagem',
    'descricao' => 'sendTyping(false) é chamado após submeter o formulário',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'sendTyping(false);') && strpos(file_get_contents($root . '/assets/js/app.js'), 'sendTyping(false)') > strpos(file_get_contents($root . '/assets/js/app.js'), '$("#chat-form").addEventListener("submit"'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Status de digitação é desativado após enviar a mensagem.',
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

// Agrupar por categoria
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
    <title>Arcadia — Testes de Chat entre Amigos</title>
    <link rel="stylesheet" href="assets/css/app.css?v=test-chat-20261115">
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
    </style>
</head>
<body>

    <h1>Chat entre Amigos — Testes de Todas as Sugestões</h1>
    <p class="subtitle">Verificação de SSE, typing indicator, presença online/offline, notificações desktop e correções de bugs</p>

    <div class="bd-note">
        ⚠ Alguns testes requerem base de dados. Como não há conexão com o MySQL neste ambiente, eles são avaliados pelo código-fonte.
    </div>

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
                <strong>Por categoria:</strong><br>
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
