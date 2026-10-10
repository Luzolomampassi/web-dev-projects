# Arcadia — Biblioteca pessoal de jogos

Aplicação pessoal construída com PHP, MySQL, HTML, CSS e JavaScript puro. Os registos ficam na base de dados MySQL e as capas que carregares são guardadas em `uploads/`. A coleção começa vazia: adiciona os teus próprios jogos.

## Requisitos

- PHP 8.1 ou superior com extensões `PDO_MySQL`, `fileinfo` e `mbstring`.
- MySQL 8.0 ou MariaDB 10.5 ou superior.
- Apache (por exemplo, XAMPP) ou o servidor embutido do PHP.

## Instalação local com XAMPP

1. Copia a pasta `biblioteca-jogos` para `C:\xampp\htdocs\biblioteca-jogos`.
2. Inicia Apache e MySQL no XAMPP.
3. Abre phpMyAdmin, seleciona **Importar** e importa `database/schema.sql`. O script cria a base de dados `arcadia` e as três tabelas necessárias.
4. Copia `config.example.php` para `config.php`. Edita `config.php` com o utilizador e a palavra-passe do teu MySQL. Na configuração típica local do XAMPP, o utilizador é `root` e a palavra-passe está vazia.
5. Confirma que o Apache consegue escrever em `uploads/` para poder guardar capas.
6. Abre `http://localhost/biblioteca-jogos/`.

## Usar o servidor embutido do PHP

Com a base de dados configurada, abre um terminal nesta pasta e executa:

```sh
php -S 127.0.0.1:8000
```

Depois visita `http://127.0.0.1:8000`.

## Funcionalidades

- Dashboard com estatísticas calculadas a partir dos teus jogos.
- Biblioteca em grelha ou lista, com pesquisa, filtros e ordenação.
- Estados pessoais, horas, avaliação, notas e favoritos.
- Lista de desejos com a ação para passar um título para a coleção normal: edita o jogo e desmarca **Guardar na lista de desejos**.
- Coleções personalizadas com associação de jogos.
- Capas carregadas localmente, validação de formulário e confirmação antes de apagar.
- Interface adaptável a telemóveis, navegação por teclado, preferência de movimento reduzido e tema claro/escuro.

## Pastas

```text
api/             Endpoints PHP para jogos e coleções
assets/css/      Estilos e layouts responsivos
assets/js/       Navegação, formulários e interações
database/        Esquema SQL inicial
includes/        Ligação à base de dados e utilitários PHP
uploads/         Capas carregadas pelo utilizador
config.example.php
index.php
```

Os endpoints incluem token CSRF e usam consultas preparadas PDO. A aplicação destina-se a uso pessoal local; não inclui autenticação de utilizadores.
