<?php
return [
    'database' => [
        'host' => '127.0.0.1',        // Altere para o hostname do teu alojamento (ex.: sql107.infinityfree.com)
        'port' => 3306,
        'name' => 'arcadia',          // Nome da base de dados
        'username' => 'root',         // Utilizador da base de dados
        'password' => '',             // Palavra-passe da base de dados
        'charset' => 'utf8mb4',
    ],
    'steam' => [
        'web_api_key' => '',          // Chave da Steam Web API (opcional; obtém em steamcommunity.com)
    ],
    'xbox' => [
        'client_id' => '',            // Xbox Developer Client ID (opcional; requer registo na Microsoft)
        'client_secret' => '',        // Xbox Developer Client Secret (opcional)
    ],
];
