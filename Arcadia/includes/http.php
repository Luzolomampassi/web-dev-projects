<?php
declare(strict_types=1);

function http_get(string $url, int $timeout = 12, ?int $cacheSeconds = 300): array
{
    $key = hash('sha256', $url);
    $pdo = db();
    if ($cacheSeconds !== null && $cacheSeconds > 0) {
        $cached = $pdo->prepare('SELECT body, http_status FROM http_cache WHERE cache_key=? AND expires_at > NOW()');
        $cached->execute([$key]);
        $row = $cached->fetch();
        if ($row) {
            return ['ok' => ((int)$row['http_status']) < 400, 'status' => (int)$row['http_status'], 'body' => (string)$row['body'], 'cached' => true];
        }
    }

    static $lastCall = 0.0;
    $gap = 0.22;
    $wait = $gap - (microtime(true) - $lastCall);
    if ($wait > 0) {
        usleep((int)round($wait * 1_000_000));
    }
    $lastCall = microtime(true);

    $headers = [
        'User-Agent: Arcadia/1.0 (game library; educational use)',
        'Accept: application/json, application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language: pt-PT,pt;q=0.9,en;q=0.8',
    ];
    $body = '';
    $status = 0;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 4,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => 6,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_ENCODING => '',
        ]);
        $body = (string)curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($body === '' && $err !== '') {
            return ['ok' => false, 'status' => $status ?: 0, 'body' => '', 'error' => $err, 'cached' => false];
        }
    } else {
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => $timeout,
                'header' => implode("\r\n", $headers),
                'ignore_errors' => true,
            ],
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
        ]);
        $body = (string)@file_get_contents($url, false, $ctx);
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $status = (int)$m[1];
        }
    }

    $ok = $status >= 200 && $status < 400 && $body !== '';
    if ($ok && $cacheSeconds !== null && $cacheSeconds > 0) {
        $pdo->prepare('INSERT INTO http_cache (cache_key, url, body, http_status, expires_at) VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL ? SECOND))
            ON DUPLICATE KEY UPDATE body=VALUES(body), http_status=VALUES(http_status), expires_at=VALUES(expires_at), url=VALUES(url)')
            ->execute([$key, mb_substr($url, 0, 500), $body, $status, $cacheSeconds]);
    }
    return ['ok' => $ok, 'status' => $status, 'body' => $body, 'cached' => false];
}

function http_json(string $url, int $timeout = 12, ?int $cacheSeconds = 300): array
{
    $res = http_get($url, $timeout, $cacheSeconds);
    $data = json_decode($res['body'] ?? '', true);
    $res['json'] = is_array($data) ? $data : null;
    if ($res['json'] === null) {
        $res['ok'] = false;
    }
    return $res;
}

function plain_text(string $html, int $max = 4000): string
{
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
    $text = trim($text);
    if (mb_strlen($text) > $max) {
        $text = mb_substr($text, 0, $max - 1) . '…';
    }
    return $text;
}

function canonical_url(string $url): string
{
    $url = trim($url);
    $parts = parse_url($url);
    if (!$parts || empty($parts['host'])) {
        return mb_substr($url, 0, 500);
    }
    $query = [];
    if (!empty($parts['query'])) {
        parse_str($parts['query'], $query);
        foreach (array_keys($query) as $k) {
            if (preg_match('/^(utm_|fbclid|gclid|mc_)/i', (string)$k)) {
                unset($query[$k]);
            }
        }
    }
    $scheme = strtolower($parts['scheme'] ?? 'https');
    $host = strtolower($parts['host']);
    $path = $parts['path'] ?? '/';
    $built = $scheme . '://' . $host . $path;
    if ($query) {
        $built .= '?' . http_build_query($query);
    }
    return mb_substr($built, 0, 500);
}
