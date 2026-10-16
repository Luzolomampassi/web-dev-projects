
<?php
require_once __DIR__ . '/includes/bootstrap.php';

$produtos = $pdo->query(
    "SELECT p.*, c.nome AS categoria, r.nome AS restaurante FROM produtos p LEFT JOIN categorias c ON p.categoria_id = c.id LEFT JOIN restaurantes r ON p.restaurante_id = r.id ORDER BY p.id DESC")->fetchAll(PDO::FETCH_ASSOC);

$categorias = $pdo->query(
    'SELECT id, nome FROM categorias ORDER BY nome')->fetchAll(PDO::FETCH_ASSOC);

$restaurantes = $pdo->query(
    'SELECT id, nome FROM restaurantes ORDER BY nome')->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="pt-AO">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Painel Administrativo | Levaki</title>


    <!-- =====================================================
         CSS
    ====================================================== -->

    <link
        rel="stylesheet"
        href="assets/css/global.css"
    >

    <link
        rel="stylesheet"
        href="assets/css/produtos.css"
    >


    <!-- =====================================================
         FONT AWESOME
    ====================================================== -->

    <script
        src="https://kit.fontawesome.com/f6a9b3f1e7.js"
        crossorigin="anonymous">
    </script>


    <!-- =====================================================
         REMIX ICON
    ====================================================== -->

    <link
        href="https://cdn.jsdelivr.net/npm/remixicon@4.9.0/fonts/remixicon.css"
        rel="stylesheet"
    >

</head>


<body>

    <header class="topbar">

        <div class="topbar-left">

            <button
                type="button"
                id="btn-menu"
                class="btn-menu"
                aria-label="Abrir menu"
            >
                <i class="fa-solid fa-bars"></i>
            </button>


            <h2>Levaki.</h2>

            <h3>Administração / Produtos</h3>

        </div>


        <div class="topbar-right">

            <div class="painel-search">

                <input
                    type="search"
                    name="topbar-search"
                    id="topbar-search"
                    class="topbar-search"
                    placeholder="Pesquisar no painel..."
                    autocomplete="off"
                >

                <i
                    class="fa-solid fa-magnifying-glass lupa"
                    aria-hidden="true"
                ></i>

            </div>


            <button
                type="button"
                class="btn-notifications"
                id="btn-notifications"
                aria-label="Notificações"
            >
                <i class="fa-regular fa-bell fa-xl"></i>
            </button>


            <div class="profile-header">

                <img
                    src=""
                    alt="Foto de perfil de Luzolo Mampassi"
                    class="photo-profile"
                    id="topbar-profile"
                >

                <h3 class="name">
                    Luzolo Mampassi
                </h3>

                <i class="fa-solid fa-angle-down"></i>

            </div>

        </div>

    </header>
    <!-- =====================================================
         CONTEÚDO PRINCIPAL
    ====================================================== -->
