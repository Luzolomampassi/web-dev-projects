<?php
declare(strict_types=1);

require_once __DIR__ . '/http.php';

function steam_api_key(): string
{
    $cfg = app_config();
    return trim((string)($cfg['steam']['web_api_key'] ?? getenv('STEAM_WEB_API_KEY') ?: ''));
}

function steam_sync_job(string $job, ?string $cursor = null, ?string $error = null, bool $success = false, ?array $meta = null): void
{
    $pdo = db();
    $pdo->prepare('INSERT INTO sync_state (job,last_run,last_success,cursor_value,meta,last_error) VALUES (?,NOW(),IF(?,NOW(),NULL),?,?,?)
        ON DUPLICATE KEY UPDATE last_run=NOW(), last_success=IF(?,NOW(),last_success), cursor_value=VALUES(cursor_value), meta=VALUES(meta), last_error=VALUES(last_error)')
        ->execute([$job, $success ? 1 : 0, $cursor, $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null, $error, $success ? 1 : 0]);
}

function catalog_upsert_stub(array $item, array $ranks = []): void
{
    $appid = (int)($item['id'] ?? $item['appid'] ?? 0);
    if ($appid <= 0) {
        return;
    }
    $name = mb_substr(trim((string)($item['name'] ?? 'Sem título')), 0, 255);
    $header = mb_substr((string)($item['header_image'] ?? $item['tiny_image'] ?? ''), 0, 500) ?: null;
    $capsule = mb_substr((string)($item['large_capsule_image'] ?? $item['small_capsule_image'] ?? $header ?? ''), 0, 500) ?: null;
    $win = !empty($item['windows_available'] ?? $item['platforms']['windows'] ?? true) ? 1 : 0;
    $mac = !empty($item['mac_available'] ?? $item['platforms']['mac'] ?? false) ? 1 : 0;
    $lin = !empty($item['linux_available'] ?? $item['platforms']['linux'] ?? false) ? 1 : 0;
    $price = isset($item['final_price']) ? (int)$item['final_price'] : (isset($item['price']['final']) ? (int)$item['price']['final'] : null);
    $initial = isset($item['original_price']) ? (int)$item['original_price'] : (isset($item['price']['initial']) ? (int)$item['price']['initial'] : $price);
    $discount = (int)($item['discount_percent'] ?? 0);
    $currency = $item['currency'] ?? $item['price']['currency'] ?? 'EUR';
    $isFree = ($price === 0 || $price === null && empty($item['price'])) ? 1 : 0;
    if ($price === null && isset($item['price'])) {
        $isFree = 0;
    }
    $meta = isset($item['metascore']) && is_numeric($item['metascore']) ? (int)$item['metascore'] : null;
    $featured = $ranks['featured'] ?? null;
    $newRel = $ranks['new'] ?? null;
    $soon = $ranks['soon'] ?? null;
    $coming = isset($ranks['coming']) ? (int)$ranks['coming'] : 0;

    $pdo = db();
    $pdo->prepare('INSERT INTO catalog_apps
        (appid,name,header_image,capsule_image,platforms_windows,platforms_mac,platforms_linux,price_cents,price_initial_cents,discount_percent,currency,is_free,metacritic_score,featured_rank,new_release_rank,coming_soon_rank,coming_soon)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
            name=IF(VALUES(name)="",name,VALUES(name)),
            header_image=COALESCE(VALUES(header_image),header_image),
            capsule_image=COALESCE(VALUES(capsule_image),capsule_image),
            platforms_windows=VALUES(platforms_windows),
            platforms_mac=VALUES(platforms_mac),
            platforms_linux=VALUES(platforms_linux),
            price_cents=COALESCE(VALUES(price_cents),price_cents),
            price_initial_cents=COALESCE(VALUES(price_initial_cents),price_initial_cents),
            discount_percent=VALUES(discount_percent),
            currency=COALESCE(VALUES(currency),currency),
            is_free=VALUES(is_free),
            metacritic_score=COALESCE(VALUES(metacritic_score),metacritic_score),
            featured_rank=COALESCE(VALUES(featured_rank),featured_rank),
            new_release_rank=COALESCE(VALUES(new_release_rank),new_release_rank),
            coming_soon_rank=COALESCE(VALUES(coming_soon_rank),coming_soon_rank),
            coming_soon=IF(VALUES(coming_soon)=1,1,coming_soon)')
        ->execute([$appid, $name, $header, $capsule, $win, $mac, $lin, $price, $initial, $discount, $currency, $isFree, $meta, $featured, $newRel, $soon, $coming]);
}

function steam_sync_featured(): array
{
    $res = http_json('https://store.steampowered.com/api/featuredcategories/?cc=PT&l=portuguese', 15, 900);
    if (!$res['ok'] || !$res['json']) {
        steam_sync_job('featured', null, 'Steam Store (featuredcategories) indisponível: HTTP ' . $res['status'], false);
        return ['ok' => false, 'error' => 'Não foi possível obter as listas em destaque da Steam Store.'];
    }
    $json = $res['json'];
    $saved = 0;
    foreach (['top_sellers' => 'featured', 'new_releases' => 'new', 'coming_soon' => 'soon', 'specials' => 'featured'] as $key => $rankField) {
        $items = $json[$key]['items'] ?? [];
        $i = 0;
        foreach ($items as $item) {
            if ((int)($item['type'] ?? 0) !== 0) {
                continue;
            }
            $i++;
            $ranks = [$rankField => $i];
            if ($key === 'coming_soon') {
                $ranks['coming'] = 1;
            }
            catalog_upsert_stub($item, $ranks);
            $saved++;
        }
    }
    steam_sync_job('featured', null, null, true, ['saved' => $saved]);
    return ['ok' => true, 'saved' => $saved];
}

function steam_search_store(string $term): array
{
    $term = trim($term);
    if (mb_strlen($term) < 2) {
        return [];
    }
    $url = 'https://store.steampowered.com/api/storesearch/?cc=PT&l=portuguese&term=' . rawurlencode($term);
    $res = http_json($url, 12, 120);
    $items = $res['json']['items'] ?? [];
    foreach ($items as $item) {
        if (($item['type'] ?? '') === 'app' || isset($item['id'])) {
            catalog_upsert_stub($item);
        }
    }
    return $items;
}

function parse_steam_requirements(?string $html): array
{
    $empty = [
        'os' => 'Não disponível',
        'processor' => 'Não disponível',
        'memory' => 'Não disponível',
        'graphics' => 'Não disponível',
        'directx' => 'Não disponível',
        'storage' => 'Não disponível',
        'sound' => 'Não disponível',
        'other' => 'Não disponível',
    ];
    if (!$html) {
        return $empty;
    }
    $text = html_entity_decode(str_replace(['<br>', '<br/>', '<br />', '</li>', '</p>'], "\n", $html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = strip_tags($text);
    $map = [
        'os' => '/(?:os|sistema operativo|sistemas operativos)\s*[:\-]\s*(.+)/i',
        'processor' => '/(?:processor|processador)\s*[:\-]\s*(.+)/i',
        'memory' => '/(?:memory|memória)\s*[:\-]\s*(.+)/i',
        'graphics' => '/(?:graphics|placa gráfica|video)\s*[:\-]\s*(.+)/i',
        'directx' => '/(?:directx)\s*[:\-]\s*(.+)/i',
        'storage' => '/(?:storage|armazenamento|hard drive|espaço)\s*[:\-]\s*(.+)/i',
        'sound' => '/(?:sound(?: card)?|placa de som)\s*[:\-]\s*(.+)/i',
        'other' => '/(?:additional notes|notas adicionais|network)\s*[:\-]\s*(.+)/i',
    ];
    $out = $empty;
    foreach ($map as $k => $re) {
        if (preg_match($re, $text, $m)) {
            $out[$k] = trim($m[1]) ?: 'Não disponível';
        }
    }
    return $out;
}

function steam_fetch_app_details(int $appid, bool $force = false): ?array
{
    $pdo = db();
    if (!$force) {
        $q = $pdo->prepare('SELECT * FROM catalog_apps WHERE appid=? AND details_fetched_at IS NOT NULL AND details_fetched_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        $q->execute([$appid]);
        $fresh = $q->fetch();
        if ($fresh) {
            return $fresh;
        }
    }
    $url = 'https://store.steampowered.com/api/appdetails?appids=' . $appid . '&cc=PT&l=portuguese';
    $res = http_json($url, 15, $force ? 0 : 3600);
    $payload = $res['json'][(string)$appid] ?? $res['json'][$appid] ?? null;
    if (!$res['ok'] || !is_array($payload) || empty($payload['success']) || !isset($payload['data'])) {
        return null;
    }
    $d = $payload['data'];
    $type = mb_substr((string)($d['type'] ?? 'unknown'), 0, 32);
    $genres = [];
    foreach ($d['genres'] ?? [] as $g) {
        $genres[] = (string)($g['description'] ?? '');
    }
    $cats = [];
    $early = 0;
    foreach ($d['categories'] ?? [] as $c) {
        $desc = (string)($c['description'] ?? '');
        $cats[] = $desc;
        if (stripos($desc, 'Early Access') !== false || stripos($desc, 'Acesso Antecipado') !== false) {
            $early = 1;
        }
    }
    $shots = [];
    foreach (array_slice($d['screenshots'] ?? [], 0, 8) as $s) {
        $shots[] = $s['path_full'] ?? $s['path_thumbnail'] ?? '';
    }
    $movies = [];
    foreach (array_slice($d['movies'] ?? [], 0, 3) as $m) {
        $movies[] = [
            'name' => $m['name'] ?? 'Trailer',
            'thumbnail' => $m['thumbnail'] ?? '',
            'webm' => $m['webm']['480'] ?? $m['webm']['max'] ?? '',
            'mp4' => $m['mp4']['480'] ?? $m['mp4']['max'] ?? '',
        ];
    }
    $release = $d['release_date'] ?? [];
    $coming = !empty($release['coming_soon']) ? 1 : 0;
    $rawDate = (string)($release['date'] ?? '');
    $iso = null;
    if (preg_match('/(\d{1,2})\s+(\w+)\s+(\d{4})/', $rawDate, $m)) {
        $months = ['jan'=>1,'january'=>1,'janeiro'=>1,'feb'=>2,'fev'=>2,'february'=>2,'fevereiro'=>2,'mar'=>3,'march'=>3,'março'=>3,'marco'=>3,'apr'=>4,'abril'=>4,'april'=>4,'may'=>5,'maio'=>5,'jun'=>6,'june'=>6,'junho'=>6,'jul'=>7,'july'=>7,'julho'=>7,'aug'=>8,'agosto'=>8,'august'=>8,'sep'=>9,'set'=>9,'september'=>9,'setembro'=>9,'oct'=>10,'out'=>10,'october'=>10,'outubro'=>10,'nov'=>11,'november'=>11,'novembro'=>11,'dec'=>12,'dez'=>12,'december'=>12,'dezembro'=>12];
        $mi = $months[mb_strtolower($m[2])] ?? null;
        if ($mi) {
            $iso = sprintf('%04d-%02d-%02d', (int)$m[3], $mi, (int)$m[1]);
        }
    } elseif (preg_match('/(\d{4})/', $rawDate, $m)) {
        $iso = $m[1] . '-01-01';
    }
    $price = $d['price_overview']['final'] ?? ($d['is_free'] ? 0 : null);
    $initial = $d['price_overview']['initial'] ?? $price;
    $discount = (int)($d['price_overview']['discount_percent'] ?? 0);
    $currency = $d['price_overview']['currency'] ?? 'EUR';
    $devs = implode(', ', $d['developers'] ?? []);
    $pubs = implode(', ', $d['publishers'] ?? []);
    $min = isset($d['pc_requirements']['minimum']) ? (string)$d['pc_requirements']['minimum'] : null;
    $rec = isset($d['pc_requirements']['recommended']) ? (string)$d['pc_requirements']['recommended'] : null;
    $short = plain_text((string)($d['short_description'] ?? ''), 2000);
    $long = plain_text((string)($d['detailed_description'] ?? $d['about_the_game'] ?? ''), 8000);
    $header = $d['header_image'] ?? null;
    $pdo->prepare('INSERT INTO catalog_apps
        (appid,name,type,is_free,coming_soon,early_access,release_date,release_date_raw,short_description,detailed_description,header_image,capsule_image,developers,publishers,genres,categories,platforms_windows,platforms_mac,platforms_linux,price_cents,price_initial_cents,discount_percent,currency,metacritic_score,metacritic_url,recommendations,pc_req_min,pc_req_rec,screenshots,movies,website,details_fetched_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
        ON DUPLICATE KEY UPDATE
            name=VALUES(name), type=VALUES(type), is_free=VALUES(is_free), coming_soon=VALUES(coming_soon),
            early_access=VALUES(early_access), release_date=VALUES(release_date), release_date_raw=VALUES(release_date_raw),
            short_description=VALUES(short_description), detailed_description=VALUES(detailed_description),
            header_image=COALESCE(VALUES(header_image),header_image), capsule_image=COALESCE(VALUES(capsule_image),capsule_image),
            developers=VALUES(developers), publishers=VALUES(publishers), genres=VALUES(genres), categories=VALUES(categories),
            platforms_windows=VALUES(platforms_windows), platforms_mac=VALUES(platforms_mac), platforms_linux=VALUES(platforms_linux),
            price_cents=VALUES(price_cents), price_initial_cents=VALUES(price_initial_cents), discount_percent=VALUES(discount_percent),
            currency=VALUES(currency), metacritic_score=VALUES(metacritic_score), metacritic_url=VALUES(metacritic_url),
            recommendations=VALUES(recommendations), pc_req_min=VALUES(pc_req_min), pc_req_rec=VALUES(pc_req_rec),
            screenshots=VALUES(screenshots), movies=VALUES(movies), website=VALUES(website), details_fetched_at=NOW()')
        ->execute([
            $appid,
            mb_substr((string)$d['name'], 0, 255),
            $type,
            !empty($d['is_free']) ? 1 : 0,
            $coming,
            $early,
            $iso,
            mb_substr($rawDate, 0, 80),
            $short,
            $long,
            $header,
            $header,
            mb_substr($devs, 0, 255),
            mb_substr($pubs, 0, 255),
            mb_substr(implode('|', array_filter($genres)), 0, 500),
            mb_substr(implode('|', array_filter($cats)), 0, 700),
            !empty($d['platforms']['windows']) ? 1 : 0,
            !empty($d['platforms']['mac']) ? 1 : 0,
            !empty($d['platforms']['linux']) ? 1 : 0,
            $price,
            $initial,
            $discount,
            $currency,
            isset($d['metacritic']['score']) ? (int)$d['metacritic']['score'] : null,
            $d['metacritic']['url'] ?? null,
            isset($d['recommendations']['total']) ? (int)$d['recommendations']['total'] : null,
            $min ? mb_substr($min, 0, 65000) : null,
            $rec ? mb_substr($rec, 0, 65000) : null,
            json_encode(array_values(array_filter($shots)), JSON_UNESCAPED_SLASHES),
            json_encode($movies, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            $d['website'] ?? null,
        ]);
    steam_refresh_reviews($appid);
    steam_refresh_players($appid);
    $q = $pdo->prepare('SELECT * FROM catalog_apps WHERE appid=?');
    $q->execute([$appid]);
    return $q->fetch() ?: null;
}

function steam_refresh_reviews(int $appid): void
{
    $url = 'https://store.steampowered.com/appreviews/' . $appid . '?json=1&language=all&purchase_type=all&num_per_page=0';
    $res = http_json($url, 12, 1800);
    $q = $res['json']['query_summary'] ?? null;
    if (!is_array($q)) {
        return;
    }
    $total = (int)($q['total_reviews'] ?? 0);
    $pos = (int)($q['total_positive'] ?? 0);
    $pct = $total > 0 ? (int)round(($pos / $total) * 100) : null;
    db()->prepare('UPDATE catalog_apps SET steam_review_desc=?, steam_review_percent=?, steam_review_count=? WHERE appid=?')
        ->execute([mb_substr((string)($q['review_score_desc'] ?? ''), 0, 80), $pct, $total ?: null, $appid]);
}

function steam_refresh_players(int $appid): void
{
    $url = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' . $appid;
    $res = http_json($url, 10, 600);
    $count = $res['json']['response']['player_count'] ?? null;
    if ($count === null) {
        return;
    }
    db()->prepare('UPDATE catalog_apps SET current_players=?, current_players_at=NOW() WHERE appid=?')
        ->execute([(int)$count, $appid]);
}

function steam_sync_applist_incremental(int $pages = 1): array
{
    $key = steam_api_key();
    if ($key === '') {
        steam_sync_job('applist', null, 'IStoreService/GetAppList requer uma chave Steam Web API. Sem chave, o catálogo usa as listas da loja e a pesquisa.', false);
        return ['ok' => false, 'skipped' => true, 'error' => 'Chave Steam Web API não configurada; a sincronização incremental completa do catálogo ficou desativada.'];
    }
    $pdo = db();
    $st = $pdo->query("SELECT cursor_value FROM sync_state WHERE job='applist'");
    $last = (int)($st->fetchColumn() ?: 0);
    $modified = 0;
    $q = $pdo->query("SELECT UNIX_TIMESTAMP(last_success) FROM sync_state WHERE job='applist'");
    $since = (int)($q->fetchColumn() ?: 0);
    $saved = 0;
    for ($i = 0; $i < $pages; $i++) {
        $url = 'https://api.steampowered.com/IStoreService/GetAppList/v1/?key=' . rawurlencode($key)
            . '&include_games=1&include_dlc=0&include_software=0&include_videos=0&include_hardware=0&max_results=5000&last_appid=' . $last;
        if ($since > 0) {
            $url .= '&if_modified_since=' . $since;
        }
        $res = http_json($url, 20, 0);
        $apps = $res['json']['response']['apps'] ?? [];
        $haveMore = !empty($res['json']['response']['have_more_results']);
        if (!$res['ok']) {
            steam_sync_job('applist', (string)$last, 'Falha HTTP ' . $res['status'], false);
            return ['ok' => false, 'saved' => $saved, 'error' => 'IStoreService/GetAppList falhou.'];
        }
        $ins = $pdo->prepare('INSERT INTO catalog_apps (appid,name,last_modified,type) VALUES (?,?,?,"game")
            ON DUPLICATE KEY UPDATE name=IF(VALUES(name)="",name,VALUES(name)), last_modified=VALUES(last_modified)');
        foreach ($apps as $app) {
            $appid = (int)($app['appid'] ?? 0);
            if ($appid <= 0) {
                continue;
            }
            $ins->execute([$appid, mb_substr((string)($app['name'] ?? ''), 0, 255), (int)($app['last_modified'] ?? 0)]);
            $saved++;
            $last = $appid;
        }
        $modified = $haveMore ? 1 : 0;
        steam_sync_job('applist', (string)$last, null, true, ['have_more' => $haveMore]);
        if (!$haveMore) {
            break;
        }
    }
    return ['ok' => true, 'saved' => $saved, 'have_more' => (bool)$modified, 'last_appid' => $last];
}

function steam_fill_stale_details(int $limit = 6): int
{
    $q = db()->query('SELECT appid FROM catalog_apps WHERE details_fetched_at IS NULL ORDER BY featured_rank IS NULL, featured_rank, new_release_rank IS NULL, appid DESC LIMIT ' . (int)$limit);
    $n = 0;
    foreach ($q->fetchAll(PDO::FETCH_COLUMN) as $id) {
        if (steam_fetch_app_details((int)$id)) {
            $n++;
        }
    }
    return $n;
}

function steam_news_for_app(int $appid, int $count = 8): array
{
    $url = 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=' . $appid . '&count=' . $count . '&maxlength=280';
    $res = http_json($url, 12, 900);
    return $res['json']['appnews']['newsitems'] ?? [];
}
