<?php
declare(strict_types=1);

/**
 * PlayStation Store — integração com a loja pública.
 *
 * IMPORTANTE: A Sony NÃO disponibiliza API pública oficial e documentada para:
 *   - Biblioteca de jogos do utilizador (requer autenticação OAuth PSN + Client ID/Secret)
 *   - Detalhes de jogos da biblioteca pessoal
 *
 * As funções abaixo usam apenas endpoints públicos da PlayStation Store (sem autenticação),
 * que podem mudar ou ser bloqueados pela Sony a qualquer momento. Para integração completa
 * com a biblioteca do utilizador, é necessário registar-se como desenvolvedor na
 * Sony Developer Network e implementar OAuth 2.0 da PSN.
 */

function ps_search_store(string $term): array
{
    $term = trim($term);
    if (mb_strlen($term) < 2) {
        return [];
    }

    // Endpoint público da PlayStation Store (não oficial, pode mudar)
    $url = 'https://store.playstation.com/store/api/chihiro/00_09_000/container/PT/pt/19/STORE-MSF86008-PLAYSTATIONSTORE?search=' . rawurlencode($term) . '&size=20';

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 4,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_HTTPHEADER => [
            'User-Agent: Arcadia/1.0 (game library; educational use)',
            'Accept: application/json',
            'Accept-Language: pt-PT,pt;q=0.9,en;q=0.8',
        ],
    ]);
    $body = (string)curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status < 200 || $status >= 400 || $body === '') {
        return [];
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        return [];
    }

    $results = [];
    // A estrutura da resposta da PS Store varia; tentamos extrair de forma defensiva
    $items = $data['items'] ?? $data['results'] ?? $data['products'] ?? [];

    foreach ($items as $item) {
        if (!is_array($item)) continue;

        $id = (int)($item['id'] ?? $item['offerId'] ?? $item['sku'] ?? 0);
        if ($id <= 0) continue;

        $results[] = [
            'platform' => 'playstation',
            'appid' => $id,
            'name' => $item['name'] ?? $item['title'] ?? 'Sem título',
            'type' => $item['type'] ?? $item['offerType'] ?? 'game',
            'image' => $item['image'] ?? $item['thumbnail'] ?? $item['urlImage'] ?? null,
            'price' => $item['price'] ?? $item['regularPrice'] ?? null,
            'currency' => $item['currency'] ?? 'EUR',
            'source' => 'PlayStation Store',
        ];
    }

    return $results;
}

function ps_get_featured(): array
{
    // PlayStation Store não tem endpoint público oficial de destaques sem autenticação.
    // Retorna vazio com nota para o frontend.
    return [
        'ok' => false,
        'error' => 'PlayStation Store requer autenticação OAuth para destaques personalizados.',
        'catalog' => [],
    ];
}

function ps_get_app_details(int $externalId): ?array
{
    // Sem API pública oficial para detalhes de produto específico sem autenticação.
    // Retorna null para forçar o frontend a usar busca manual.
    return null;
}