<div class="app-shell">
        <aside>

        <div class="sidebar-brand">

            <a
                class="brand"
                href="index.php"
                aria-label="Levaki, ir para dashboard"
            >

                <span>
                    <svg
                        class="brand-mark"
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z"></path>
                    </svg>
                </span>

                <span>
                    levaki<span class="brand-period">.</span>
                </span>

            </a>


            <button
                type="button"
                class="sidebar-close"
                aria-label="Fechar menu"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>


            <div class="brand-caption">
                ADMINISTRAÇÃO <span>·</span> PAINEL
            </div>

        </div>


        <!-- =================================================
             NAVEGAÇÃO
        ================================================== -->

        <nav class="sidebar-nav">

            <div class="nav-group">

                <label>Visão geral</label>

                <a
                    class="nav-item"
                    href="index.php"
                >
                    <i class="ri-dashboard-line icone"></i>
                    <span>Dashboard</span>
                </a>


                <a
                    class="nav-item"
                    href="pedidos.php"
                >
                    <i class="ri-group-line icone"></i>
                    <span>Pedidos</span>
                </a>

            </div>


            <div class="nav-group">

                <label>Gestão</label>

                <a
                    class="nav-item active"
                    href="produtos.php"
                    aria-current="page"
                >
                    <i class="ri-box-3-line icone"></i>
                    <span>Produtos</span>
                </a>


                <a
                    class="nav-item"
                    href="categorias.php"
                >
                    <i class="ri-stack-line icone"></i>
                    <span>Categorias</span>
                </a>


                <a
                    class="nav-item"
                    href="restaurantes.php"
                >
                    <i class="fa-regular fa-house icone"></i>
                    <span>Restaurantes</span>
                </a>


                <a
                    class="nav-item"
                    href="clientes.php"
                >
                    <i class="ri-group-line icone"></i>
                    <span>Clientes</span>
                </a>

            </div>


            <div class="nav-group">

                <label>Sistema</label>

                <a
                    class="nav-item"
                    href="relatorios.php"
                >
                    <i class="fa-solid fa-chart-line icone"></i>
                    <span>Relatórios</span>
                </a>


                <a
                    class="nav-item"
                    href="config.php"
                >
                    <i class="ri-settings-5-line icone"></i>
                    <span>Configurações</span>
                </a>

            </div>

        </nav>


        <!-- =================================================
             PERFIL
        ================================================== -->

        <article class="sidebar-bottom">

            <div>

                <img
                    src=""
                    alt="Foto de perfil de Luzolo Mampassi"
                    class="photo-profile"
                    id="sidebar-profile"
                >

                <div>

                    <h4>Luzolo Mampassi</h4>
                    <p>Administrador</p>

                </div>

            </div>


            <button
                type="button"
                class="logout-button"
                aria-label="Terminar sessão"
            >
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>

        </article>

        </aside>
    <main>
    
        <!-- =================================================
             INTRODUÇÃO
        ================================================== -->

        <article class="page-intro">

            <div>

                <p class="eyebrow">
                    LEVAKI ADMIN / PRODUTOS
                </p>

                <h1>
                    Produtos.
                </h1>


                <div class="intro-div">

                    <p>
                        Gerencie os produtos disponíveis no Levaki.
                    </p>

                    <button
                        type="button"
                        class="btn-intro"
                        id="btn-add-product"
                    >
                        + Adicionar produto
                    </button>

                </div>

            </div>

        </article>



        <section class="dashboard-orders">


            <article class="dashboard-orders-head">

                <div>

                    <h2>
                        Catálogo de produtos
                    </h2>

                    <p><?= count($produtos) ?> produtos encontrados</p>

                </div>


                <div>

                    <a  
                        href="assets/fordownload/levaki-produtos.csv"
                        class="btn-export"
                        download
                    >
                        <i class="ri-download-2-line"></i>
                        Exportar
                        
                    </a>

                </div>

            </article>


            <!-- =================================================
                 FILTROS
            ================================================== -->

            <article class="filters">


                <div class="filter-search">
                    <i
                        class="fa-solid fa-magnifying-glass lupa"
                        aria-hidden="true"
                    >
                    </i>
                    <form action="produtos.php" method="get">
                        <input
                            type="search"
                            name="product-search"
                            id="product-search"
                            placeholder="Buscar por produto, categoria ou restaurante..."
                            autocomplete="on"
                    >
                    </form>
                   
                </div>


                <div class="select-wrap">

                    <select
                        name="categoria-produtos"
                        id="categoria-produtos"
                    >

                        <option value="">
                            Todas as categorias
                        </option>

                                <?php foreach ($categorias as $categoria): ?>
                                    <option value="<?= (int) $categoria['id'] ?>"><?= htmlspecialchars($categoria['nome'], ENT_QUOTES, 'UTF-8') ?></option>
                                <?php endforeach; ?>

                    </select>

                </div>


                <div class="select-wrap">

                    <select
                        name="restaurante-produots"
                        id="restaurante-produtos"
                    >

                        <option value="">
                            Todos os restaurantes
                        </option>

                        <option value="1">
                            Levaki Grill
                        </option>

                        <option value="2">
                            Bella Pasta
                        </option>

                        <option value="3">
                            Sabor da Casa
                        </option>

                        <option value="4">
                            Bottega Verde
                        </option>

                    </select>

                </div>

                <div class="select-wrap">

                    <select
                        name="disponibilidade"
                        id="disponibilidade"
                    >

                        <option value="">
                            Disponibilidade
                        </option>

                        <option value="available">
                            Disponível
                        </option>

                        <option value="unavailable">
                            Indisponível
                        </option>

                    </select>

                </div>

            </article>

            <article class="filters-extra">
                <span>
                    <svg class="" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 7h16M7 12h10m-7 5h4"></path>
                    </svg> Mais filtros
                </span>


                <div class="selects-extras">
                    <div class="select-wrap">
                        <select
                            name="preco-filtro"
                            id="preco-filtro"
                        >
                            <option value="">
                                Qualquer preço
                            </option>
                            <option value="0-9000">
                                Até 9.000 Kz
                            </option>
                            <option value="9000-18000">
                                9.000 Kz a 18.000 Kz
                            </option>
                            <option value="18000+">
                                Acima de 18.000 Kz
                            </option>
                        </select>
                    </div>
                    <div class="select-wrap">
                        <select
                            name="ordem"
                            id="ordem"
                        >
                            <option value="recent">
                                Mais recentes
                            </option>
                            <option value="name-asc">
                                Nome A-Z
                            </option>
                            <option value="price-asc">
                                Menor preço
                            </option>
                            <option value="price-desc">
                                Maior preço
                            </option>
                        </select>
                    </div>
                </div>

            </article>


            <!-- =================================================
                 TABELA
            ================================================== -->

            <article class="table-container">

                <table class="orders-table">

                    <thead>

                        <tr>

                            <th>Produto</th>
                            <th>Categoria</th>
                            <th>Restaurante</th>
                            <th>Preço</th>
                            <th>Criado em</th>
                            <th>Disponibilidade</th>
                            <th class="action-col">AÇÕES</th>

                        </tr>

                    </thead>


                    <tbody class="orders-list">
                        <?php foreach ($produtos as $produto): ?>
                            <tr class="order-row" data-dish-id="<?= (int) $produto['id'] ?>" data-prato="<?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>" data-preco="<?= htmlspecialchars((string) $produto['preco'], ENT_QUOTES, 'UTF-8') ?>" data-categoria="<?= (int) $produto['categoria_id'] ?>" data-restaurante="<?= (int) $produto['restaurante_id'] ?>" data-descricao="<?= htmlspecialchars($produto['descricao'] ?? '', ENT_QUOTES, 'UTF-8') ?>" data-imagem="<?= htmlspecialchars($produto['imagem'] ?? '', ENT_QUOTES, 'UTF-8') ?>" data-disponibilidade="<?= !empty($produto['disponivel']) ? 'available' : 'unavailable' ?>">
                                <td>
                                    <span class="product-name-cell">
                                    <?php if (!empty($produto['imagem'])): ?>
                                        <img class="product-thumbnail" src="<?= htmlspecialchars($produto['imagem'], ENT_QUOTES, 'UTF-8') ?>" alt="Imagem de <?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>" loading="lazy">
                                    <?php else: ?>
                                        <span class="product-thumbnail product-thumbnail-empty" aria-hidden="true"><i class="fa-regular fa-image"></i></span>
                                    <?php endif; ?>
                                    <span><?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?></span>
                                    </span>
                                </td>
                                <td><?= htmlspecialchars($produto['categoria'] ?? '—', ENT_QUOTES, 'UTF-8') ?></td>
                                <td><?= htmlspecialchars($produto['restaurante'] ?? '—', ENT_QUOTES, 'UTF-8') ?></td>
                                <td><?= htmlspecialchars((string) $produto['preco'], ENT_QUOTES, 'UTF-8') ?> Kz</td>
                                <td><?= htmlspecialchars($produto['criado_em'] ?? '—', ENT_QUOTES, 'UTF-8') ?></td>
                                <td><span class="badge order-status <?= !empty($produto['disponivel']) ? 'active' : 'inactive' ?>"><span class="badge-dot" aria-hidden="true"></span><?= !empty($produto['disponivel']) ? 'Disponível' : 'Indisponível' ?></span></td>
                                <td class="product-actions">
                                    <button type="button" class="btn-edit-product" title="Editar <?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>" aria-label="Editar produto <?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i></button>
                                    <button type="button" class="btn-delete-product" title="Eliminar <?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>" aria-label="Eliminar produto <?= htmlspecialchars($produto['nome'], ENT_QUOTES, 'UTF-8') ?>"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>

                </table>


                <div class="table-bottom">

                    <p>
                        <span class="pagination-summary" aria-live="polite"></span>
                    </p>


                    <div class="btn-section-container">

                        <div class="pagination-buttons" aria-label="Paginação de produtos"></div>

                    </div>

                </div>

            </article>

        </section>



