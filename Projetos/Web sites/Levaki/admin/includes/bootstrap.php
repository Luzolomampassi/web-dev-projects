<?php 

$host = 'localhost';
$dbname = 'levaki';
$charset = 'utf8mb4';
$username = 'root';
$password = '';
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

try{
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
catch(PDOException $error){
    error_log($error->getMessage());
    http_response_code(500);
    echo 'Falha ao conectar com o servidor.';
    exit;
}
