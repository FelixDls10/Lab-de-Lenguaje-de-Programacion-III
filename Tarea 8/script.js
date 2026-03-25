/* ═══════════════════════════════════════════
   ESTADO
═══════════════════════════════════════════ */
let menuData = null;

/* ═══════════════════════════════════════════
   CARGA DEL JSON
═══════════════════════════════════════════ */
async function loadMenu() {
  try {
    const res = await fetch('./menu.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    menuData = await res.json();
    init();
  } catch (err) {
    document.getElementById('status').innerHTML =
      `<i data-lucide="alert-circle"></i> No se pudo cargar menu.json. Ábrelo desde un servidor local.`;
    lucide.createIcons();
  }
}

/* ═══════════════════════════════════════════
   UTILIDADES
═══════════════════════════════════════════ */
function icon(name, cls = '') {
  return `<i data-lucide="${name}" class="${cls}"></i>`;
}

function getAllIds(items = menuData.menu) {
  let ids = [];
  for (const i of items) {
    ids.push(i.id);
    if (i.children?.length) ids = ids.concat(getAllIds(i.children));
  }
  return ids;
}

function flatItems(items = menuData.menu, level = 1) {
  let out = [];
  for (const i of items) {
    out.push({ ...i, _level: level });
    if (i.children?.length) out = out.concat(flatItems(i.children, level + 1));
  }
  return out;
}

function findById(id, items = menuData.menu) {
  for (const i of items) {
    if (i.id === id) return i;
    const found = findById(id, i.children || []);
    if (found) return found;
  }
  return null;
}

function removeById(id, items = menuData.menu) {
  for (let n = 0; n < items.length; n++) {
    if (items[n].id === id) { items.splice(n, 1); return true; }
    if (removeById(id, items[n].children || [])) return true;
  }
  return false;
}

function genId() {
  const ids = getAllIds();
  let id;
  do { id = Math.floor(Math.random() * 9000) + 100; } while (ids.includes(id));
  return id;
}

function isValidLink(v) {
  return v === '#' || /^(\/|https?:\/\/)/.test(v.trim());
}

/* ═══════════════════════════════════════════
   RENDER NAVBAR
═══════════════════════════════════════════ */
function renderNav(items = menuData.menu, el = document.getElementById('nav-menu')) {
  el.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'menu-item';
    const hasSub = item.children?.length > 0;

    li.innerHTML = `
      <a class="menu-link" href="${hasSub ? '#' : item.enlace}">
        ${icon(item.icono)}
        <span>${item.nombre}</span>
        ${hasSub ? icon('chevron-down', 'chevron') : ''}
      </a>`;

    if (hasSub) {
      const sub = buildSubMenu(item.children);
      li.appendChild(sub);
      li.querySelector('.menu-link').addEventListener('click', e => {
        e.preventDefault();
        toggleItem(li, el);
      });
    }

    el.appendChild(li);
  }
  lucide.createIcons();
}

function buildSubMenu(items) {
  const ul = document.createElement('ul');
  ul.className = 'submenu';
  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'menu-item';
    const hasSub = item.children?.length > 0;
    li.innerHTML = `
      <a class="menu-link" href="${hasSub ? '#' : item.enlace}">
        ${icon(item.icono)}
        <span>${item.nombre}</span>
        ${hasSub ? icon('chevron-right', 'chevron') : ''}
      </a>`;
    if (hasSub) {
      li.appendChild(buildSubMenu(item.children));
      li.querySelector('.menu-link').addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(li, ul);
      });
    }
    ul.appendChild(li);
  }
  return ul;
}

function toggleItem(li, parent) {
  parent.querySelectorAll(':scope > .menu-item.open').forEach(el => {
    if (el !== li) el.classList.remove('open');
  });
  li.classList.toggle('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.menu-item')) {
    document.querySelectorAll('.menu-item.open').forEach(el => el.classList.remove('open'));
  }
});

/* ═══════════════════════════════════════════
   RENDER MOBILE
═══════════════════════════════════════════ */
function renderMobile(items = menuData.menu, container = document.getElementById('mob-list')) {
  container.innerHTML = '';
  for (const item of items) {
    const hasSub = item.children?.length > 0;
    const div = document.createElement('div');
    div.className = 'mob-item';
    div.innerHTML = `
      <div class="mob-link">
        ${icon(item.icono)} <span>${item.nombre}</span>
        ${hasSub ? icon('chevron-down', 'chevron') : ''}
      </div>`;

    if (hasSub) {
      const sub = document.createElement('div');
      sub.className = 'mob-sub';
      renderMobile(item.children, sub);
      div.appendChild(sub);
      div.querySelector('.mob-link').addEventListener('click', () => {
        div.querySelector('.mob-link').classList.toggle('open');
        sub.classList.toggle('open');
        lucide.createIcons();
      });
    }
    container.appendChild(div);
  }
  lucide.createIcons();
}

function toggleMobile() {
  const panel = document.getElementById('mobile-panel');
  const btn   = document.getElementById('hamburger');
  const open  = panel.classList.toggle('open');
  btn.classList.toggle('open', open);
  if (open) renderMobile();
}

