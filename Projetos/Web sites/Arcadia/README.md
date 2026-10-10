# Arcadia — Biblioteca pessoal de jogos

Arcadia é uma aplicação PHP/MySQL para acompanhar jogos, progresso, favoritos e coleções. Inclui contas com email e palavra-passe, perfil de jogador, definições de aparência e dados privados por conta. A interface funciona em telemóveis e computadores.

## Publicar no InfinityFree

1. No painel InfinityFree, cria uma base de dados MySQL e anota o hostname, o nome da base de dados, o utilizador e a palavra-passe. O hostname MySQL indicado pelo painel é diferente de `localhost`.
2. Copia os ficheiros do projeto para `htdocs` do teu domínio, preservando `api/`, `assets/`, `includes/` e `uploads/`.
3. Copia `config.example.php` para `config.php`. Preenche os quatro dados MySQL com os valores do painel e mantém `charset` como `utf8mb4`.
4. Confirma que `uploads/` permite gravação pelo PHP para guardar capas.
5. Abre o domínio em HTTPS e cria a tua conta em **Criar conta**. A aplicação cria as tabelas e acrescenta as colunas necessárias no primeiro acesso; o utilizador MySQL tem de permitir `CREATE` e `ALTER`.

O ficheiro `config.php` contém credenciais e não deve ser publicado num repositório. O `.gitignore` já o exclui. Se o teu plano de alojamento impedir criação ou alteração de tabelas, importa `database/schema.sql` no phpMyAdmin e concede ao utilizador permissões para as alterações de migração.

## Instalação local com XAMPP

1. Inicia Apache e MySQL no XAMPP.
2. Copia `config.example.php` para `config.php`. Na configuração típica local, utiliza `127.0.0.1`, base de dados `arcadia`, utilizador `root` e palavra-passe vazia.
3. Abre o projeto pelo Apache e cria uma conta. Também podes importar `database/schema.sql` antes do primeiro acesso.

## Funcionalidades

- Registo, início e fim de sessão com palavras-passe guardadas por hash.
- Dados isolados por conta para jogos, favoritos, lista de desejos e coleções.
- Perfil editável com biografia e estatísticas pessoais.
- Sistema de amizade com pesquisa por nome ou ID Arcadia, sugestões, pedidos, lista de amigos e partilha limitada de jogos e coleções entre amigos aceites.
- Alteração de palavra-passe e tema claro/escuro guardado na conta.
- Biblioteca com pesquisa, filtros, ordenação, vista em grelha/lista e capas carregadas.
- Notificações para pedidos de amizade, amizades aceites e novas mensagens; chat privado entre amigos aceites.
- Progresso de jogos, horas, avaliação, notas privadas e coleções personalizadas.

PHP 8.1+ com PDO MySQL, fileinfo e mbstring; MySQL ou MariaDB; Apache ou servidor equivalente.
