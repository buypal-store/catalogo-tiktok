/* global PRODUCTS */

const state = {
  category: "Todas",
  search: "",
  cart: [],
  discount: 0,
};

const el = (id) => document.getElementById(id);

function formatPEN(n) {
  const val = Math.max(0, Math.round(Number(n) || 0));
  return `S/ ${val}`;
}

function safeImg(src) {
  return src && src.trim().length ? src : "assets/images/placeholder.jpg";
}

function categoriesFromProducts() {
  const set = new Set(PRODUCTS.map(p => p.category));
  return ["Todas", ...Array.from(set).sort((a,b)=>a.localeCompare(b))];
}

function filteredProducts() {
  const q = state.search.trim().toLowerCase();
  return PRODUCTS.filter(p => {
    const byCat = state.category === "Todas" || p.category === state.category;
    const bySearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    return byCat && bySearch;
  });
}

function cartTotal() {
  return state.cart.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
}

function finalTotal() {
  return Math.max(0, cartTotal() - (Number(state.discount) || 0));
}

function renderTabs() {
  const tabs = el("categoryTabs");
  tabs.innerHTML = "";
  const cats = categoriesFromProducts();

  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "tab" + (state.category === cat ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      state.category = cat;
      renderAll();
    };
    tabs.appendChild(btn);
  });
}

function renderGrid() {
  const grid = el("productGrid");
  grid.innerHTML = "";

  const items = filteredProducts();
  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-img">
        <img src="${safeImg(p.image)}" alt="${p.name}">
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-meta">
          <span class="badge">${p.category}</span>
          <span class="price">${formatPEN(p.price)}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn small ghost" data-action="zoom">Ver grande</button>
        <button class="btn small" data-action="add">Agregar</button>
      </div>
    `;

    card.querySelector('[data-action="add"]').onclick = () => addToCart(p);
    card.querySelector('[data-action="zoom"]').onclick = () => openModal(p);

    // Tap en tarjeta = ver grande (ideal para táctil)
    card.onclick = (e) => {
      if (e.target.closest("button")) return;
      openModal(p);
    };

    grid.appendChild(card);
  });

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No hay productos con ese filtro.";
    grid.appendChild(empty);
  }
}

function renderCart() {
  const list = el("cartItems");
  list.innerHTML = "";

  state.cart.forEach((p, idx) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div class="ci-left">
        <div class="ci-name">${p.name}</div>
        <div class="ci-sub">${p.category}</div>
      </div>
      <div class="ci-right">
        <div class="ci-price">${formatPEN(p.price)}</div>
        <button class="ci-remove" title="Quitar">✕</button>
      </div>
    `;

    // ✅ Click en la X: quitar
    li.querySelector(".ci-remove").onclick = (e) => {
      e.stopPropagation();       // evita que abra el modal
      removeAt(idx);
    };

    // ✅ Click en el item: abrir modal (como "Ver grande")
    li.onclick = () => openModal(p);

    list.appendChild(li);
  });

  el("cartTotal").textContent = formatPEN(cartTotal());
  el("finalTotal").textContent = formatPEN(finalTotal());
}

function renderAll() {
  renderTabs();
  renderGrid();
  renderCart();
}

function addToCart(product) {
  state.cart.push(product);
  renderCart();
}

function removeAt(index) {
  state.cart.splice(index, 1);
  renderCart();
}

function undoLast() {
  state.cart.pop();
  renderCart();
}

function clearCart() {
  state.cart = [];
  state.discount = 0;
  el("discountInput").value = 0;
  renderCart();
  showCopyNote("");
}

/* ✅ MODAL */
let modalProduct = null;

function openModal(product) {
  modalProduct = product;

  el("modalImg").src = safeImg(product.image);
  el("modalName").textContent = product.name;
  el("modalPrice").textContent = formatPEN(product.price);

  // ✅ render 5 puntos
  const ul = el("modalHighlights");
  ul.innerHTML = "";

  const highlights = Array.isArray(product.highlights) ? product.highlights : [];
  highlights.slice(0, 5).forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });

  // si faltan puntos, rellena para que siempre se vean 5 (opcional)
  const missing = 5 - ul.children.length;
  for (let i = 0; i < missing; i++) {
    const li = document.createElement("li");
    li.textContent = "—";
    li.style.opacity = "0.35";
    ul.appendChild(li);
  }

  el("modal").classList.remove("hidden");
}

function closeModal() {
  el("modal").classList.add("hidden");
  modalProduct = null;
}

/* Copiar texto */
function cartText() {
  const names = state.cart.map(p => p.name);
  const total = cartTotal();
  const disc = Number(state.discount) || 0;
  const final = finalTotal();

  return [
    `COMBO BuyPal (Live)`,
    `Productos: ${names.length ? names.join(" + ") : "(vacío)"}`,
    `Total: ${formatPEN(total)}`,
    `Descuento: ${formatPEN(disc)}`,
    `Final: ${formatPEN(final)}`
  ].join("\n");
}

function showCopyNote(msg) {
  el("copyNote").textContent = msg || "";
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(cartText());
    showCopyNote("✅ Copiado. Pégalo en WhatsApp si lo necesitas.");
    setTimeout(() => showCopyNote(""), 2500);
  } catch {
    showCopyNote("No se pudo copiar (permiso bloqueado).");
  }
}

/* Fullscreen */
async function goFullscreen() {
  try { await document.documentElement.requestFullscreen(); } catch {}
}

/* Eventos */
function bindEvents() {
  el("searchInput").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderGrid();
  });

  el("btnUndo").onclick = undoLast;
  el("btnClear").onclick = clearCart;

  el("btnApplyDiscount").onclick = () => {
    state.discount = Number(el("discountInput").value) || 0;
    renderCart();
  };

  el("discountInput").addEventListener("input", () => {
    state.discount = Number(el("discountInput").value) || 0;
    renderCart();
  });

  el("btnCopy").onclick = copyToClipboard;
  el("btnFull").onclick = goFullscreen;

  el("modalClose").onclick = closeModal;
  el("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  el("modalAdd").onclick = () => {
    if (modalProduct) addToCart(modalProduct);
    closeModal();
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key.toLowerCase() === "z") undoLast();
    if (e.key.toLowerCase() === "c") clearCart();
  });
}

function init() {
  bindEvents();
  renderAll();
}

init();
