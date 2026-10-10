# Web Dev Projects

## Portfólio

Portfólio pessoal desenvolvido para apresentar meus projetos de desenvolvimento web, tecnologias que estou estudando e minha evolução como desenvolvedor.

## Tecnologias

* HTML5
* CSS3
* JavaScript
* Flexbox
* CSS Grid
* Design responsivo
* Manipulação do DOM

## Funcionalidades

* Apresentação de projetos
* Filtros de projetos por categoria
* Pesquisa de projetos
* Layout responsivo
* Interface adaptada para dispositivos móveis e desktop
* Formulário de contato

## Objetivo

Criar um portfólio moderno, responsivo e funcional para apresentar projetos, conhecimentos e evolução no desenvolvimento web.

## Acesso

[Visitar o portfólio](https://luzolomampassi.github.io/web-dev-projects/)

## Publicação no InfinityFree

O portfólio usa a raiz deste repositório como raiz do site. No InfinityFree, envie os ficheiros para a pasta `htdocs` indicada para o seu domínio; não envie a pasta `.git`, `.vscode` nem o `config.php` local.

1. Execute `composer install --no-dev --optimize-autoloader` neste projeto e envie também a pasta `vendor` gerada. O formulário precisa dela para carregar o PHPMailer, e `vendor` está excluída do Git.
2. Envie `index.html`, `style.css`, `interacoes.js`, `projetos.js`, `.htaccess`, `vendor`, `config do portofólio` e as pastas `Projetos` referenciadas pela página de projetos (Portofolio-1, Restaurante levaki, Dashbord anality, Cosmos e TaskPulse), mantendo a estrutura e os nomes das pastas.
3. Crie um ficheiro `.env` na raiz `htdocs`, copiando `.env.example`, e preencha os dados fornecidos pelo seu serviço SMTP. Não envie `.env.example` como configuração e nunca adicione `.env` ao Git. O `.htaccess` impede acesso HTTP a ficheiros `.env` e `.git`.
4. No painel do InfinityFree, confirme a versão PHP ativa e que o `.htaccess` está a ser aplicado. O PHPMailer precisa da extensão OpenSSL para TLS/SSL.
5. Teste as páginas e o formulário no domínio HTTPS. O formulário só envia depois de configurar um serviço SMTP externo; InfinityFree não fornece SMTP próprio nem suporta `mail()` na hospedagem gratuita.

O remetente (`MAIL_FROM_EMAIL`) tem de ser autorizado pelo serviço SMTP. O destinatário (`CONTACT_TO_EMAIL`) já vem configurado com o endereço de contacto apresentado no portfólio. O projeto está preparado para portas SMTP 587/TLS e 465/SSL; confirme os dados com o seu provedor. Não considere o envio em produção confirmado até receber uma mensagem de teste.
