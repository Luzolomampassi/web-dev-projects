(() => {
  'use strict';
  const state = { games: [], collections: [], memberships: [], page: 'dashboard', view: 'grid', search: '', user: window.APP_CONFIG.user };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const statusLabels = {backlog:'Por jogar',playing:'A jogar',completed:'Concluído',paused:'Em pausa',abandoned:'Abandonado'};
  let toastTimer;
  function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); }
  async function request(url, options = {}) {
    const response = await fetch(url, options); let body;
    try { body = await response.json(); } catch { throw new Error('Resposta inválida do servidor.'); }
    if (!response.ok) { const error=new Error(body.error || 'A operação não foi concluída.'); error.status=response.status; throw error; }
    return body;
  }
  async function load() {
    try { const data=await request('api/games.php'); state.games=data.games; state.collections=data.collections; state.memberships=data.memberships; render(); }
    catch (error) { if(error.status===401){location.href='index.php';return;} toast(error.message); $('.game-grid').innerHTML=empty('A ligação à base de dados não está pronta','Cria uma base de dados MySQL no alojamento e configura config.php para começar.'); }
  }
  function empty(title, text, button = false) { return `<div class="empty-state"><div><div class="empty-icon">✦</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p>${button?'<button class="button button-primary" data-add>＋ Adicionar jogo</button>':''}</div></div>`; }
  function cover(game) { return game.cover_path ? `<img src="uploads/${encodeURIComponent(game.cover_path)}" alt="Capa de ${escapeHtml(game.title)}" loading="lazy">` : `<div class="cover-placeholder" aria-label="Sem capa">${escapeHtml(game.title.slice(0,1).toUpperCase())}</div>`; }
  function card(game, compact = false) {
    const meta=[game.platform,game.genre].filter(Boolean).join(' · ') || 'Sem plataforma ou género';
    const detail = game.hours ? `${game.hours} h` : 'Sem registo de horas';
    const rating = game.rating !== null ? `★ ${Number(game.rating).toFixed(1)}` : '';
    return `<article class="game-card" data-id="${game.id}"><div class="cover-wrap">${cover(game)}<span class="game-status status-${game.status}">${statusLabels[game.status]}</span><button class="favorite-toggle ${game.favorite?'on':''}" data-favorite="${game.id}" aria-label="${game.favorite?'Remover dos':'Adicionar aos'} favoritos">${game.favorite?'♥':'♡'}</button></div><div class="card-info"><h3 class="card-title" title="${escapeHtml(game.title)}">${escapeHtml(game.title)}</h3><div class="card-meta">${escapeHtml(meta)}</div><div class="card-foot"><span>${detail}</span><span class="card-rating">${rating}</span><span class="card-actions"><button class="card-action" data-edit="${game.id}">Editar</button><button class="card-action" data-delete="${game.id}">Remover</button></span></div></div></article>`;
  }
  function setEmptyOrCards(target, games, title, text, button = false, compact = false) {
    $(target).innerHTML = games.length ? games.map(game=>card(game,compact)).join('') : empty(title,text,button);
  }
  function filteredGames() {
    let games=state.games.filter(game=>!game.is_wishlist);
    const search=($('#library-search')?.value || state.search).trim().toLocaleLowerCase();
    const platform=$('#filter-platform')?.value||'', genre=$('#filter-genre')?.value||'', status=$('#filter-status')?.value||'';
    if(search) games=games.filter(g=>`${g.title} ${g.platform} ${g.genre}`.toLocaleLowerCase().includes(search));
    if(platform) games=games.filter(g=>g.platform===platform); if(genre) games=games.filter(g=>g.genre===genre); if(status) games=games.filter(g=>g.status===status);
    const sort=$('#sort-games')?.value||'recent';
    games.sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):sort==='rating'?(b.rating??-1)-(a.rating??-1):sort==='hours'?b.hours-a.hours:new Date(b.created_at)-new Date(a.created_at));
    return games;
  }
  function updateFilters() {
    for(const [id,key,label] of [['filter-platform','platform','Todas as plataformas'],['filter-genre','genre','Todos os géneros']]) {
      const select=$('#'+id), previous=select.value, values=[...new Set(state.games.filter(g=>!g.is_wishlist).map(g=>g[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      select.innerHTML=`<option value="">${label}</option>`+values.map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
      select.value=values.includes(previous)?previous:'';
    }
  }
  function renderDashboard() {
    const owned=state.games.filter(g=>!g.is_wishlist), playing=owned.filter(g=>g.status==='playing'), completed=owned.filter(g=>g.status==='completed'), wishlist=state.games.filter(g=>g.is_wishlist);
    $('#stat-total').textContent=owned.length; $('#stat-playing').textContent=playing.length; $('#stat-completed').textContent=completed.length; $('#stat-wishlist').textContent=wishlist.length; $('#nav-total').textContent=owned.length;
    const pct=owned.length?Math.round(completed.length/owned.length*100):0; $('#completion-label').textContent=pct+'%'; $('#completion-bar').style.width=pct+'%'; $('#completion-count').textContent=`${completed.length} de ${owned.length} jogos`;
    const featured=playing[0]||owned.find(g=>g.favorite)||owned[0];
    if(featured) $('#featured').innerHTML=`${featured.cover_path?`<img class="hero-cover" src="uploads/${encodeURIComponent(featured.cover_path)}" alt="">`:''}<div class="hero-content"><p class="eyebrow">${playing.length?'CONTINUA A TUA AVENTURA':'UM DOS TEUS DESTAQUES'}</p><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.description||[featured.platform,featured.genre].filter(Boolean).join(' · ')||'A tua próxima aventura está à tua espera.')}</p><button class="button button-primary" data-edit="${featured.id}">Ver e editar jogo ↗</button><span class="hero-chip">${statusLabels[featured.status]}</span></div>`;
    setEmptyOrCards('#recent-grid',[...owned].slice(0,4),'A biblioteca está à tua espera','Adiciona os jogos que já tens e começa a registar o teu progresso.',true);
    setEmptyOrCards('#playing-grid',playing.slice(0,4),'Ainda não começaste uma aventura','Quando mudares o estado de um jogo para “A jogar”, ele aparece aqui.',false,true);
  }
  function renderLibrary() {const games=filteredGames(); $('#result-count').textContent=`${games.length} ${games.length===1?'jogo':'jogos'}`; $('#library-grid').classList.toggle('list-view',state.view==='list'); setEmptyOrCards('#library-grid',games,'Nenhum jogo encontrado','Experimenta limpar os filtros ou adiciona um novo jogo.',true);}
  function renderWishlist() {setEmptyOrCards('#wishlist-grid',state.games.filter(g=>g.is_wishlist),'A tua lista está vazia','Guarda aqui os jogos que queres experimentar no futuro.',true);}
  function renderCollections() {
    const gamesById=new Map(state.games.map(g=>[Number(g.id),g]));
    $('#collection-grid').innerHTML=state.collections.length?state.collections.map(c=>{const ids=state.memberships.filter(m=>Number(m.collection_id)===Number(c.id)).map(m=>Number(m.game_id));return `<article class="collection-card"><div><div class="collection-art">▤</div><h3>${escapeHtml(c.name)}</h3><p>${ids.map(id=>gamesById.get(id)?.title).filter(Boolean).slice(0,3).map(escapeHtml).join(' · ')||'Adiciona jogos a esta coleção'}</p></div><div class="collection-footer"><span>${ids.length} ${ids.length===1?'jogo':'jogos'}</span><span><button data-assign="${c.id}">Adicionar jogo</button> · <button data-remove-collection="${c.id}">Apagar</button></span></div></article>`}).join(''):empty('Cria a tua primeira coleção','Agrupa os jogos que partilham uma história, um género ou uma vontade.',false);
  }
  function render() {updateFilters();renderDashboard();renderLibrary();renderWishlist();renderCollections();renderProfileStats();}
  function navigate(page) {
    state.page=page; $$('.page').forEach(el=>el.classList.toggle('active',el.id===`page-${page}`)); $$('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
    const names={dashboard:'Visão geral',library:'A minha biblioteca',wishlist:'Lista de desejos',collections:'Coleções',profile:'Perfil do jogador',settings:'Definições'}; $('#breadcrumb-current').textContent=names[page]||names.dashboard; $('#sidebar').classList.remove('open');
  }
  function openModal(game=null, wishlist=false) {
    const form=$('#game-form');form.reset();form.elements.id.value=game?.id||'';form.elements.csrf.value=window.APP_CONFIG.csrf;$('#form-error').textContent='';
    $('#modal-title').textContent=game?'Editar jogo':'Adicionar jogo'; $('#save-game').textContent=game?'Guardar alterações':'Guardar jogo';
    if(game){for(const key of ['title','platform','genre','status','hours','rating','release_date','description','notes'])form.elements[key].value=game[key]??'';form.elements.favorite.checked=game.favorite;form.elements.is_wishlist.checked=game.is_wishlist;}
    else {form.elements.is_wishlist.checked=wishlist||state.page==='wishlist';}
    const modal=$('#game-modal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');setTimeout(()=>form.elements.title.focus(),30);
  }
  function closeModal(){const modal=$('#game-modal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
  async function post(url, data) {data.append('csrf',window.APP_CONFIG.csrf);return request(url,{method:'POST',body:data,headers:{'X-CSRF-Token':window.APP_CONFIG.csrf}});}
  function gameById(id){return state.games.find(g=>Number(g.id)===Number(id));}
  const profileForm=$('#profile-form'), settingsForm=$('#settings-form'), passwordForm=$('#password-form');
  function updateProfile(user){state.user=user;$('#sidebar-username').textContent=user.username;$('#sidebar-avatar').textContent=user.username.slice(0,1).toLocaleUpperCase();$('#profile-name').textContent=user.username;$('#profile-avatar').textContent=user.username.slice(0,1).toLocaleUpperCase();$('#profile-email').textContent=user.email;$('#profile-bio-preview').textContent=user.bio||'Ainda não adicionaste uma descrição.';profileForm.elements.username.value=user.username;profileForm.elements.bio.value=user.bio||'';}
  async function initAccount(){try{const data=await request('api/auth.php');updateProfile(data.user);document.body.classList.toggle('theme-light',data.settings.theme==='light');document.body.classList.toggle('theme-dark',data.settings.theme==='dark');settingsForm.elements.theme.value=data.settings.theme;localStorage.setItem('arcadia-theme',data.settings.theme);}catch(e){if(e.status===401)location.href='index.php';}}
  profileForm.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(profileForm);f.set('action','profile');try{const data=await post('api/auth.php',f);updateProfile(data.user);toast('Perfil atualizado.')}catch(err){$('#profile-error').textContent=err.message;}});
  settingsForm.addEventListener('submit',async e=>{e.preventDefault();const theme=settingsForm.elements.theme.value;const f=new FormData();f.set('action','settings');f.set('theme',theme);try{await post('api/auth.php',f);document.body.classList.toggle('theme-light',theme==='light');document.body.classList.toggle('theme-dark',theme==='dark');localStorage.setItem('arcadia-theme',theme);toast('Definições guardadas.')}catch(err){toast(err.message);}});
  passwordForm.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(passwordForm);f.set('action','password');try{await post('api/auth.php',f);passwordForm.reset();toast('Palavra-passe atualizada.')}catch(err){$('#password-error').textContent=err.message;}});
  async function logout(){const f=new FormData();f.set('action','logout');try{await post('api/auth.php',f);}finally{location.href='index.php';}}
  $('#logout').addEventListener('click',logout);$('#settings-logout').addEventListener('click',logout);
  function renderProfileStats(){const owned=state.games.filter(g=>!g.is_wishlist);$('#profile-total').textContent=owned.length;$('#profile-hours').textContent=owned.reduce((sum,g)=>sum+Number(g.hours||0),0).toLocaleString('pt-PT');$('#profile-completed').textContent=owned.filter(g=>g.status==='completed').length;$('#profile-collections').textContent=state.collections.length;}
  document.addEventListener('click',async event=>{
    const nav=event.target.closest('[data-page]');if(nav){navigate(nav.dataset.page);return;}
    const go=event.target.closest('[data-go]');if(go){navigate(go.dataset.go);return;}
    if(event.target.closest('[data-add]')){openModal(null,event.target.closest('[data-wishlist]')!==null);return;}
    if(event.target.closest('[data-close]')){closeModal();return;}
    const edit=event.target.closest('[data-edit]');if(edit){const game=gameById(edit.dataset.edit);if(game)openModal(game);return;}
    const favorite=event.target.closest('[data-favorite]');if(favorite){try{const form=new FormData();form.set('action','toggle-favorite');form.set('id',favorite.dataset.favorite);await post('api/games.php',form);await load();}catch(e){toast(e.message)}return;}
    const del=event.target.closest('[data-delete]');if(del){const game=gameById(del.dataset.delete);if(!game||!confirm(`Queres remover “${game.title}” da tua biblioteca?`))return;try{const form=new FormData();form.set('action','delete');form.set('id',game.id);await post('api/games.php',form);toast('Jogo removido.');await load();}catch(e){toast(e.message)}return;}
    const addCollection=event.target.closest('#add-collection');if(addCollection){const name=prompt('Nome da nova coleção:');if(!name?.trim())return;try{const f=new FormData();f.set('name',name.trim());await post('api/collections.php',f);toast('Coleção criada.');await load();}catch(e){toast(e.message)}return;}
    const removeCollection=event.target.closest('[data-remove-collection]');if(removeCollection){const collection=state.collections.find(c=>Number(c.id)===Number(removeCollection.dataset.removeCollection));if(!collection||!confirm(`Apagar a coleção “${collection.name}”?`))return;try{const f=new FormData();f.set('action','delete');f.set('id',collection.id);await post('api/collections.php',f);await load();toast('Coleção apagada.');}catch(e){toast(e.message)}return;}
    const assign=event.target.closest('[data-assign]');if(assign){if(!state.games.length){toast('Adiciona primeiro um jogo à biblioteca.');return;}const collection=state.collections.find(c=>Number(c.id)===Number(assign.dataset.assign));const options=state.games.map((g,i)=>`${i+1}. ${g.title}`).join('\n');const choice=Number(prompt(`Adicionar um jogo a “${collection.name}”:\n${options}\n\nEscreve o número do jogo:`));const game=state.games[choice-1];if(!game)return;try{const f=new FormData();f.set('action','assign');f.set('collection_id',collection.id);f.set('game_id',game.id);await post('api/collections.php',f);await load();toast('Jogo adicionado à coleção.');}catch(e){toast(e.message)}return;}
    if(event.target.id==='mobile-menu')$('#sidebar').classList.toggle('open');
    if(event.target.dataset.view){state.view=event.target.dataset.view;$$('.view-button').forEach(b=>b.classList.toggle('selected',b===event.target));renderLibrary();}
  });
  $('#game-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('#save-game');button.disabled=true;button.textContent='A guardar…';$('#form-error').textContent='';try{const data=await post('api/games.php',new FormData(event.currentTarget));closeModal();toast('Jogo guardado na tua biblioteca.');await load();}catch(error){$('#form-error').textContent=error.message;}finally{button.disabled=false;button.textContent=$('#game-form').elements.id.value?'Guardar alterações':'Guardar jogo';}});
  ['filter-platform','filter-genre','filter-status','sort-games','library-search'].forEach(id=>$('#'+id).addEventListener('input',renderLibrary));
  $('#clear-filters').addEventListener('click',()=>{$('#filter-platform').value='';$('#filter-genre').value='';$('#filter-status').value='';$('#library-search').value='';$('#sort-games').value='recent';renderLibrary();});
  $('#global-search').addEventListener('input',event=>{state.search=event.target.value;navigate('library');$('#library-search').value=state.search;renderLibrary();});
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#global-search').focus();}if(event.key==='Escape')closeModal();});
  $('#game-modal').addEventListener('click',event=>{if(event.target.id==='game-modal')closeModal();});
  $('#theme-toggle').addEventListener('click',()=>{const theme=document.body.classList.contains('theme-light')?'dark':'light';settingsForm.elements.theme.value=theme;settingsForm.requestSubmit();});
  initAccount();
  load();
})();
