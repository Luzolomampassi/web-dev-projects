(() => {
  "use strict";
  const state = {
    games: [],
    collections: [],
    memberships: [],
    page: "dashboard",
    view: "grid",
    search: "",
    user: window.APP_CONFIG.user,
    friends: { friends: [], incoming: [], outgoing: [], results: [] },
    friendTab: "friends",
    chatFriends: [],
    chatWith: 0,
    chatLastId: 0,
    chatMessages: [],
    chatSSE: null,
    presenceSSE: null,
    presence: {},
    typingTimer: null,
    chatGroups: [],
    currentGroup: 0,
    groupMessages: [],
    voiceCall: null,
    localStream: null,
    peerConnection: null,
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const statusLabels = {
    backlog: "Por jogar",
    playing: "A jogar",
    completed: "Concluído",
    paused: "Em pausa",
    abandoned: "Abandonado",
  };
  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  async function request(url, options = {}) {
    const response = await fetch(url, options);
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error(
        `O servidor respondeu com conteúdo inválido (HTTP ${response.status}) ao aceder a ${url}. Confirma se os ficheiros da API foram publicados.`,
      );
    }
    if (!response.ok) {
      const error = new Error(body.error || "A operação não foi concluída.");
      error.status = response.status;
      throw error;
    }
    return body;
  }
  async function load() {
    try {
      const data = await request("api/games.php");
      state.games = data.games;
      state.collections = data.collections;
      state.memberships = data.memberships;
      render();
    } catch (error) {
      if (error.status === 401) {
        location.href = "index.php";
        return;
      }
      toast(error.message);
      $(".game-grid").innerHTML = empty(
        "A ligação à base de dados não está pronta",
        "Cria uma base de dados MySQL no alojamento e configura config.php para começar.",
      );
    }
  }
  function empty(title, text, button = false) {
    return `<div class="empty-state"><div><div class="empty-icon">✦</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>${button ? '<button class="button button-primary" data-add>＋ Adicionar jogo</button>' : ""}</div></div>`;
  }
  function cover(game) {
    const src = game.cover_path
      ? `uploads/${encodeURIComponent(game.cover_path)}`
      : game.steam_app_id
        ? `https://cdn.akamai.steamstatic.com/steam/apps/${Number(game.steam_app_id)}/header.jpg`
        : "";
    return src
      ? `<img src="${src}" alt="Capa de ${escapeHtml(game.title)}" loading="lazy">`
      : `<div class="cover-placeholder" aria-label="Sem capa">${escapeHtml(game.title.slice(0, 1).toUpperCase())}</div>`;
  }
  function card(game, compact = false) {
    const meta =
      [game.platform, game.genre].filter(Boolean).join(" · ") ||
      "Sem plataforma ou género";
    const detail = game.hours ? `${game.hours} h` : "Sem registo de horas";
    const rating =
      game.rating !== null ? `★ ${Number(game.rating).toFixed(1)}` : "";
    return `<article class="game-card" data-id="${game.id}"><div class="cover-wrap">${cover(game)}<span class="game-status status-${game.status}">${statusLabels[game.status]}</span><button class="favorite-toggle ${game.favorite ? "on" : ""}" data-favorite="${game.id}" aria-label="${game.favorite ? "Remover dos" : "Adicionar aos"} favoritos">${game.favorite ? "♥" : "♡"}</button></div><div class="card-info"><h3 class="card-title" title="${escapeHtml(game.title)}">${escapeHtml(game.title)}</h3><div class="card-meta">${escapeHtml(meta)}</div><div class="card-foot"><span>${detail}</span><span class="card-rating">${rating}</span><span class="card-actions"><button class="card-action" data-edit="${game.id}">Editar</button><button class="card-action" data-delete="${game.id}">Remover</button></span></div></div></article>`;
  }
  function setEmptyOrCards(
    target,
    games,
    title,
    text,
    button = false,
    compact = false,
  ) {
    $(target).innerHTML = games.length
      ? games.map((game) => card(game, compact)).join("")
      : empty(title, text, button);
  }
  function filteredGames() {
    let games = state.games.filter((game) => !game.is_wishlist);
    const search = ($("#library-search")?.value || state.search)
      .trim()
      .toLocaleLowerCase();
    const platform = $("#filter-platform")?.value || "",
      genre = $("#filter-genre")?.value || "",
      status = $("#filter-status")?.value || "";
    if (search)
      games = games.filter((g) =>
        `${g.title} ${g.platform} ${g.genre}`
          .toLocaleLowerCase()
          .includes(search),
      );
    if (platform) games = games.filter((g) => g.platform === platform);
    if (genre) games = games.filter((g) => g.genre === genre);
    if (status) games = games.filter((g) => g.status === status);
    const sort = $("#sort-games")?.value || "recent";
    games.sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "rating"
          ? (b.rating ?? -1) - (a.rating ?? -1)
          : sort === "hours"
            ? b.hours - a.hours
            : new Date(b.created_at) - new Date(a.created_at),
    );
    return games;
  }
  function updateFilters() {
    for (const [id, key, label] of [
      ["filter-platform", "platform", "Todas as plataformas"],
      ["filter-genre", "genre", "Todos os géneros"],
    ]) {
      const select = $("#" + id),
        previous = select.value,
        values = [
          ...new Set(
            state.games
              .filter((g) => !g.is_wishlist)
              .map((g) => g[key])
              .filter(Boolean),
          ),
        ].sort((a, b) => a.localeCompare(b));
      select.innerHTML =
        `<option value="">${label}</option>` +
        values
          .map(
            (value) =>
              `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`,
          )
          .join("");
      select.value = values.includes(previous) ? previous : "";
    }
  }
  function renderDashboard() {
    const owned = state.games.filter((g) => !g.is_wishlist),
      playing = owned.filter((g) => g.status === "playing"),
      completed = owned.filter((g) => g.status === "completed"),
      wishlist = state.games.filter((g) => g.is_wishlist);
    $("#stat-total").textContent = owned.length;
    $("#stat-playing").textContent = playing.length;
    $("#stat-completed").textContent = completed.length;
    $("#stat-wishlist").textContent = wishlist.length;
    $("#nav-total").textContent = owned.length;
    const pct = owned.length
      ? Math.round((completed.length / owned.length) * 100)
      : 0;
    $("#completion-label").textContent = pct + "%";
    $("#completion-bar").style.width = pct + "%";
    $("#completion-count").textContent =
      `${completed.length} de ${owned.length} jogos`;
    const featured = playing[0] || owned.find((g) => g.favorite) || owned[0];
    if (featured)
      $("#featured").innerHTML =
        `${featured.cover_path ? `<img class="hero-cover" src="uploads/${encodeURIComponent(featured.cover_path)}" alt="">` : ""}<div class="hero-content"><p class="eyebrow">${playing.length ? "CONTINUA A TUA AVENTURA" : "UM DOS TEUS DESTAQUES"}</p><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.description || [featured.platform, featured.genre].filter(Boolean).join(" · ") || "A tua próxima aventura está à tua espera.")}</p><button class="button button-primary" data-edit="${featured.id}">Ver e editar jogo ↗</button><span class="hero-chip">${statusLabels[featured.status]}</span></div>`;
    setEmptyOrCards(
      "#recent-grid",
      [...owned].slice(0, 4),
      "A biblioteca está à tua espera",
      "Adiciona os jogos que já tens e começa a registar o teu progresso.",
      true,
    );
    setEmptyOrCards(
      "#playing-grid",
      playing.slice(0, 4),
      "Ainda não começaste uma aventura",
      "Quando mudares o estado de um jogo para “A jogar”, ele aparece aqui.",
      false,
      true,
    );
  }
  function renderLibrary() {
    const games = filteredGames();
    $("#result-count").textContent =
      `${games.length} ${games.length === 1 ? "jogo" : "jogos"}`;
    $("#library-grid").classList.toggle("list-view", state.view === "list");
    setEmptyOrCards(
      "#library-grid",
      games,
      "Nenhum jogo encontrado",
      "Experimenta limpar os filtros ou adiciona um novo jogo.",
      true,
    );
  }
  function renderWishlist() {
    setEmptyOrCards(
      "#wishlist-grid",
      state.games.filter((g) => g.is_wishlist),
      "A tua lista está vazia",
      "Guarda aqui os jogos que queres experimentar no futuro.",
      true,
    );
  }
  function renderCollections() {
    const gamesById = new Map(state.games.map((g) => [Number(g.id), g]));
    $("#collection-grid").innerHTML = state.collections.length
      ? state.collections
          .map((c) => {
            const ids = state.memberships
              .filter((m) => Number(m.collection_id) === Number(c.id))
              .map((m) => Number(m.game_id));
            return `<article class="collection-card"><div><div class="collection-art">▤</div><h3>${escapeHtml(c.name)}</h3><p>${
              ids
                .map((id) => gamesById.get(id)?.title)
                .filter(Boolean)
                .slice(0, 3)
                .map(escapeHtml)
                .join(" · ") || "Adiciona jogos a esta coleção"
            }</p></div><div class="collection-footer"><span>${ids.length} ${ids.length === 1 ? "jogo" : "jogos"}</span><span><button data-assign="${c.id}">Adicionar jogo</button> · <button data-remove-collection="${c.id}">Apagar</button></span></div></article>`;
          })
          .join("")
      : empty(
          "Cria a tua primeira coleção",
          "Agrupa os jogos que partilham uma história, um género ou uma vontade.",
          false,
        );
  }
  let catalogSearchSerial = 0;
  async function loadCatalog(query = "", featured = false) {
    const platform = $("#catalog-platform")?.value || "steam";
    const serial = ++catalogSearchSerial;
    try {
      const url = query
        ? `api/catalog.php?platform=${encodeURIComponent(platform)}&search=${encodeURIComponent(query)}`
        : `api/catalog.php?platform=${encodeURIComponent(platform)}&featured=1`;
      const data = await request(url);
      if (serial !== catalogSearchSerial) return;
      const label = query || (featured ? `Em destaque na ${platform.charAt(0).toUpperCase() + platform.slice(1)}` : "");
      renderCatalog(data.catalog || data.results || [], label, platform);
    } catch (e) {
      $("#catalog-error").textContent = e.message;
      $("#catalog-grid").innerHTML = "";
      $("#catalog-result-count").textContent = "0 jogos";
    }
  }
  function renderCatalog(games, label = "", platform = "steam") {
    const grid = $("#catalog-grid");
    const platformLabels = { steam: "Steam", playstation: "PlayStation", xbox: "Xbox" };
    const platformLabel = platformLabels[platform] || platform;
    if (games.length) {
      grid.innerHTML = games.map((g) => {
        const cover = (g.tiny_image || g.image)
          ? `<img src="${escapeHtml(g.tiny_image || g.image)}" alt="${escapeHtml(g.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover">`
          : `<div class="cover-placeholder" aria-label="Sem capa">${escapeHtml(g.name.slice(0, 1).toUpperCase())}</div>`;
        const externalId = g.appid ?? g.id ?? g.external_id ?? 0;
        return `<article class="game-card" data-appid="${externalId}" data-platform="${platform}"><div class="cover-wrap">${cover}<span class="game-status status-backlog">${escapeHtml(platformLabel)}</span></div><div class="card-info"><h3 class="card-title" title="${escapeHtml(g.name)}">${escapeHtml(g.name)}</h3><div class="card-meta">${escapeHtml(platformLabel)} · ID ${externalId}</div><div class="card-foot"><span class="card-actions"><button class="card-action" data-add-store="${externalId}" data-platform="${platform}">Adicionar à biblioteca</button></span></div></div></article>`;
      }).join("");
      $("#catalog-result-count").textContent = `${games.length} ${games.length === 1 ? "jogo" : "jogos"}`;
    } else {
      grid.innerHTML = empty(
        label ? `Nenhum jogo encontrado para "${label}"` : "Nenhum jogo encontrado",
        "Experimenta pesquisar por outro termo ou volta mais tarde.",
        true,
      );
      $("#catalog-result-count").textContent = "0 jogos";
    }
  }
  function render() {
    updateFilters();
    renderDashboard();
    renderLibrary();
    renderWishlist();
    renderCollections();
    renderProfileStats();
  }
  function navigate(page) {
    state.page = page;
    $$(".page").forEach((el) =>
      el.classList.toggle("active", el.id === `page-${page}`),
    );
    $$(".nav-item").forEach((el) =>
      el.classList.toggle("active", el.dataset.page === page),
    );
    const names = {
      dashboard: "Visão geral",
      library: "A minha biblioteca",
      wishlist: "Lista de desejos",
      collections: "Coleções",
      catalog: "Catálogo de Lojas",
      friends: "Amigos",
      chat: "Mensagens",
      notifications: "Notificações",
      profile: "Perfil do jogador",
      settings: "Definições",
    };
    $("#breadcrumb-current").textContent = names[page] || names.dashboard;
    $("#sidebar").classList.remove("open");
    if (page === "friends") {
      loadFriends();
      loadFriendSuggestions();
    }
    if (page === "chat") {
      loadChatList();
      connectPresenceSSE();
    }
    if (page === "chat-groups") {
      loadGroups();
      if (!state.presenceSSE) connectPresenceSSE();
    }
    if (page === "notifications") loadNotifications(true);
    if (page === "catalog") loadCatalog();
  }
  const friendEscape = escapeHtml;
  function friendCard(person, mode) {
    const avatar = friendEscape(
      (person.username || "?").slice(0, 1).toLocaleUpperCase(),
    );
    let actions = "";
    if (mode === "incoming")
      actions = `<button class="button button-primary" data-friend-action="accept" data-user-id="${person.id}">Aceitar</button><button class="button button-outline" data-friend-action="decline" data-user-id="${person.id}">Recusar</button>`;
    else if (mode === "outgoing")
      actions = `<span class="friend-pending">Pedido enviado</span><button class="button button-outline" data-friend-action="cancel" data-user-id="${person.id}">Cancelar</button>`;
    else if (mode === "result" || mode === "suggested") {
      if (person.friendship_status === "accepted")
        actions = '<span class="friend-pending">Já são amigos</span>';
      else if (
        person.friendship_status === "pending" &&
        Number(person.requester_id) === Number(state.user.id)
      )
        actions = '<span class="friend-pending">Pedido enviado</span>';
      else if (person.friendship_status === "pending")
        actions = `<button class="button button-primary" data-friend-action="send" data-user-id="${person.id}">Aceitar pedido</button>`;
      else
        actions = `<button class="button button-primary" data-friend-action="send" data-user-id="${person.id}">Adicionar amigo</button>`;
    } else
      actions = `<button class="button button-outline" data-view-friend="${person.id}">Ver perfil</button><button class="button button-outline" data-friend-action="remove" data-user-id="${person.id}">Remover</button>`;
    return `<article class="friend-card"><div class="avatar friend-avatar">${avatar}</div><div class="friend-card-copy"><strong>${friendEscape(person.username)}</strong><p class="player-id">ID: <strong>${friendEscape(person.public_id || "—")}</strong></p><p>${friendEscape(person.bio || "Jogador Arcadia")}</p></div><div class="friend-card-actions">${actions}</div></article>`;
  }
  function renderFriends() {
    const f = state.friends;
    $("#friends-total").textContent = f.friends.length;
    $("#requests-total").textContent = f.incoming.length;
    const badge = $("#friend-request-count");
    badge.textContent = f.incoming.length;
    badge.hidden = !f.incoming.length;
    $$(".friend-tab").forEach((b) =>
      b.classList.toggle("active", b.dataset.friendTab === state.friendTab),
    );
    const target = $("#friends-list");
    if (state.friendTab === "requests") {
      const all = [
        ...f.incoming.map((p) => friendCard(p, "incoming")),
        ...f.outgoing.map((p) => friendCard(p, "outgoing")),
      ];
      target.innerHTML =
        all.join("") ||
        empty(
          "Sem pedidos de amizade",
          "Os pedidos recebidos e enviados vão aparecer aqui.",
        );
    } else
      target.innerHTML =
        f.friends.map((p) => friendCard(p, "friend")).join("") ||
        empty(
          "Ainda não tens amigos",
          "Pesquisa por um nome de jogador para enviar um pedido.",
        );
    $("#friend-search-results").innerHTML = f.results
      .map((p) => friendCard(p, "result"))
      .join("");
  }
  let friendSearchSerial = 0;
  async function loadFriends(query = "") {
    const serial = query ? ++friendSearchSerial : 0;
    try {
      const url = query
        ? `api/friends.php?q=${encodeURIComponent(query)}`
        : "api/friends.php";
      const data = await request(url);
      if (query) {
        if (serial !== friendSearchSerial) return;
        state.friends.results = data.results || [];
        $("#friend-search-status").textContent = state.friends.results.length
          ? `${state.friends.results.length} jogador(es) encontrado(s).`
          : "Nenhum jogador encontrado com esse nome ou ID.";
      } else
        state.friends = {
          ...state.friends,
          ...data,
          results: state.friends.results,
        };
      renderFriends();
    } catch (e) {
      if (e.status === 401) location.href = "index.php";
      else if (query && serial === friendSearchSerial)
        $("#friend-search-status").textContent = e.message;
      else toast(e.message);
    }
  }
  async function loadFriendSuggestions() {
    try {
      const data = await request("api/friends.php?suggested=1");
      $("#friend-suggestions").innerHTML =
        (data.results || []).map((p) => friendCard(p, "suggested")).join("") ||
        empty(
          "Sem sugestões por agora",
          "Volta mais tarde para encontrar jogadores.",
        );
    } catch (e) {
      if (e.status !== 401)
        $("#friend-suggestions").innerHTML = empty(
          "Sugestões indisponíveis",
          e.message,
        );
    }
  }
  async function loadFriendProfile(id) {
    const panel = $("#friend-profile");
    panel.hidden = false;
    panel.innerHTML = '<p class="subheading">A carregar perfil…</p>';
    try {
      const data = await request(
        `api/friends.php?profile=${encodeURIComponent(id)}`,
      );
      const p = data.profile;
      const games = data.games
        .map(
          (g) =>
            `<article class="friend-game"><div><strong>${friendEscape(g.title)}</strong><span>${friendEscape([g.platform, g.genre].filter(Boolean).join(" · ") || "Plataforma não indicada")}</span></div><span class="game-status status-${g.status}">${statusLabels[g.status]}</span></article>`,
        )
        .join("");
      const collections = data.collections
        .map(
          (c) =>
            `<span class="friend-collection">${friendEscape(c.name)} · ${c.game_count} jogos</span>`,
        )
        .join("");
      panel.innerHTML = `<button class="text-button friend-back" id="friend-profile-back">← Voltar aos amigos</button><div class="friend-profile-heading"><div class="avatar friend-avatar">${friendEscape(p.username.slice(0, 1).toLocaleUpperCase())}</div><div><h2>${friendEscape(p.username)}</h2><p class="player-id">ID: <strong>${friendEscape(p.public_id || "—")}</strong></p><p>${friendEscape(p.bio || "Jogador Arcadia")}</p></div></div><h3>Jogos e progresso</h3><div class="friend-games">${games || '<p class="friend-hint">Ainda não há jogos partilhados neste perfil.</p>'}</div><h3>Coleções</h3><div class="friend-collections">${collections || '<p class="friend-hint">Este jogador ainda não criou coleções.</p>'}</div>`;
    } catch (e) {
      panel.innerHTML = `<p class="form-error">${friendEscape(e.message)}</p><button class="text-button friend-back" id="friend-profile-back">← Voltar aos amigos</button>`;
    }
  }
  let friendSearchTimer;
  function updateNotificationBadge(count) {
    const badge = $("#notification-count");
    badge.textContent = count;
    badge.hidden = !count;
  }
  async function loadNotifications(render = true) {
    try {
      const data = await request("api/notifications.php");
      updateNotificationBadge(Number(data.unread || 0));
      if (!render) return;
      const labels = {
        friend_request: "Pedido de amizade",
        friend_accepted: "Amizade aceite",
        message: "Mensagem",
      };
      $("#notifications-list").innerHTML = data.notifications.length
        ? data.notifications
            .map(
              (n) =>
                `<button class="notification-item ${Number(n.is_read) ? "" : "unread"}" data-open-notification="${n.id}" data-notification-type="${n.type}" data-actor-id="${n.actor_id || ""}"><span class="notification-icon">${n.type === "message" ? "✉" : n.type === "friend_request" ? "♧" : "✓"}</span><span class="notification-copy"><strong>${escapeHtml(labels[n.type] || "Notificação")}</strong><span>${escapeHtml(n.body)}</span><small>${n.actor_name ? escapeHtml(n.actor_name) + " · " : ""}${escapeHtml(n.created_at)}</small></span><span class="notification-dot" aria-hidden="true"></span></button>`,
            )
            .join("")
        : empty(
            "Sem notificações",
            "Os novos pedidos de amizade e mensagens vão aparecer aqui.",
          );
    } catch (e) {
      if (e.status !== 401) toast(e.message);
    }
  }
  async function markNotification(action, id = "") {
    const form = new FormData();
    form.set("action", action);
    if (id) form.set("id", id);
    const data = await post("api/notifications.php", form);
    if (data.unread !== undefined) updateNotificationBadge(Number(data.unread));
    else updateNotificationBadge(0);
  }

  // --- SSE para mensagens em tempo real (substitui polling) ---
  function connectChatSSE(withUserId) {
    if (state.chatSSE) {
      state.chatSSE.close();
      state.chatSSE = null;
    }
    const es = new EventSource(`api/chat-sse.php?with=${withUserId}`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence') return; // ignora eventos de presença aqui
        state.chatMessages.push(data);
        state.chatLastId = Number(data.id);
        renderChatMessages();
        if (data.mine !== true && document.visibilityState !== 'visible') {
          showDesktopNotification(data);
        }
        loadChatList();
        loadNotifications(false);
      } catch (e) {
        // ignora mensagens malformadas
      }
    };
    es.onerror = () => {
      es.close();
      state.chatSSE = null;
      // Reconectar após 5s se ainda estiver na conversa
      if (state.chatWith === withUserId) {
        setTimeout(() => connectChatSSE(withUserId), 5000);
      }
    };
    state.chatSSE = es;
    return es;
  }

  // --- SSE para presença (online/typing) dos amigos ---
  function connectPresenceSSE() {
    if (state.presenceSSE) {
      state.presenceSSE.close();
      state.presenceSSE = null;
    }
    const es = new EventSource('api/presence-sse.php');
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'presence') return;
        state.presence[data.user_id] = {
          is_online: data.is_online,
          last_seen: data.last_seen,
          is_typing: data.is_typing,
        };
        renderChatList();
        if (state.chatWith === data.user_id) {
          renderChatHeaderTyping();
        }
      } catch (e) {
        // ignora
      }
    };
    es.onerror = () => {
      es.close();
      state.presenceSSE = null;
      setTimeout(connectPresenceSSE, 5000);
    };
    state.presenceSSE = es;
    return es;
  }

  function disconnectSSEs() {
    if (state.chatSSE) {
      state.chatSSE.close();
      state.chatSSE = null;
    }
    if (state.presenceSSE) {
      state.presenceSSE.close();
      state.presenceSSE = null;
    }
  }

  // --- Indicador de "digitando..." ---
  function sendTyping(isTyping) {
    const form = new FormData();
    form.set("action", "typing");
    form.set("is_typing", isTyping ? "1" : "0");
    if (state.chatWith) form.set("recipient_id", state.chatWith);
    post("api/presence.php", form).catch(() => {});
  }

  function renderChatHeaderTyping() {
    if (!state.chatWith) return;
    const presence = state.presence[state.chatWith];
    const typingText = presence && presence.is_typing ? "está a escrever…" : "";
    const typingEl = $("#chat-header-typing");
    if (typingEl) {
      typingEl.textContent = typingText;
      typingEl.hidden = !typingText;
    }
  }

  // --- Notificações de desktop ---
  async function requestDesktopPermission() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  function showDesktopNotification(message) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification(message.friend?.username || "Nova mensagem", {
      body: message.body,
      icon: "favicon.ico",
      tag: `chat-${message.sender_id}`,
    });
  }

  async function loadChatList() {
    try {
      const data = await request("api/chat.php");
      state.chatFriends = data.friends || [];
      const unread = state.chatFriends.reduce(
        (sum, f) => sum + Number(f.unread || 0),
        0,
      );
      const badge = $("#chat-unread-count");
      badge.textContent = unread;
      badge.hidden = !unread;
      $("#chat-contacts").innerHTML = state.chatFriends.length
        ? state.chatFriends
            .map(
              (f) => {
                const pres = state.presence[f.id] || {};
                const isTyping = pres.is_typing ? " <span class=" + "'" + "typing-badge" + "'" + ">está a escrever…</span>" : "";
                const statusClass = pres.is_online ? "online" : "offline";
                return `<button class="chat-contact ${Number(f.id) === state.chatWith ? "active" : ""}" data-chat-user="${f.id}"><span class="avatar friend-avatar ${statusClass}">${escapeHtml(f.username.slice(0, 1).toLocaleUpperCase())}</span><span class="chat-contact-copy"><strong>${escapeHtml(f.username)}</strong><small>${escapeHtml(f.last_message?.body || "Começa uma conversa")}${isTyping}</small></span>${f.unread ? `<span class="chat-unread">${f.unread}</span>` : ""}</button>`;
              },
            )
            .join("")
        : empty(
            "Ainda sem amigos",
            "Adiciona amigos para poderes conversar com eles.",
          );
    } catch (e) {
      if (e.status !== 401) toast(e.message);
    }
  }
  function renderChatMessages() {
    const box = $("#chat-messages");
    box.innerHTML = state.chatMessages
      .map(
        (m) =>
          `<article class="chat-bubble ${Number(m.sender_id) === Number(state.user.id) ? "mine" : "theirs"}"><p>${escapeHtml(m.body)}</p><time>${escapeHtml(m.created_at)}</time></article>`,
      )
      .join("");
    box.scrollTop = box.scrollHeight;
  }
  async function loadConversation(id, incremental = false) {
    const chatId = Number(id);
    try {
      const suffix =
        incremental && state.chatLastId ? `&after=${state.chatLastId}` : "";
      const data = await request(`api/chat.php?with=${chatId}${suffix}`);
      if (state.chatWith !== chatId) return;
      if (!incremental) {
        state.chatMessages = data.messages || [];
        state.chatLastId = state.chatMessages.length
          ? Number(state.chatMessages.at(-1).id)
          : 0;
        $("#chat-header").innerHTML =
          `<span class="avatar friend-avatar">${escapeHtml(data.friend.username.slice(0, 1).toLocaleUpperCase())}</span><strong>${escapeHtml(data.friend.username)}</strong>`;
        $("#chat-header").hidden = false;
        $("#chat-empty").hidden = true;
        $("#chat-form").hidden = false;
      } else if (data.messages?.length) {
        state.chatMessages.push(...data.messages);
        state.chatLastId = Number(data.messages.at(-1).id);
      }
      if (!incremental || data.messages?.length) renderChatMessages();
      await loadChatList();
      await loadNotifications(false);
    } catch (e) {
      if (!incremental) toast(e.message);
    }
  }
  async function openChat(id) {
    state.chatWith = Number(id);
    state.chatLastId = 0;
    state.chatMessages = [];
    $("#chat-messages").innerHTML = "";
    $("#chat-form").hidden = true;
    $("#chat-header").hidden = true;
    $("#chat-empty").hidden = false;
    $("#chat-empty").textContent = "A carregar conversa…";
    await loadChatList();
    await loadConversation(state.chatWith, false);
    connectChatSSE(state.chatWith);
  }
  $("#chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.chatWith) return;
    const input = $("#chat-input");
    const body = input.value.trim();
    if (!body) return;
    const button = event.currentTarget.querySelector("button");
    button.disabled = true;
    const form = new FormData();
    form.set("recipient_id", state.chatWith);
    form.set("body", body);
    try {
      const data = await post("api/chat.php", form);
      state.chatMessages.push(data.message);
      state.chatLastId = Number(data.message.id);
      input.value = "";
      renderChatMessages();
      await loadChatList();
      await loadNotifications(false);
    } catch (e) {
      toast(e.message);
    } finally {
      button.disabled = false;
      input.focus();
      sendTyping(false);
    }
  });

  // Indicador de "digitando..."
  $("#chat-input").addEventListener("input", () => {
    if (!state.chatWith) return;
    sendTyping(true);
    if (state.typingTimer) clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(() => sendTyping(false), 3000);
  });
  $("#mark-notifications-read").addEventListener("click", async () => {
    try {
      await markNotification("read-all");
      await loadNotifications(true);
    } catch (e) {
      toast(e.message);
    }
  });
  document.addEventListener("click", async (event) => {
    const contact = event.target.closest("[data-chat-user]");
    if (contact) {
      await openChat(contact.dataset.chatUser);
      return;
    }
    const notification = event.target.closest("[data-open-notification]");
    if (notification) {
      const type = notification.dataset.notificationType,
        actor = Number(notification.dataset.actorId);
      try {
        await markNotification("read", notification.dataset.openNotification);
        await loadNotifications(true);
        if (type === "message" && actor) {
          navigate("chat");
          await openChat(actor);
        } else if (type === "friend_request") {
          state.friendTab = "requests";
          navigate("friends");
        } else navigate("friends");
      } catch (e) {
        toast(e.message);
      }
    }
  });
  let notificationPoll = 0;
  setInterval(() => {
    if (state.page === "chat") {
      // Usa SSE para mensagens em tempo real; apenas atualiza lista de contatos
      if (!state.chatWith) loadChatList();
    } else if (++notificationPoll % 3 === 0) {
      loadNotifications(false);
      // Conectar presença SSE quando não está na página de chat
      if (!state.presenceSSE) connectPresenceSSE();
    }
  }, 5000);

  // Solicitar permissão de notificações desktop ao carregar
  requestDesktopPermission();
  const friendSearch = $("#friend-search");
  function runFriendSearch() {
    clearTimeout(friendSearchTimer);
    const query = friendSearch.value.trim();
    if (query.length < 2) {
      friendSearchSerial++;
      state.friends.results = [];
      $("#friend-search-status").textContent = query
        ? "Escreve pelo menos 2 caracteres."
        : "";
      renderFriends();
      return;
    }
    state.friends.results = [];
    renderFriends();
    $("#friend-search-status").textContent = "A pesquisar…";
    loadFriends(query);
  }
  friendSearch.addEventListener("input", () => {
    clearTimeout(friendSearchTimer);
    friendSearchTimer = setTimeout(runFriendSearch, 180);
  });
  friendSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runFriendSearch();
    }
  });
  friendSearch.addEventListener("search", runFriendSearch);
  document.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-friend-tab]");
    if (tab) {
      state.friendTab = tab.dataset.friendTab;
      renderFriends();
      return;
    }
    if (event.target.closest("#friend-profile-back")) {
      $("#friend-profile").hidden = true;
      return;
    }
    const profile = event.target.closest("[data-view-friend]");
    if (profile) {
      await loadFriendProfile(profile.dataset.viewFriend);
      return;
    }
    const action = event.target.closest("[data-friend-action]");
    if (action) {
      const verb = action.dataset.friendAction,
        id = action.dataset.userId;
      const labels = {
        send: "Enviar pedido de amizade?",
        accept: "Aceitar pedido?",
        decline: "Recusar pedido?",
        cancel: "Cancelar pedido?",
        remove: "Remover este amigo?",
      };
      if (
        ["decline", "cancel", "remove"].includes(verb) &&
        !confirm(labels[verb])
      )
        return;
      const form = new FormData();
      form.set("action", verb);
      form.set("user_id", id);
      try {
        const actionResult = await post("api/friends.php", form);
        const searchQuery = $("#friend-search").value.trim();
        await loadFriends();
        await loadFriendSuggestions();
        if (searchQuery.length >= 2) await loadFriends(searchQuery);
        await loadNotifications(false);
        if (!$("#friend-profile").hidden) $("#friend-profile").hidden = true;
        toast(
          actionResult.message ||
            (verb === "send"
              ? "Pedido enviado."
              : verb === "accept"
                ? "Pedido aceite."
                : verb === "remove"
                  ? "Amigo removido."
                  : "Pedido atualizado."),
        );
      } catch (e) {
        toast(e.message);
      }
    }
  });
  function openModal(game = null, wishlist = false) {
    const form = $("#game-form");
    form.reset();
    form.elements.id.value = game?.id || "";
    form.elements.csrf.value = window.APP_CONFIG.csrf;
    $("#form-error").textContent = "";
    $("#modal-title").textContent = game ? "Editar jogo" : "Adicionar jogo";
    $("#save-game").textContent = game ? "Guardar alterações" : "Guardar jogo";
    if (game) {
      for (const key of [
        "title",
        "platform",
        "genre",
        "status",
        "hours",
        "rating",
        "release_date",
        "description",
        "notes",
      ])
        form.elements[key].value = game[key] ?? "";
      form.elements.favorite.checked = game.favorite;
      form.elements.is_wishlist.checked = game.is_wishlist;
      // Marcar coleções a que o jogo já pertence
      const gameCollectionIds = state.memberships
        .filter((m) => Number(m.game_id) === Number(game.id))
        .map((m) => Number(m.collection_id));
      for (const opt of form.elements.collections) {
        opt.checked = gameCollectionIds.includes(Number(opt.value));
      }
    } else {
      form.elements.is_wishlist.checked = wishlist || state.page === "wishlist";
      // Desmarcar todas as coleções ao adicionar novo
      for (const opt of form.elements.collections) {
        opt.checked = false;
      }
    }
    // Popular select de coleções
    const collectionsSelect = $("#modal-collections");
    collectionsSelect.innerHTML = state.collections
      .map(
        (c) =>
          `<option value="${c.id}">${escapeHtml(c.name)}</option>`
      )
      .join("");
    const modal = $("#game-modal");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => form.elements.title.focus(), 30);
  }
  function closeModal() {
    const modal = $("#game-modal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
  async function post(url, data) {
    data.append("csrf", window.APP_CONFIG.csrf);
    return request(url, {
      method: "POST",
      body: data,
      headers: { "X-CSRF-Token": window.APP_CONFIG.csrf },
    });
  }
  function gameById(id) {
    return state.games.find((g) => Number(g.id) === Number(id));
  }
  const profileForm = $("#profile-form"),
    settingsForm = $("#settings-form"),
    passwordForm = $("#password-form");
  function updateProfile(user) {
    state.user = user;
    $("#sidebar-username").textContent = user.username;
    $("#sidebar-avatar").textContent = user.username
      .slice(0, 1)
      .toLocaleUpperCase();
    $("#sidebar-player-id").textContent = user.public_id || "ID indisponível";
    $("#profile-name").textContent = user.username;
    $("#profile-avatar").textContent = user.username
      .slice(0, 1)
      .toLocaleUpperCase();
    $("#profile-email").textContent = user.email;
    $("#profile-bio-preview").textContent =
      user.bio || "Ainda não adicionaste uma descrição.";
    $("#profile-public-id").innerHTML =
      `ID Arcadia: <strong>${escapeHtml(user.public_id || "ID indisponível")}</strong>`;
    profileForm.elements.username.value = user.username;
    profileForm.elements.bio.value = user.bio || "";
  }
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(profileForm);
    f.set("action", "profile");
    try {
      const data = await post("api/auth.php", f);
      updateProfile(data.user);
      toast("Perfil atualizado.");
    } catch (err) {
      $("#profile-error").textContent = err.message;
    }
  });
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const theme = settingsForm.elements.theme.value;
    const f = new FormData();
    f.set("action", "settings");
    f.set("theme", theme);
    try {
      await post("api/auth.php", f);
      document.body.classList.toggle("theme-light", theme === "light");
      document.body.classList.toggle("theme-dark", theme === "dark");
      localStorage.setItem("arcadia-theme", theme);
      toast("Definições guardadas.");
    } catch (err) {
      toast(err.message);
    }
  });
  $("#export-data").addEventListener("click", async () => {
    const error = $("#backup-error");
    error.textContent = "";
    try {
      const response = await fetch("api/backup.php");
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Não foi possível exportar os dados.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `arcadia-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast("Cópia dos dados descarregada.");
    } catch (e) {
      error.textContent = e.message;
    }
  });
  $("#import-data").addEventListener("change", async (event) => {
    const file = event.target.files[0],
      error = $("#backup-error");
    error.textContent = "";
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error("O ficheiro excede 20 MB.");
      const backup = JSON.parse(await file.text());
      if (backup.format !== "arcadia-backup")
        throw new Error("Escolhe um ficheiro de cópia do Arcadia.");
      if (
        !confirm(
          "Importar esta cópia vai substituir todos os jogos e coleções atuais. Queres continuar?",
        )
      )
        return;
      const form = new FormData();
      form.set("backup", JSON.stringify(backup));
      const result = await post("api/backup.php", form);
      await load();
      toast("Coleção importada.");
    } catch (e) {
      error.textContent = e.message;
    } finally {
      event.target.value = "";
    }
  });
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(passwordForm);
    f.set("action", "password");
    try {
      await post("api/auth.php", f);
      passwordForm.reset();
      toast("Palavra-passe atualizada.");
    } catch (err) {
      $("#password-error").textContent = err.message;
    }
  });
  async function logout() {
    const f = new FormData();
    f.set("action", "logout");
    try {
      await post("api/auth.php", f);
    } finally {
      location.href = "index.php";
    }
  }
  $("#logout").addEventListener("click", logout);
  $("#settings-logout").addEventListener("click", logout);
  function renderProfileStats() {
    const owned = state.games.filter((g) => !g.is_wishlist);
    $("#profile-total").textContent = owned.length;
    $("#profile-hours").textContent = owned
      .reduce((sum, g) => sum + Number(g.hours || 0), 0)
      .toLocaleString("pt-PT");
    $("#profile-completed").textContent = owned.filter(
      (g) => g.status === "completed",
    ).length;
    $("#profile-collections").textContent = state.collections.length;
  }
  document.addEventListener("click", async (event) => {
    const nav = event.target.closest("[data-page]");
    if (nav) {
      navigate(nav.dataset.page);
      return;
    }
    const go = event.target.closest("[data-go]");
    if (go) {
      navigate(go.dataset.go);
      return;
    }
    if (event.target.closest("[data-add]")) {
      openModal(null, event.target.closest("[data-wishlist]") !== null);
      return;
    }
    if (event.target.closest("[data-close]")) {
      closeModal();
      return;
    }
    const edit = event.target.closest("[data-edit]");
    if (edit) {
      const game = gameById(edit.dataset.edit);
      if (game) openModal(game);
      return;
    }
    const favorite = event.target.closest("[data-favorite]");
    if (favorite) {
      try {
        const form = new FormData();
        form.set("action", "toggle-favorite");
        form.set("id", favorite.dataset.favorite);
        await post("api/games.php", form);
        await load();
      } catch (e) {
        toast(e.message);
      }
      return;
    }
    const del = event.target.closest("[data-delete]");
    if (del) {
      const game = gameById(del.dataset.delete);
      if (
        !game ||
        !confirm(`Queres remover “${game.title}” da tua biblioteca?`)
      )
        return;
      try {
        const form = new FormData();
        form.set("action", "delete");
        form.set("id", game.id);
        await post("api/games.php", form);
        toast("Jogo removido.");
        await load();
      } catch (e) {
        toast(e.message);
      }
      return;
    }
    const addCollection = event.target.closest("#add-collection");
    if (addCollection) {
      const name = prompt("Nome da nova coleção:");
      if (!name?.trim()) return;
      try {
        const f = new FormData();
        f.set("name", name.trim());
        await post("api/collections.php", f);
        toast("Coleção criada.");
        await load();
      } catch (e) {
        toast(e.message);
      }
      return;
    }
    const removeCollection = event.target.closest("[data-remove-collection]");
    if (removeCollection) {
      const collection = state.collections.find(
        (c) =>
          Number(c.id) === Number(removeCollection.dataset.removeCollection),
      );
      if (!collection || !confirm(`Apagar a coleção “${collection.name}”?`))
        return;
      try {
        const f = new FormData();
        f.set("action", "delete");
        f.set("id", collection.id);
        await post("api/collections.php", f);
        await load();
        toast("Coleção apagada.");
      } catch (e) {
        toast(e.message);
      }
      return;
    }
    const assign = event.target.closest("[data-assign]");
    if (assign) {
      if (!state.games.length) {
        toast("Adiciona primeiro um jogo à biblioteca.");
        return;
      }
      const collection = state.collections.find(
        (c) => Number(c.id) === Number(assign.dataset.assign),
      );
      const options = state.games
        .map((g, i) => `${i + 1}. ${g.title}`)
        .join("\n");
      const choice = Number(
        prompt(
          `Adicionar um jogo a “${collection.name}”:\n${options}\n\nEscreve o número do jogo:`,
        ),
      );
      const game = state.games[choice - 1];
      if (!game) return;
      try {
        const f = new FormData();
        f.set("action", "assign");
        f.set("collection_id", collection.id);
        f.set("game_id", game.id);
        await post("api/collections.php", f);
        await load();
        toast("Jogo adicionado à coleção.");
      } catch (e) {
        toast(e.message);
      }
      return;
    }
    const addStore = event.target.closest("[data-add-store]");
    if (addStore) {
      const externalId = addStore.dataset.addStore;
      const platform = addStore.dataset.platform || "steam";
      const card = addStore.closest(".game-card");
      const titleEl = card.querySelector(".card-title");
      const title = titleEl ? titleEl.textContent : "";
      const name = prompt(`Digite o título para “${title}” na tua biblioteca (${platform}):`, title);
      if (!name?.trim()) return;
      try {
        const form = new FormData();
        form.set("action", "add_from_store");
        form.set("platform", platform);
        form.set("external_id", externalId);
        form.set("title", name.trim());
        await post("api/catalog.php", form);
        await load();
        toast(`Jogo da ${platform.charAt(0).toUpperCase() + platform.slice(1)} adicionado à tua biblioteca.`);
      } catch (e) {
        toast(e.message);
      }
      return;
    }
    if (event.target.id === "mobile-menu")
      $("#sidebar").classList.toggle("open");
    if (event.target.dataset.view) {
      state.view = event.target.dataset.view;
      $$(".view-button").forEach((b) =>
        b.classList.toggle("selected", b === event.target),
      );
      renderLibrary();
    }
  });
  $("#game-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("#save-game");
    button.disabled = true;
    button.textContent = "A guardar…";
    $("#form-error").textContent = "";
    try {
      const data = await post(
        "api/games.php",
        new FormData(event.currentTarget),
      );
      closeModal();
      toast("Jogo guardado na tua biblioteca.");
      await load();
    } catch (error) {
      $("#form-error").textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = $("#game-form").elements.id.value
        ? "Guardar alterações"
        : "Guardar jogo";
    }
  });
  [
    "filter-platform",
    "filter-genre",
    "filter-status",
    "sort-games",
    "library-search",
  ].forEach((id) => $("#" + id).addEventListener("input", renderLibrary));
  $("#clear-filters").addEventListener("click", () => {
    $("#filter-platform").value = "";
    $("#filter-genre").value = "";
    $("#filter-status").value = "";
    $("#library-search").value = "";
    $("#sort-games").value = "recent";
    renderLibrary();
  });
  $("#global-search").addEventListener("input", (event) => {
    state.search = event.target.value;
    navigate("library");
    $("#library-search").value = state.search;
    renderLibrary();
  });
  $("#catalog-search").addEventListener("input", (event) => {
    const query = event.target.value.trim();
    if (query.length >= 2) {
      loadCatalog(query);
    } else if (query === "") {
      loadCatalog("", true);
    }
  });
  $("#catalog-search").addEventListener("search", (event) => {
    $("#catalog-search").value = "";
    loadCatalog("", true);
  });
  $("#catalog-featured").addEventListener("click", () => {
    loadCatalog("", true);
    $("#catalog-search").value = "";
  });
  $("#catalog-clear").addEventListener("click", () => {
    $("#catalog-search").value = "";
    loadCatalog("", true);
  });
  $("#catalog-platform").addEventListener("change", () => {
    $("#catalog-search").value = "";
    loadCatalog("", true);
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#global-search").focus();
    }
    if (event.key === "Escape") closeModal();
  });
  $("#game-modal").addEventListener("click", (event) => {
    if (event.target.id === "game-modal") closeModal();
  });
  $("#theme-toggle").addEventListener("click", () => {
    const theme = document.body.classList.contains("theme-light")
      ? "dark"
      : "light";
    settingsForm.elements.theme.value = theme;
    settingsForm.requestSubmit();
  });
  // ================= GRUPOS DE CHAT =================
  async function loadGroups() {
    try {
      const data = await request("api/chat-groups.php?action=list");
      state.chatGroups = data.groups || [];
      renderGroups();
    } catch (e) {
      if (e.status !== 401) toast(e.message);
    }
  }
  function renderGroups() {
    const container = $("#groups-list");
    if (state.chatGroups.length) {
      container.innerHTML = state.chatGroups
        .map(
          (g) => `
          <button class="group-item ${Number(g.id) === Number(state.currentGroup) ? "active" : ""}" data-group-id="${g.id}">
            <div class="avatar group-avatar">${escapeHtml(g.name.slice(0, 1).toUpperCase())}</div>
            <div class="group-info">
              <strong>${escapeHtml(g.name)}</strong>
              <small>${g.member_count} ${g.member_count === 1 ? "membro" : "membros"}</small>
            </div>
            <span class="group-members-count">${g.member_count}</span>
          </button>
        `
        )
        .join("");
    } else {
      container.innerHTML = `<div class="empty-groups">Sem grupos. Cria o teu primeiro grupo.</div>`;
    }
  }
  async function loadGroupMessages(groupId) {
    state.currentGroup = groupId;
    state.chatWith = 0;
    disconnectSSEs();
    $("#chat-header").hidden = true;
    $("#chat-header-actions").hidden = true;
    $("#chat-empty").hidden = true;
    $("#chat-form").hidden = true;
    $("#page-chat").classList.remove("active");
    $("#page-chat-groups").classList.add("active");
    $("#breadcrumb-current").textContent = "Grupos de Chat";
    const container = $("#group-messages");
    container.hidden = true;
    container.innerHTML = "";
    try {
      const data = await request(`api/chat-groups.php?action=messages&group_id=${groupId}`);
      state.groupMessages = data.messages || [];
      renderGroupMessages();
      container.hidden = false;
    } catch (e) {
      toast(e.message);
    }
  }
  function renderGroupMessages() {
    const container = $("#group-messages");
    if (state.groupMessages.length) {
      container.innerHTML = state.groupMessages
        .map(
          (m) => {
            const isMine = Number(m.sender_id) === Number(state.user.id);
            return `
            <div class="group-message ${isMine ? "mine" : ""}">
              <div class="message-body">
                ${isMine ? "" : `<div class="message-sender">${escapeHtml(m.sender_name)}</div>`}
                <div>${escapeHtml(m.body)}</div>
                <div class="message-time">${escapeHtml(m.created_at)}</div>
              </div>
            </div>
          `;
          }
        )
        .join("");
    } else {
      container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><div><div class="empty-icon">✦</div><strong>Sem mensagens</strong><p>Inicia a conversa neste grupo.</p></div></div>`;
    }
    container.scrollTop = container.scrollHeight;
  }
  // ================= CHAMADAS DE VOZ =================
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  function sendSignal(callId, action, payload = {}) {
    const form = new FormData();
    form.set("action", action);
    form.set("call_id", callId);
    for (const [key, value] of Object.entries(payload)) {
      form.set(key, value);
    }
    return post("api/call-signal.php", form);
  }

  async function startVoiceCall(targetId, isGroup = false, groupId = 0) {
    try {
      state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      toast("Não foi possível aceder ao microfone.");
      return;
    }
    try {
      const form = new FormData();
      form.set("action", "create");
      form.set("call_type", "voice");
      if (isGroup) {
        form.set("group_id", groupId);
      } else {
        form.set("receiver_id", targetId);
      }
      const data = await post("api/call-signal.php", form);
      state.voiceCall = {
        id: data.call_id,
        targetId,
        isGroup,
        groupId,
      };
      showVoiceCallUI("A ligar…", false);
      initPeerConnection(data.call_id, "offer");
    } catch (e) {
      toast(e.message);
    }
  }

  async function initPeerConnection(callId, role) {
    state.peerConnection = new RTCPeerConnection(iceServers);
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => state.peerConnection.addTrack(track, state.localStream));
    }
    state.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(callId, "signal", {
          sdp: JSON.stringify(event.candidate.candidate),
          type: "candidate",
        }).catch(() => {});
      }
    };
    state.peerConnection.ontrack = (event) => {
      let audio = document.getElementById("voice-call-remote-audio");
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "voice-call-remote-audio";
        audio.autoplay = true;
        document.getElementById("voice-call-content").appendChild(audio);
      }
      audio.srcObject = event.streams[0];
    };
    if (role === "offer") {
      const offer = await state.peerConnection.createOffer();
      await state.peerConnection.setLocalDescription(offer);
      await sendSignal(callId, "signal", {
        sdp: JSON.stringify(offer.sdp),
        type: "offer",
      });
      waitForSignal(callId, "answer");
    }
  }

  async function waitForSignal(callId, expectedType) {
    let attempts = 0;
    const maxAttempts = 30;
    const check = async () => {
      attempts++;
      try {
        const form = new FormData();
        form.set("action", "get_signal");
        form.set("call_id", callId);
        const data = await post("api/call-signal.php", form);
        if (data.signal && data.signal.type === expectedType) {
          const signal = JSON.parse(data.signal.sdp);
          if (expectedType === "answer") {
            await state.peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (expectedType === "candidate") {
            await state.peerConnection.addIceCandidate(new RTCIceCandidate(signal));
            setTimeout(() => check(), 1000);
            return;
          }
        } else if (attempts < maxAttempts) {
          setTimeout(() => check(), 500);
        }
      } catch (e) {
        if (attempts < maxAttempts) setTimeout(() => check(), 500);
      }
    };
    check();
  }

  async function answerVoiceCall(callId) {
    try {
      state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      toast("Não foi possível aceder ao microfone.");
      return;
    }
    const form = new FormData();
    form.set("action", "get_signal");
    form.set("call_id", callId);
    const data = await post("api/call-signal.php", form);
    if (!data.signal) {
      toast("Não foi possível obter a oferta da chamada.");
      return;
    }
    const offer = JSON.parse(data.signal.sdp);
    state.peerConnection = new RTCPeerConnection(iceServers);
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => state.peerConnection.addTrack(track, state.localStream));
    }
    state.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(callId, "signal", {
          sdp: JSON.stringify(event.candidate.candidate),
          type: "candidate",
        }).catch(() => {});
      }
    };
    state.peerConnection.ontrack = (event) => {
      let audio = document.getElementById("voice-call-remote-audio");
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "voice-call-remote-audio";
        audio.autoplay = true;
        document.getElementById("voice-call-content").appendChild(audio);
      }
      audio.srcObject = event.streams[0];
    };
    await state.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await state.peerConnection.createAnswer();
    await state.peerConnection.setLocalDescription(answer);
    await sendSignal(callId, "signal", {
      sdp: JSON.stringify(answer.sdp),
      type: "answer",
    });
    const form2 = new FormData();
    form2.set("action", "answer");
    form2.set("call_id", callId);
    await post("api/call-signal.php", form2);
    state.voiceCall = { id: callId, targetId: 0, isGroup: false, groupId: 0 };
    showVoiceCallUI("Em chamada", true);
  }

  function endVoiceCall() {
    if (state.voiceCall) {
      const form = new FormData();
      form.set("action", "end");
      form.set("call_id", state.voiceCall.id);
      post("api/call-signal.php", form).catch(() => {});
    }
    if (state.localStream) {
      state.localStream.getTracks().forEach((t) => t.stop());
      state.localStream = null;
    }
    if (state.peerConnection) {
      state.peerConnection.close();
      state.peerConnection = null;
    }
    state.voiceCall = null;
    hideVoiceCallUI();
  }

  function showVoiceCallUI(status, inCall) {
    const modal = $("#voice-call-modal");
    const statusEl = $("#voice-call-status");
    const declineBtn = $("#voice-call-decline");
    const endBtn = $("#voice-call-end");
    const muteBtn = $("#voice-call-mute");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    statusEl.textContent = status;
    declineBtn.hidden = inCall;
    endBtn.hidden = !inCall;
    muteBtn.hidden = !inCall;
  }

  function hideVoiceCallUI() {
    const modal = $("#voice-call-modal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  // ================= EVENT LISTENERS GRUPOS E CHAMADAS =================
  $("#btn-create-group").addEventListener("click", () => {
    $("#create-group-modal").classList.add("open");
    $("#create-group-modal").setAttribute("aria-hidden", "false");
    $("#create-group-form").reset();
    $("#create-group-error").textContent = "";
  });

  $("#create-group-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("action", "create");
    try {
      await post("api/chat-groups.php", form);
      toast("Grupo criado.");
      $("#create-group-modal").classList.remove("open");
      $("#create-group-modal").setAttribute("aria-hidden", "true");
      await loadGroups();
    } catch (e) {
      $("#create-group-error").textContent = e.message;
    }
  });

  document.addEventListener("click", async (event) => {
    const groupItem = event.target.closest(".group-item");
    if (groupItem) {
      const groupId = Number(groupItem.dataset.groupId);
      await loadGroupMessages(groupId);
      return;
    }
    const chatCallVoice = event.target.closest("#chat-call-voice");
    if (chatCallVoice) {
      if (!state.chatWith) {
        toast("Seleciona um amigo primeiro.");
        return;
      }
      startVoiceCall(state.chatWith, false, 0);
      return;
    }
    const voiceCallEnd = event.target.closest("#voice-call-end");
    if (voiceCallEnd) {
      endVoiceCall();
      return;
    }
    const voiceCallDecline = event.target.closest("#voice-call-decline");
    if (voiceCallDecline) {
      const action = voiceCallDecline.dataset.action;
      const form = new FormData();
      form.set("action", action);
      form.set("call_id", state.voiceCall ? state.voiceCall.id : 0);
      try {
        await post("api/call-signal.php", form);
      } catch (e) {}
      hideVoiceCallUI();
      return;
    }
    const voiceCallMute = event.target.closest("#voice-call-mute");
    if (voiceCallMute) {
      const muted = voiceCallMute.dataset.muted === "1";
      voiceCallMute.dataset.muted = muted ? "0" : "1";
      voiceCallMute.textContent = muted ? "🔇 Mutar" : "🔊 Ativar som";
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
      }
      return;
    }
  });


