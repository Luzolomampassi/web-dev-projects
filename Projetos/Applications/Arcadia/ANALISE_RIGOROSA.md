# Análise Rigorosa — Projeto "Arcadia"

**Localização do projeto:** `C:\xampp\htdocs\Luzolo\web-dev-projects\Projetos\Applications\Arcadia\`  
**Data da análise:** 15 de novembro de 2026  
**Stack:** PHP 8.1+ (PDO MySQL), MySQL/MariaDB, Vanilla JS, CSS  
**Hospedagem alvo:** InfinityFree  

---

## 1. Resumo Executivo

O Arcadia é uma aplicação de biblioteca de jogos pessoais com autenticação, perfil de jogador, amigos, chat privado, notificações, sistema de coleções e backup/importação de dados.

**O core está funcional e bem estruturado:** CRUD de jogos, autenticação com hash de password, sistema de amizade, chat, notificações e alternância de tema claro/escuro.

No entanto, existem **implementações não acabadas graves** (sobretudo na camada Steam/catálogo, que fica totalmente inacessível pela interface) e **vários bugs de integridade de dados e segurança** que precisam de correcção antes de qualquer uso em produção.

---

## 2. Implementações Não Acabadas

### 2.1. Integração Steam / Catálogo — totalmente inacessível pela UI

O projeto possui toda a infraestrutura Steam, mas **não há um único endpoint de API nem uma página na interface** para a consumir.

- `includes/steam.php`: funções para buscar catálogo Steam, detalhes de app, reviews, número de jogadores, notícias e sincronização incremental da applist.
- `includes/http.php`: cliente HTTP com cache e rate-limiting para chamadas externas.
- `includes/schema.php`: cria tabelas `catalog_apps`, `user_catalog`, `community_reviews`, `review_reports`, `game_views`, `news_sources`, `news_articles`, `news_reads`, `http_cache`, `sync_state`.
- **O ficheiro `includes/schema.php` NUNCA é chamado** em `includes/bootstrap.php`. Ou seja, nenhuma destas tabelas é criada automaticamente.
- `config.php` e `config.example.php` não contêm a chave `steam.web_api_key`, necessária para `steam_sync_applist_incremental()`.

**Localizações dos problemas:**
- `includes/bootstrap.php` — não chama `ensure_platform_schema()`
- `config.php` (linhas 1-11) — falta chave `steam`
- `config.example.php` (linhas 1-11) — falta chave `steam`

### 2.2. Tabelas órfãs sem UI nem API

São criadas (se `schema.php` fosse chamado) mas nunca usadas por nenhum endpoint:

- `community_reviews` / `review_reports` — reviews da comunidade
- `news_sources` / `news_articles` / `news_reads` — notícias de jogos
- `user_catalog` — ligação utilizador ↔ catálogo Steam
- `game_views` — histórico de visualizações
- `sync_state` / `http_cache` — infraestrutura de sincronização

**Localização:** `includes/schema.php` (linhas 4-194)

### 2.3. Não há gestão de coleções dentro do modal de edição de jogo

O utilizador pode criar coleções e atribuir jogos a elas (através de um `prompt()` primitivo na lista de coleções), mas **não é possível editar as coleções de um jogo** a partir do modal "Editar jogo".

**Localização:**
- `index.php` (modal, linhas 967-1112)
- `assets/js/app.js` (função `openModal`, linhas 691-721)

### 2.4. Não há página pública de perfil de outro utilizador

O perfil só é visível ao próprio utilizador. Quando se clica num amigo, vê-se apenas uma lista resumida de jogos e coleções (via `api/friends.php?profile=`), não há uma página dedicada.

**Localização:** `index.php` (não existe página pública) e `api/friends.php` (linha 14-25 devolve dados limitados)

### 2.5. Não há recuperação de conta / "esqueci a palavra-passe"

Não existe fluxo de reset de password por email.

**Localização:** `api/auth.php` (não existe ação de reset)

### 2.6. Não há paginação em nenhum endpoint

Todos os `SELECT *` trazem todos os registos de uma vez. Com centenas de jogos, notificações ou mensagens, isto causará problemas de performance.

**Localizações:**
- `api/games.php` linha 9
- `api/notifications.php` linha 8 (LIMIT 100 fixo, sem paginação)
- `api/chat.php` linhas 25-26 (LIMIT 100 fixo)
- `api/friends.php` linha 29 (LIMIT 8 fixo nas sugestões)

### 2.7. Backup não inclui capas de jogos

Documentado no README, mas é uma limitação funcional: ao importar, as capas são perdidas.

**Localização:** `api/backup.php` (linha 54: `cover_path` é sempre `null` na importação)

---

## 3. Bugs e Problemas Críticos (com localizações exatas)

### Bug 1 — Schema SQL desatualizado (coluna `user_id` em falta)

`database/schema.sql` cria as tabelas `games` e `collections` **sem a coluna `user_id`**. O código PHP adiciona essa coluna via `ALTER TABLE` em tempo de execução (`bootstrap.php` linhas 52-65). Se alguém importar o `schema.sql` no phpMyAdmin (como sugerido no README linha 26), a aplicação quebrará porque as queries filtram por `user_id` que não existe.

**Localização:** `database/schema.sql` (linhas 15-33, 84-88) vs `includes/bootstrap.php` (linhas 52-65)

### Bug 2 — Constraint UNIQUE global em `collections.name` impede coleções com nomes iguais entre utilizadores

No `schema.sql` (linha 86): `name VARCHAR(80) NOT NULL UNIQUE`. Isto torna o nome da coleção único **globalmente**, não por utilizador. Dois utilizadores não podem criar uma coleção chamada "Favoritos". O código PHP (`api/collections.php`) não trata este erro de duplicate key.

**Localização:** `database/schema.sql` linha 86

### Bug 3 — Registos órfãos são reclamados pelo primeiro utilizador

`api/auth.php` linha 33:
```php
$pdo->prepare('UPDATE games SET user_id=? WHERE user_id IS NULL')->execute([$id]);
```
Num ambiente multi-utilizador, o primeiro utilizador a registar-se herda todos os jogos sem `user_id` (registos órfãos de uma versão anterior ou de importação). Isto é uma fuga de dados entre contas.

**Localização:** `api/auth.php` linha 33

### Bug 4 — `try/catch` vazio engole erros de base de dados silenciosamente

`index.php` linhas 161-174:
```php
try {
    $identityDb = db();
    ...
    $_SESSION['user']['public_id'] = $profilePublicId;
} catch (Throwable) {
}
```
Se a coluna `public_id` não existir (porque `schema.php` não foi executado), o erro é engolido e o utilizador vê apenas "ID indisponível" sem qualquer indicação do problema.

**Localização:** `index.php` linhas 161-174

### Bug 5 — CSS: segundo bloco `:root` sobrescreve variáveis do tema escuro

O ficheiro `app.css` tem dois blocos `:root`. O primeiro (linha 1-14) define variáveis escuras. O segundo (linha 1344-1355) define variáveis **claras** e, por ordem de cascata, vence sobre o primeiro. Isto significa que, mesmo sem a classe `theme-light`, as variáveis de raiz são as claras. As regras `body.theme-dark` corrigem apenas algumas cores, deixando possíveis inconsistências em elementos sem regra específica.

**Localização:** `assets/css/app.css` linhas 1-14 vs 1344-1355

### Bug 6 — `api/games.php`: erro de SQL frágil na atualização com cover

Linha 64:
```php
$sql='UPDATE games SET title=?,platform=?,genre,?,status=?,hours=?,rating=?,release_date=?,description=?,notes=?,favorite=?,is_wishlist=?,cover_path=?,updated_at=NOW() WHERE id=?';
$pdo->prepare($sql.' AND user_id=?')->execute([...$data,$cover,$id,$uid]);
```
O `$data` tem 11 elementos, mais `$cover`, `$id`, `$uid` = 14 parâmetros. O SQL tem 12 placeholders de dados + `id` + `user_id` = 14. Está correto por coincidência, mas é extremamente frágil: qualquer mudança na ordem dos campos desalinha tudo. Não há nomeação de parâmetros.

**Localização:** `api/games.php` linhas 62-64 e 67-68

### Bug 7 — Chat: mensagens enviadas pelo próprio utilizador nunca são marcadas como lidas

Quando o utilizador A envia mensagem para B, a mensagem fica com `read_at = NULL`. Quando B abre a conversa, as mensagens de A são marcadas como lidas. Mas as mensagens enviadas por A nunca recebem `read_at`. Não é um bloqueador, mas é uma inconsistência nos estados de leitura.

**Localização:** `api/chat.php` linhas 22-23 (apenas marca mensagens recebidas)

### Bug 8 — Não há rate limiting em login / registo

Permite ataques de brute force e enumeration de utilizadores.

**Localização:** `api/auth.php` (sem qualquer rate limiting)

### Bug 9 — `config.php` com credenciais reais expostas

O ficheiro contém host, username e nome da base de dados do InfinityFree reais. Se for enviado para um repositório público, expõe credenciais de produção.

**Localização:** `config.php` linhas 4-8

---

## 4. Problemas de Segurança

| # | Problema | Localização | Gravidade |
|---|----------|-------------|-----------|
| S1 | Credenciais de BD no `config.php` em texto claro, sem variáveis de ambiente | `config.php` linhas 4-8 | Alta |
| S2 | Sem rate limiting em login/registo (brute force) | `api/auth.php` | Alta |
| S3 | Upload de imagens: só valida MIME type, não valida extensão nem dimensões; ficheiros acedíveis diretamente via URL | `api/games.php` linhas 46-54, `uploads/` sem `.htaccess` | Média |
| S4 | `api/backup.php` permite importação de 20 MB sem validação de `cover_path` (sempre null) — perda de dados silenciosa | `api/backup.php` linha 54 | Média |
| S5 | Sem headers de segurança (CSP, X-Frame-Options, HSTS) | `bootstrap.php` / `index.php` | Baixa |

---

## 5. Problemas de Base de Dados / Integridade

| # | Problema | Localização |
|---|----------|-------------|
| D1 | `schema.sql` não tem `user_id` em `games` e `collections` | `database/schema.sql` |
| D2 | `collections.name` é UNIQUE global (não por user) | `database/schema.sql` linha 86 |
| D3 | `includes/schema.php` nunca é chamado → tabelas Steam/notícias nunca criadas | `includes/bootstrap.php` |
| D4 | `api/auth.php` linha 33 atribui jogos órfãos ao primeiro registo | `api/auth.php` linha 33 |
| D5 | Sem índice em `games.user_id` para consultas frequentes (foi adicionado via ALTER, mas o schema.sql não reflete) | `includes/bootstrap.php` linha 56 |

---

## 6. Problemas de UX / Frontend

| # | Problema | Localização |
|---|----------|-------------|
| U1 | Não há paginação — carregar centenas de jogos de uma vez | `api/games.php` linha 9 |
| U2 | Não há gestão de coleções no modal de edição de jogo | `index.php` modal, `app.js` `openModal` |
| U3 | Chat apenas por polling (5s), sem WebSockets / tempo real | `app.js` linha 598 |
| U4 | Não há "esqueci a palavra-passe" | `api/auth.php` |
| U5 | Não há confirmação de email no registo | `api/auth.php` |
| U6 | Não há feedback quando Steam está indisponível (UI não mostra estado da sincronização) | `app.js` não consome endpoints Steam |
| U7 | CSS duplicado (`.sidebar` declarado duas vezes) | `app.css` linhas 38-48 e 2457-2478 |

---

## 7. Prioridades de Correcção

### P0 — Crítica (bloqueia produção / corrompe dados)

| Prioridade | Problema | Localização exacta | Acção |
|------------|----------|-------------------|-------|
| P0.1 | `schema.sql` desatualizado (sem `user_id`) → aplicação não funciona se importar o SQL | `database/schema.sql` linhas 15-33, 84-88 | Adicionar `user_id INT UNSIGNED NOT NULL` e índices a `games` e `collections` |
| P0.2 | `collections.name` UNIQUE global impede nomes duplicados entre utilizadores | `database/schema.sql` linha 86 | Mudar para `UNIQUE KEY (user_id, name)` |
| P0.3 | Jogos órfãos reclamados pelo primeiro registo (fuga de dados entre contas) | `api/auth.php` linha 33 | Remover esta linha ou restringir a jogos criados pelo próprio user antes do registo |
| P0.4 | `try/catch` vazio esconde falhas de BD (public_id em falta) | `index.php` linhas 161-174 | Adicionar log ou erro visível; garantir que `public_id` é criado no registo |
| P0.5 | Credenciais de BD reais no `config.php` | `config.php` linhas 4-8 | Mover para variáveis de ambiente; excluir do repositório (`.gitignore`) |

### P1 — Alta (funcionalidade prometida não entregue)

| Prioridade | Problema | Localização exacta | Acção |
|------------|----------|-------------------|-------|
| P1.1 | Integração Steam não chamada; tabelas nunca criadas | `includes/bootstrap.php` | Chamar `ensure_platform_schema($pdo)` em `db()` |
| P1.2 | Chave Steam em falta no config | `config.php`, `config.example.php` | Adicionar `'steam' => ['web_api_key' => '']` |
| P1.3 | Sem endpoints nem UI para o catálogo Steam | `api/` e `index.php` | Criar `api/catalog.php` e página de catálogo |
| P1.4 | Não há paginação em jogos/notificações/chat | `api/games.php` linha 9; `api/notifications.php` linha 8; `api/chat.php` linhas 25-26 | Adicionar `LIMIT` / `OFFSET` com parâmetros `page` e `limit` |
| P1.5 | Não há gestão de coleções dentro do modal de edição de jogo | `index.php` modal (linhas 967-1112); `app.js` `openModal` (linhas 691-721) | Adicionar multi-select de coleções no modal |

### P2 — Média (UX, robustez, segurança)

| Prioridade | Problema | Localização exacta | Acção |
|------------|----------|-------------------|-------|
| P2.1 | CSS: segundo `:root` sobrescreve variáveis do tema escuro | `app.css` linhas 1344-1355 | Usar apenas `body.theme-light` / `body.theme-dark` para sobrepor variáveis, não um segundo `:root` |
| P2.2 | Sem rate limiting em login/registo | `api/auth.php` | Adicionar rate limiting simples (tentativas por IP/email) |
| P2.3 | Upload de imagens sem validação de extensão/dimensões | `api/games.php` linhas 46-54 | Validar extensão, limitar resolução, adicionar `.htaccess` em `uploads/` |
| P2.4 | Backup não inclui capas | `api/backup.php` linha 54 | Incluir ficheiros de capa no ZIP/backup ou documentar claramente |
| P2.5 | CSS duplicado (`.sidebar` duas vezes) | `app.css` linhas 38-48 e 2457-2478 | Remover duplicado |

### P3 — Baixa (melhorias opcionais)

| Prioridade | Problema | Localização exacta | Acção |
|------------|----------|-------------------|-------|
| P3.1 | Chat sem WebSockets (polling) | `app.js` linha 598 | Avaliar WebSockets se houver muitos utilizadores simultâneos |
| P3.2 | Não há "esqueci a palavra-passe" | `api/auth.php` | Implementar fluxo de reset por email |
| P3.3 | Não há confirmação de email | `api/auth.php` | Adicionar verificação de email opcional |
| P3.4 | Não há página pública de perfil | `index.php` / `api/friends.php` | Criar página pública por `public_id` |
| P3.5 | Tabelas órfãs (reviews, notícias, game_views) | `includes/schema.php` | Remover ou implementar funcionalidade |
| P3.6 | Não há `.gitignore` | Raiz do projeto | Criar `.gitignore` excluindo `config.php`, `uploads/`, `.env` |

---

## 8. Roadmap Sugerido (ordem de execução)

### Semana 1 — Estabilizar o core (P0)

1. Corrigir `database/schema.sql` com `user_id` e constraint correta em `collections`.
2. Remover linha 33 de `api/auth.php` (atribuição de órfãos).
3. Substituir `try/catch` vazio em `index.php` por tratamento de erro visível.
4. Mover credenciais de `config.php` para variáveis de ambiente / `.env`.
5. Criar `.gitignore`.

### Semana 2 — Ativar plataforma Steam (P1)

6. Chamar `ensure_platform_schema()` em `includes/bootstrap.php`.
7. Adicionar chave Steam a `config.example.php` e `config.php`.
8. Criar `api/catalog.php` com endpoints de busca e detalhes Steam.
9. Adicionar página de catálogo na UI e botão "Adicionar da Steam" no modal de jogo.

### Semana 3 — Robustez e UX (P1/P2)

10. Adicionar paginação a `api/games.php`, `api/notifications.php`, `api/chat.php`.
11. Adicionar gestão de coleções no modal de edição de jogo.
12. Corrigir CSS (remover segundo `:root`, unificar variáveis de tema).
13. Adicionar rate limiting a login/registo.

### Semana 4 — Segurança e polimento (P2/P3)

14. Validar uploads de imagem (extensão, dimensões, `.htaccess` em `uploads/`).
15. Adicionar "esqueci a palavra-passe" e confirmação de email (opcional).
16. Criar página pública de perfil.

---

## 9. Árvore de ficheiros analisada

```
Projetos/Applications/Arcadia/
├── README.md
├── config.php
├── config.example.php
├── index.php
├── database/
│   └── schema.sql
├── includes/
│   ├── bootstrap.php
│   ├── schema.php
│   ├── steam.php
│   └── http.php
├── api/
│   ├── auth.php
│   ├── games.php
│   ├── friends.php
│   ├── collections.php
│   ├── chat.php
│   ├── notifications.php
│   └── backup.php
├── assets/
│   ├── js/
│   │   └── app.js
│   └── css/
│       └── app.css
└── uploads/   (não listado no glob, mas referido no README)
```

---

**Fim do documento.**  
Se pretender, posso gerar os ficheiros corrigidos (`schema.sql`, `bootstrap.php`, `config.php`, `auth.php`, `app.css`, etc.) para aplicação direta no projeto.