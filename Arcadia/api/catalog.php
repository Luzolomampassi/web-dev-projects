<?php
declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';
require dirname(__DIR__) . '/includes/steam.php';
require dirname(__DIR__) . '/includes/playstation.php';
require dirname(__DIR__) . '/includes/xbox.php';

try {
    $pdo = db();
    $user = require_login();
    $uid = (int)$user['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    $platform = strtolower((string)($_GET['platform'] ?? $_POST['platform'] ?? 'steam'));
    $allowedPlatforms = ['steam', 'playstation', 'xbox'];

    if ($method === 'GET') {
        $search = trim((string)($_GET['search'] ?? ''));
        $featured = filter_var($_GET['featured'] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $appid = filter_var($_GET['appid'] ?? null, FILTER_VALIDATE_INT);

        if (!in_array($platform, $allowedPlatforms, true)) {
            json_response(['error' => "Plataforma '$platform' não suportada. Use: steam, playstation ou xbox."], 422);
        }

        // ==================== BUSCA ====================
        if ($search !== '') {
            if (mb_strlen($search) < 2) {
                json_response(['results' => [], 'platform' => $platform]);
            }

            switch ($platform) {
                case 'steam':
                    $items = steam_search_store($search);
                    $results = array_map(function ($item) {
                        return [
                            'platform' => 'steam',
                            'appid' => (int)($item['id'] ?? 0),
                            'name' => $item['name'] ?? 'Sem título',
                            'type' => $item['type'] ?? '',
                            'image' => $item['tiny_image'] ?? null,
                            'source' => 'Steam Store',
                        ];
                    }, $items);
                    break;

                case 'playstation':
                    $results = ps_search_store($search);
                    break;

                case 'xbox':
                    $results = xbox_search_store($search);
                    break;

                default:
                    $results = [];
            }

            json_response(['results' => $results, 'query' => $search, 'platform' => $platform]);
        }

        // ==================== DESTAQUE ====================
        if ($featured === true) {
            switch ($platform) {
                case 'steam':
                    $result = steam_sync_featured();
                    $q = $pdo->prepare('SELECT * FROM catalog_apps WHERE featured_rank IS NOT NULL ORDER BY featured_rank ASC LIMIT 50');
                    $q->execute();
                    $catalog = $q->fetchAll();
                    json_response([
                        'ok' => $result['ok'],
                        'saved' => $result['saved'] ?? 0,
                        'catalog' => $catalog,
                        'platform' => 'steam',
                    ]);

                case 'playstation':
                    $featuredPs = ps_get_featured();
                    json_response([
                        'ok' => $featuredPs['ok'],
                        'catalog' => $featuredPs['catalog'] ?? [],
                        'platform' => 'playstation',
                        'note' => 'PlayStation Store não tem API pública oficial de destaques sem autenticação.',
                    ]);

                case 'xbox':
                    $featuredXbox = xbox_get_featured();
                    json_response([
                        'ok' => $featuredXbox['ok'],
                        'catalog' => $featuredXbox['catalog'] ?? [],
                        'platform' => 'xbox',
                        'note' => 'Xbox API requer credenciais de desenvolvedor (Client ID/Secret).',
                    ]);
            }
        }

        // ==================== DETALHES ====================
        if ($appid) {
            switch ($platform) {
                case 'steam':
                    $details = steam_fetch_app_details($appid);
                    if (!$details) {
                        json_response(['error' => 'Não foi possível obter detalhes deste jogo na Steam.'], 404);
                    }
                    json_response(['app' => $details, 'platform' => 'steam']);

                case 'playstation':
                    $details = ps_get_app_details($appid);
                    if (!$details) {
                        json_response(['error' => 'Não foi possível obter detalhes deste jogo na PlayStation Store.'], 404);
                    }
                    json_response(['app' => $details, 'platform' => 'playstation']);

                case 'xbox':
                    $details = xbox_get_app_details($appid);
                    if (!$details) {
                        json_response(['error' => 'Não foi possível obter detalhes deste jogo na Xbox Store.'], 404);
                    }
                    json_response(['app' => $details, 'platform' => 'xbox']);
            }
        }

        json_response(['error' => 'Parâmetros inválidos. Use ?platform=steam|playstation|xbox&search= ou ?featured=1 ou ?appid='], 422);
    }

    if ($method !== 'POST') {
        json_response(['error' => 'Método não suportado.'], 405);
    }

    require_csrf();
    $action = (string)($_POST['action'] ?? '');

    if ($action === 'add_from_store') {
        $platformPost = strtolower((string)($_POST['platform'] ?? 'steam'));
        if (!in_array($platformPost, $allowedPlatforms, true)) {
            json_response(['error' => "Plataforma '$platformPost' não suportada."], 422);
        }

        $externalId = filter_var($_POST['external_id'] ?? null, FILTER_VALIDATE_INT);
        $title = clean_text($_POST['title'] ?? '', 160);
        if (!$externalId || $externalId < 1) {
            json_response(['error' => 'ID externo inválido.'], 422);
        }
        if ($title === '') {
            json_response(['error' => 'O título é obrigatório.'], 422);
        }

        // Verificar se já existe este jogo para este utilizador nesta plataforma
        $q = $pdo->prepare('SELECT id FROM games WHERE user_id=? AND steam_app_id=?');
        $q->execute([$uid, $externalId]);
        if ($q->fetchColumn()) {
            json_response(['error' => 'Este jogo já está na tua biblioteca.'], 409);
        }

        $platformName = ucfirst($platformPost);
        $genre = clean_text($_POST['genre'] ?? '', 80);
        $status = (string)($_POST['status'] ?? 'backlog');
        $allowed = ['backlog', 'playing', 'completed', 'paused', 'abandoned'];
        if (!in_array($status, $allowed, true)) {
            json_response(['error' => 'Estado inválido.'], 422);
        }
        $hours = (float)($_POST['hours'] ?? 0);
        $rating = (float)($_POST['rating'] ?? 0);
        $release = trim((string)($_POST['release_date'] ?? '')) ?: null;
        $description = clean_text($_POST['description'] ?? '', 2000);
        $notes = clean_text($_POST['notes'] ?? '', 3000);
        $favorite = isset($_POST['favorite']) ? 1 : 0;
        $is_wishlist = isset($_POST['is_wishlist']) ? 1 : 0;

        $pdo->prepare('INSERT INTO games (title,platform,genre,status,hours,rating,release_date,description,notes,favorite,is_wishlist,cover_path,steam_app_id,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
            ->execute([$title, $platformName, $genre, $status, $hours, $rating, $release, $description, $notes, $favorite, $is_wishlist, null, $externalId, $uid]);
        $gameId = (int)$pdo->lastInsertId();

        // Sincronizar coleções selecionadas
        $colecoes = $_POST['collections'] ?? [];
        if (!is_array($colecoes)) $colecoes = [$colecoes];
        $colecoes = array_filter(array_map(fn($c) => filter_var($c, FILTER_VALIDATE_INT), $colecoes));
        if ($colecoes) {
            $ins = $pdo->prepare('INSERT INTO game_collections (collection_id, game_id) SELECT c.id, ? FROM collections c WHERE c.id=? AND c.user_id=?');
            foreach ($colecoes as $cid) {
                $ins->execute([$gameId, $cid, $uid]);
            }
        }

        $stmt = $pdo->prepare('SELECT * FROM games WHERE id=?');
        $stmt->execute([$gameId]);
        json_response([
            'ok' => true,
            'game' => game_payload($stmt->fetch()),
            'message' => "Jogo adicionado da {$platformName}.",
        ]);
    }

    json_response(['error' => 'Ação desconhecida.'], 422);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível aceder à base de dados.'], 503);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error' => 'Não foi possível concluir a operação.'], 500);
}