/* ═══════════════════════════════════════════
   RENDER ÁRBOL (panel izquierdo)
═══════════════════════════════════════════ */
function renderTree(items = menuData.menu, container = null, level = 1) {
  const isRoot = !container;
  if (isRoot) container = document.getElementById('tree-list');
  container.innerHTML = isRoot ? '' : container.innerHTML;

  for (const item of items) {
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="item-row">
        ${icon(item.icono)}
        <span class="item-name">${item.nombre}</span>
        <span class="item-link">${item.enlace}</span>
        <span class="item-lvl">L${level}</span>
        <button class="del-btn" onclick="deleteItem(${item.id})">${icon('x')}</button>
      </div>`;

    if (item.children?.length) {
      const children = document.createElement('div');
      children.className = 'item-children';
      renderTree(item.children, children, level + 1);
      div.appendChild(children);
    }

    container.appendChild(div);
  }

  if (isRoot) lucide.createIcons();
}

/* ═══════════════════════════════════════════
   AGREGAR ÍTEM
═══════════════════════════════════════════ */
function addItem() {
  const nombre   = document.getElementById('f-nombre').value.trim();
  const enlace   = document.getElementById('f-enlace').value.trim();
  const icono    = document.getElementById('f-icono').value.trim() || 'circle';
  const parentId = document.getElementById('f-parent').value;

  let ok = true;
  const setErr = (id, show) => {
    document.getElementById('err-' + id).style.display = show ? 'block' : 'none';
    document.getElementById('f-' + id).classList.toggle('err', show);
  };

  if (!nombre) { setErr('nombre', true); ok = false; } else setErr('nombre', false);
  if (!isValidLink(enlace)) { setErr('enlace', true); ok = false; } else setErr('enlace', false);
  if (!ok) return;

  const newItem = { id: genId(), nombre, enlace, icono, children: [] };

  if (parentId) {
    const parent = findById(parseInt(parentId));
    if (parent) parent.children.push(newItem);
  } else {
    menuData.menu.push(newItem);
  }

  // Reset
  ['f-nombre','f-enlace','f-icono'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-parent').value = '';

  refresh();
}

/* ═══════════════════════════════════════════
   ELIMINAR ÍTEM
═══════════════════════════════════════════ */
function deleteItem(id) {
  const item = findById(id);
  if (!item) return;
  const hasSub = item.children?.length > 0;
  if (!confirm(hasSub ? `¿Eliminar "${item.nombre}" y sus subítems?` : `¿Eliminar "${item.nombre}"?`)) return;
  removeById(id);
  refresh();
}

/* ═══════════════════════════════════════════
   POPULATE SELECT PADRE
═══════════════════════════════════════════ */
function populateSelect() {
  const sel = document.getElementById('f-parent');
  sel.innerHTML = '<option value="">— Raíz —</option>';
  for (const item of flatItems()) {
    if (item._level >= 3) continue;
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${'  '.repeat(item._level - 1)}${item.nombre}`;
    sel.appendChild(opt);
  }
}

/* ═══════════════════════════════════════════
   REFRESH
═══════════════════════════════════════════ */
function refresh() {
  renderNav();
  renderTree();
  populateSelect();
}

/* ═══════════════════════════════════════════
   INIT — construye el HTML de los paneles
═══════════════════════════════════════════ */
function init() {
  document.getElementById('main-content').innerHTML = `
    <!-- Árbol -->
    <div class="card">
      <div class="card-header">
        Ítems del menú
        <span style="font-size:.75rem;color:var(--muted);font-weight:400" id="counter"></span>
      </div>
      <div class="card-body">
        <div id="tree-list"></div>
      </div>
    </div>

    <!-- Form -->
    <div class="card" style="align-self:start">
      <div class="card-header">Agregar ítem</div>
      <div class="card-body">
        <div class="form-group">
          <label>Nombre *</label>
          <input id="f-nombre" type="text" placeholder="ej. Productos"/>
          <span class="err-msg" id="err-nombre">Campo requerido</span>
        </div>
        <div class="form-group">
          <label>Enlace *</label>
          <input id="f-enlace" type="text" placeholder="ej. /productos"/>
          <span class="err-msg" id="err-enlace">Debe empezar con / o https://</span>
        </div>
        <div class="form-group">
          <label>Ícono (nombre Lucide)</label>
          <input id="f-icono" type="text" placeholder="ej. package, star, zap"/>
          <span style="font-size:.72rem;color:var(--muted);margin-top:4px;display:block">
            Ver íconos: <a href="https://lucide.dev/icons" target="_blank" style="color:var(--accent)">lucide.dev/icons</a>
          </span>
        </div>
        <div class="form-group">
          <label>Padre (opcional)</label>
          <select id="f-parent"></select>
        </div>
        <button class="submit-btn" onclick="addItem()">Agregar</button>
      </div>
    </div>
  `;

  refresh();

  // Actualizar contador
  const observer = new MutationObserver(() => {
    const n = document.querySelectorAll('.item-row').length;
    const el = document.getElementById('counter');
    if (el) el.textContent = `${n} ítem${n !== 1 ? 's' : ''}`;
  });
  observer.observe(document.getElementById('tree-list'), { childList: true, subtree: true });
}

loadMenu();