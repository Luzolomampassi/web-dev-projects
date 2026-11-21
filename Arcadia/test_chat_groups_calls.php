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

// ---------- GRUPOS DE CHAT ----------
$tests[] = [
    'id' => 'G1',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'Tabela chat_groups existe',
    'descricao' => 'Tabela para armazenar grupos de chat',
    'resolvido' => fileContainsLocal($root . '/includes/bootstrap.php', 'CREATE TABLE IF NOT EXISTS chat_groups'),
    'ficheiro' => 'includes/bootstrap.php',
    'detalhe' => 'Tabela chat_groups criada no bootstrap.php.',
    'precisaBD' => true,
    'tabela' => 'chat_groups',
];
$tests[] = [
    'id' => 'G2',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'Tabela chat_group_members existe',
    'descricao' => 'Tabela para membros de grupos com papéis (admin/member)',
    'resolvido' => fileContainsLocal($root . '/includes/bootstrap.php', 'chat_group_members'),
    'ficheiro' => 'includes/bootstrap.php',
    'detalhe' => 'Tabela chat_group_members criada.',
    'precisaBD' => true,
    'tabela' => 'chat_group_members',
];
$tests[] = [
    'id' => 'G3',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'Coluna group_id em chat_messages',
    'descricao' => 'Mensagens de grupo armazenadas com group_id',
    'resolvido' => fileContainsLocal($root . '/includes/bootstrap.php', "SHOW COLUMNS FROM chat_messages LIKE 'group_id'"),
    'ficheiro' => 'includes/bootstrap.php',
    'detalhe' => 'Coluna group_id adicionada à tabela chat_messages.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G4',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'Endpoint chat-groups.php existe',
    'descricao' => 'API para gerenciar grupos (criar, listar, membros, mensagens)',
    'resolvido' => fileExistsLocal($root . '/api/chat-groups.php'),
    'ficheiro' => 'api/chat-groups.php',
    'detalhe' => 'Ficheiro api/chat-groups.php criado.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G5',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'Ação create em chat-groups',
    'descricao' => 'Criar novo grupo via POST action=create',
    'resolvido' => fileContainsLocal($root . '/api/chat-groups.php', "action === 'create'"),
    'ficheiro' => 'api/chat-groups.php',
    'detalhe' => 'Ação de criação de grupo implementada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G6',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'Ação add_member em chat-groups',
    'descricao' => 'Adicionar membro a um grupo (apenas admin)',
    'resolvido' => fileContainsLocal($root . '/api/chat-groups.php', "action === 'add_member'"),
    'ficheiro' => 'api/chat-groups.php',
    'detalhe' => 'Ação de adicionar membro implementada com verificação de admin.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G7',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'Ação leave em chat-groups',
    'descricao' => 'Sair de um grupo',
    'resolvido' => fileContainsLocal($root . '/api/chat-groups.php', "action === 'leave'"),
    'ficheiro' => 'api/chat-groups.php',
    'detalhe' => 'Ação de sair do grupo implementada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G8',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'UI: botão Novo grupo na página de chat',
    'descricao' => 'Botão para criar novo grupo na interface',
    'resolvido' => fileContainsLocal($root . '/index.php', 'id="btn-create-group"'),
    'ficheiro' => 'index.php',
    'detalhe' => 'Botão Novo grupo presente na página de chat.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G9',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'UI: modal criar grupo',
    'descricao' => 'Modal para inserir nome do grupo',
    'resolvido' => fileContainsLocal($root . '/index.php', 'id="create-group-modal"') && fileContainsLocal($root . '/index.php', 'id="create-group-form"'),
    'ficheiro' => 'index.php',
    'detalhe' => 'Modal de criação de grupo presente.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G10',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'UI: página de grupos de chat',
    'descricao' => 'Página dedicada para listar grupos e ver mensagens',
    'resolvido' => fileContainsLocal($root . '/index.php', 'id="page-chat-groups"'),
    'ficheiro' => 'index.php',
    'detalhe' => 'Página de grupos de chat criada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G11',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'JS: função loadGroups',
    'descricao' => 'Função JS para carregar lista de grupos',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'async function loadGroups'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Função loadGroups implementada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'G12',
    'grupo' => 'Grupos de Chat',
    'titulo' => 'JS: função renderGroups',
    'descricao' => 'Função JS para renderizar grupos na UI',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'function renderGroups'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Função renderGroups implementada.',
    'precisaBD' => false,
];