<!-- =====================================================
     MODAL — ADICIONAR / EDITAR PRODUTO
====================================================== -->

        <dialog class="modal" id="modal-product">
            <div class="mensagem" id="mensagem" role="status" aria-live="polite" hidden>
            <span class="mensagem-icone" aria-hidden="true"></span>
            <p class="mensagem-texto"></p>

            <button
                type="button"
                class="mensagem-fechar"
                aria-label="Fechar notificação"
            >
                &times;
            </button>
            </div>

            <form
                id="product-form"
                action="processar-produtos.php"
                method="post"
                enctype="multipart/form-data"
            >

                <!-- Identificador para edição com PHP -->
                <input type="hidden" name="id" id="produto-id" value="">

                <div class="product-modal-head">

                    <div class="product-modal-title">
                        <h2>Adicionar produto</h2>

                        <p>
                            Preencha os detalhes para manter o cardápio atualizado.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="product-modal-close"
                        id="btn-close-modal-top"
                        aria-label="Fechar modal"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                </div>

                <!-- INFORMAÇÕES DO PRODUTO -->

                <div class="product-modal-section product-modal-info">

                    <p class="product-modal-eyebrow">
                        INFORMAÇÕES DO PRODUTO
                    </p>

                    <div class="product-modal-fields">

                        <div class="product-modal-field">
                            <label for="nome-produto">Nome do produto*</label>

                            <input
                                type="text"
                                name="nome-produto"
                                id="nome-produto"
                                required
                                maxlength="150"
                            >
                        </div>

                        <div class="product-modal-field">
                            <label for="preco-produto">Preço (Kz)*</label>

                            <input
                                type="number"
                                name="preco-produto"
                                id="preco-produto"
                                required
                                min="0"
                                step="1"
                            >
                        </div>

                        <div class="product-modal-field">
                            <label for="categoria-produto">Categoria*</label>

                            <select
                                name="categoria_id"
                                id="categoria-produto"
                                required
                            >
                                <option value="">Selecione uma categoria</option>
                                <?php foreach ($categorias as $categoria): ?>
                                    <option value="<?= (int) $categoria['id'] ?>"><?= htmlspecialchars($categoria['nome'], ENT_QUOTES, 'UTF-8') ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="product-modal-field">
                            <label for="restaurante-produto">Restaurante*</label>

                            <select
                                name="restaurante_id"
                                id="restaurante-produto"
                                required
                            >
                                <option value="">Selecione um restaurante</option>
                                <?php foreach ($restaurantes as $restaurante): ?>
                                    <option value="<?= (int) $restaurante['id'] ?>"><?= htmlspecialchars($restaurante['nome'], ENT_QUOTES, 'UTF-8') ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="product-modal-field product-modal-field-full">
                            <label for="descricao-produto">Descrição</label>

                            <textarea
                                name="descricao-produto"
                                id="descricao-produto"
                                rows="4"
                                maxlength="2000"
                                placeholder="Descreva os ingredientes e o que torna esse prato especial..."
                            ></textarea>
                        </div>

                    </div>

                </div>

                <!-- APRESENTAÇÃO E DISPONIBILIDADE -->

                <div class="product-modal-section product-modal-presentation">

                    <p class="product-modal-eyebrow">
                        APRESENTAÇÃO E DISPONIBILIDADE
                    </p>

                    <div class="product-upload">

                        <div class="product-upload-info">

                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.7"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                <circle cx="8" cy="8" r="1.5"></circle>
                                <path d="m3 17 5-5 4 4 3-3 6 6"></path>
                            </svg>

                            <strong>Escolha uma imagem para o produto</strong>

                            <span>JPG, PNG ou WebP, até 5 MB</span>

                        </div>

                        <label class="product-upload-button">

                            <span>Selecionar imagem</span>

                            <input
                                type="file"
                                name="imagem-produto"
                                id="imagem-produto"
                                accept="image/jpeg,image/png,image/webp"
                            >

                        </label>

                    </div>

                    <p class="product-upload-help">
                        A imagem é opcional. Ao editar, deixe vazio para manter a imagem atual.
                    </p>

                    <div class="product-availability">

                        <div class="product-availability-info">
                            <p>Produto disponível</p>

                            <span>
                                O produto poderá ser pedido pelos clientes.
                            </span>
                        </div>

                        <label class="product-switch">

                            <input
                                type="checkbox"
                                name="produto-disponivel"
                                class="product-switch-input"
                                id="produto-disponivel"
                                value="1"
                                aria-label="Produto disponível"
                            >

                            <span class="product-switch-slider"></span>

                        </label>

                    </div>

                </div>

                <!-- AÇÕES -->

                <div class="product-modal-actions">

                    <button
                        type="button"
                        class="product-modal-cancel"
                        id="btn-cancel-edit"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="product-modal-save"
                        id="btn-save-product"
                    >
                        <i class="fa-solid fa-check"></i>

                        <span>Guardar produto</span>
                    </button>

                </div>

            </form>

        </dialog>



    


    </main>
    <script src="assets/scripts/mensagem.js"></script>
    <script src="assets/scripts/produtos.js"></script>
</div>
    


    <!-- =====================================================
         JAVASCRIPT
    ====================================================== -->

    <script src="assets/scripts/main.js"></script>
    <script src="assets/scripts/mensagem.js"></script>


</body>

</html>

