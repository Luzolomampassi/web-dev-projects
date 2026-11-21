<?php
declare(strict_types=1);

/**
 * Xbox / Microsoft Store — integração com a Xbox Developer API.
 *
 * IMPORTANTE: A Xbox API NÃO é pública e gratuita. Requer:
 *   1. Registo como desenvolvedor no Microsoft Partner Center / Xbox Developer Program
 *   2. Client ID e Client Secret
 *   3. Autenticação OAuth 2.0 para acessar dados do utilizador (biblioteca, conquistas, etc.)
 *
 * As funções abaixo são stubs documentados. Para ativar, preencha
 * xbox_client_id e xbox_client_secret em config.php e implemente o fluxo OAuth.
 */

function xbox_client_id(): string
{
    $cfg = app_config();
    return trim((string)($cfg['xbox']['client_id'] ?? getenv('XBOX_CLIENT_ID') ?: ''));
}

function xbox_client_secret(): string
{
    $cfg = app_config();
    return trim((string)($cfg['xbox']['client_secret'] ?? getenv('XBOX_CLIENT_SECRET') ?: ''));
}

function xbox_search_store(string $term): array
{
    $term = trim($term);
    if (mb_strlen($term) < 2) {
        return [];
    }

    $clientId = xbox_client_id();
    if ($clientId === '') {
        // Sem credenciais configurados — retorna vazio com nota implícita
        return [];
    }

    // Endpoint da Microsoft Store / Xbox (requer token OAuth)
    // Exemplo: https://displaycatalog.mp.microsoft.com/v7.0/products?... (requer access token)
    // Sem implementação completa do OAuth, não podemos chamar diretamente.
    return [];
}

function xbox_get_featured(): array
{
    $clientId = xbox_client_id();
    if ($clientId === '') {
        return [
            'ok' => false,
            'error' => 'Xbox API requer Client ID/Secret configurados em config.php.',
            'catalog' => [],
        ];
    }

    return [
        'ok' => false,
        'error' => 'Xbox API requer implementação completa de OAuth 2.0.',
        'catalog' => [],
    ];
}

function xbox_get_app_details(int $externalId): ?array
{
    // Sem credenciais OAuth, não é possível obter detalhes.
    return null;
}