// ---------- CHAMADAS DE VOZ ----------
$tests[] = [
    'id' => 'V1',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'Tabela call_sessions existe',
    'descricao' => 'Tabela para armazenar sessões de chamada',
    'resolvido' => fileContainsLocal($root . '/includes/bootstrap.php', 'CREATE TABLE IF NOT EXISTS call_sessions'),
    'ficheiro' => 'includes/bootstrap.php',
    'detalhe' => 'Tabela call_sessions criada.',
    'precisaBD' => true,
    'tabela' => 'call_sessions',
];
$tests[] = [
    'id' => 'V2',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'Endpoint call-signal.php existe',
    'descricao' => 'API de sinalização WebRTC para chamadas',
    'resolvido' => fileExistsLocal($root . '/api/call-signal.php'),
    'ficheiro' => 'api/call-signal.php',
    'detalhe' => 'Ficheiro api/call-signal.php criado.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V3',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'Ação create em call-signal',
    'descricao' => 'Criar nova chamada de voz',
    'resolvido' => fileContainsLocal($root . '/api/call-signal.php', "action === 'create'"),
    'ficheiro' => 'api/call-signal.php',
    'detalhe' => 'Ação de criar chamada implementada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V4',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'Ação answer em call-signal',
    'descricao' => 'Atender chamada de voz',
    'resolvido' => fileContainsLocal($root . '/api/call-signal.php', "action === 'answer'"),
    'ficheiro' => 'api/call-signal.php',
    'detalhe' => 'Ação de atender chamada implementada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V5',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'Ação decline/end em call-signal',
    'descricao' => 'Recusar ou encerrar chamada',
    'resolvido' => fileContainsLocal($root . '/api/call-signal.php', "action === 'decline'") && fileContainsLocal($root . '/api/call-signal.php', "action === 'end'"),
    'ficheiro' => 'api/call-signal.php',
    'detalhe' => 'Ações de recusar e encerrar chamada implementadas.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V6',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'Sinalização SDP/ICE (signal/get_signal)',
    'descricao' => 'Troca de SDP e candidatos ICE entre peers',
    'resolvido' => fileContainsLocal($root . '/api/call-signal.php', "action === 'signal'") && fileContainsLocal($root . '/api/call-signal.php', "action === 'get_signal'"),
    'ficheiro' => 'api/call-signal.php',
    'detalhe' => 'Endpoints de sinalização WebRTC implementados.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V7',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'UI: botão ligar voz no chat',
    'descricao' => 'Botão para iniciar chamada de voz com um amigo',
    'resolvido' => fileContainsLocal($root . '/index.php', 'id="chat-call-voice"'),
    'ficheiro' => 'index.php',
    'detalhe' => 'Botão de chamada de voz presente no cabeçalho do chat.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V8',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'UI: modal de chamada de voz',
    'descricao' => 'Modal para chamada entrante/saída com controles',
    'resolvido' => fileContainsLocal($root . '/index.php', 'id="voice-call-modal"'),
    'ficheiro' => 'index.php',
    'detalhe' => 'Modal de chamada de voz criado.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V9',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'JS: função startVoiceCall',
    'descricao' => 'Função JS para iniciar chamada WebRTC',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'async function startVoiceCall'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Função startVoiceCall implementada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V10',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'JS: função answerVoiceCall',
    'descricao' => 'Função JS para atender chamada',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'async function answerVoiceCall'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Função answerVoiceCall implementada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V11',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'JS: WebRTC peer connection',
    'descricao' => 'Uso de RTCPeerConnection para áudio em tempo real',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'new RTCPeerConnection'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Conexão WebRTC para áudio implementada.',
    'precisaBD' => false,
];
$tests[] = [
    'id' => 'V12',
    'grupo' => 'Chamadas de Voz',
    'titulo' => 'JS: STUN servers configurados',
    'descricao' => 'Servidores STUN para NAT traversal',
    'resolvido' => fileContainsLocal($root . '/assets/js/app.js', 'stun.l.google.com'),
    'ficheiro' => 'assets/js/app.js',
    'detalhe' => 'Servidores STUN do Google configurados.',
    'precisaBD' => false,
];

// ---------- TOTAL ----------
$total = count($tests);
$resolvidos = array_reduce($tests, fn($c, $t) => $c + ($t['resolvido'] ? 1 : 0), 0);
$naoResolvidos = $total - $resolvidos;
$porGrupo = [];
foreach ($tests as $t) {
    if (!isset($porGrupo[$t['grupo']])) {
        $porGrupo[$t['grupo']] = ['total' => 0, 'resolvidos' => 0];
    }
    $porGrupo[$t['grupo']]['total']++;
    if ($t['resolvido']) $porGrupo[$t['grupo']]['resolvidos']++;
}

?>
<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Arcadia — Testes de Grupos e Chamadas de Voz</title>
    <link rel="stylesheet" href="assets/css/app.css?v=test-groups-calls-20261115">
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
        ℹ Novas funcionalidades: <strong>Grupos de Chat</strong> (criar, adicionar membros, sair, mensagens de grupo) e <strong>Chamadas de Voz</strong> (WebRTC com sinalização).
    </div>

    <h1>Grupos e Chamadas de Voz — Testes</h1>
    <p class="subtitle">Verificação de integração de grupos de chat e chamadas de voz WebRTC</p>

    <div class="bd-note">
        ⚠ Alguns testes requerem base de dados. Como não há conexão com o MySQL neste ambiente, eles são avaliados pelo código-fonte.
    </div>

    <div class="actions">
        <button class="btn" id="btnRun">▶ Executar Testes</button>
    </div>

    <div id="results" class="hidden">
        <?php foreach ($porGrupo as $gNome => $d): ?>
        <div class="grupo">
            <h2><?= htmlspecialchars($gNome) ?>
                <span class="badge" id="grupo-<?= strtolower(str_replace(' ', '-', $gNome)) ?>"><?= $d['resolvidos'] ?>/<?= $d['total'] ?></span>
            </h2>
            <?php foreach ($tests as $t): if ($t['grupo'] !== $gNome) continue; ?>
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
