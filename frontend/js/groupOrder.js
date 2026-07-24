let groupSocket = null;
let currentSession = null; // last known session state from server/socket

function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("deviceId", id);
  }
  return id;
}

function getSessionCodeFromUrl() {
  const match = window.location.search.match(/[?&]session=([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function getStoredHostToken(sessionCode) {
  return localStorage.getItem(`groupHost:${sessionCode}`);
}

function storeHostToken(sessionCode, hostToken) {
  localStorage.setItem(`groupHost:${sessionCode}`, hostToken);
}


async function initGroupOrder(tableNumber, bannerEl, onCartChanged) {
  const existingCode = getSessionCodeFromUrl();

  if (!existingCode) {
    renderStartBanner(tableNumber, bannerEl, onCartChanged);
    return false;
  }

  try {
    const { session } = await api.getGroupSession(existingCode);
    currentSession = session;
    connectGroupSocket(existingCode, bannerEl, onCartChanged);
    renderActiveBanner(existingCode, bannerEl, onCartChanged);
    return true;
  } catch (err) {
    bannerEl.innerHTML = `<p class="text-sm" style="color: var(--chili)">This group order link has expired or is invalid.</p>`;
    return false;
  }
}

function connectGroupSocket(sessionCode, bannerEl, onCartChanged) {
  groupSocket = connectToGroupSession(sessionCode, {
    onSessionUpdate: (session) => {
      currentSession = session;
      renderActiveBanner(sessionCode, bannerEl, onCartChanged);
      if (onCartChanged) onCartChanged();
    },
    onSessionConfirmed: (order) => {
      window.location.href = `order-status.html?table=${order.tableCode || order.tableNumber}`;
    },
  });


  setInterval(async () => {
    if (!groupSocket || !groupSocket.connected) {
      try {
        const { session } = await api.getGroupSession(sessionCode);
        currentSession = session;
        renderActiveBanner(sessionCode, bannerEl, onCartChanged);
        if (onCartChanged) onCartChanged();
      } catch (err) {
        
      }
    }
  }, 8000);
}

function renderStartBanner(tableNumber, bannerEl, onCartChanged) {
  bannerEl.innerHTML = `
    <p class="eyebrow mb-2">Ordering with friends?</p>
    <p class="text-sm mb-3" style="color: var(--charcoal-soft)">Start a group order — everyone at this table can add their own food from their own phone, then one person confirms it.</p>
    <button id="start-group-btn" class="btn-primary px-4 py-2 text-sm">Start a group order</button>
  `;
  bannerEl.querySelector("#start-group-btn").onclick = async () => {
    try {
      const deviceId = getDeviceId();
      const { sessionCode, hostToken } = await api.createGroupSession(tableNumber, deviceId);
      storeHostToken(sessionCode, hostToken);

      const url = new URL(window.location.href);
      url.searchParams.set("session", sessionCode);
      window.history.replaceState({}, "", url);

      currentSession = { sessionCode, tableNumber, items: [], status: "open" };
      connectGroupSocket(sessionCode, bannerEl, onCartChanged);
      renderActiveBanner(sessionCode, bannerEl, onCartChanged);
      const cartLink = document.getElementById("cart-link");
      if (cartLink) cartLink.style.display = "none";
    } catch (err) {
      alert(err.message);
    }
  };
}

function renderActiveBanner(sessionCode, bannerEl, onCartChanged) {
  const session = currentSession;
  if (!session) return;

  const isHost = getStoredHostToken(sessionCode) !== null;
  const total = (session.items || []).reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shareUrl = window.location.href;

  const itemsHtml = (session.items || []).length
    ? session.items.map((i) => `
        <div class="flex items-center justify-between text-sm py-1">
          <span>${i.quantity} × ${escapeHtmlLocal(i.name)} <span style="color: var(--charcoal-soft)">— added by ${escapeHtmlLocal(i.addedByName || "Guest")}</span></span>
          <span>₹${i.price * i.quantity}</span>
        </div>
      `).join("")
    : `<p class="text-sm" style="color: var(--charcoal-soft)">No items yet — add something from the menu below.</p>`;

  bannerEl.innerHTML = `
    <p class="eyebrow mb-2">Group order for Table ${session.tableNumber}</p>
    <div class="flex items-center gap-2 mb-3">
      <input readonly value="${shareUrl}" class="flex-1 px-2 py-1.5 rounded text-xs" style="border:1.5px solid var(--clay-line); background:var(--white); outline:none;" onclick="this.select()" />
      <button id="copy-link-btn" class="btn-secondary px-3 py-1.5 text-xs">Copy link</button>
    </div>
    <div class="mb-3">${itemsHtml}</div>
    <p class="text-sm font-semibold mb-3">Total: ₹${total}</p>
    ${
      isHost
        ? `<button id="confirm-group-btn" class="btn-primary px-4 py-2 text-sm" ${(session.items || []).length === 0 ? "disabled" : ""}>Confirm &amp; send to kitchen</button>`
        : `<p class="text-sm" style="color: var(--charcoal-soft)">Waiting for the host to confirm this order.</p>`
    }
    <p id="group-error" class="text-sm mt-2 hidden" style="color: var(--chili)"></p>
  `;

  bannerEl.querySelector("#copy-link-btn").onclick = () => {
    navigator.clipboard.writeText(shareUrl);
    const btn = bannerEl.querySelector("#copy-link-btn");
    const original = btn.textContent;
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = original), 1200);
  };

  const confirmBtn = bannerEl.querySelector("#confirm-group-btn");
  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      const hostToken = getStoredHostToken(sessionCode);
      const errorEl = bannerEl.querySelector("#group-error");
      try {
        await api.confirmGroupSession(sessionCode, hostToken);
        // onSessionConfirmed socket event (or fallback poll) will redirect everyone
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
      }
    };
  }
}

function getDisplayName() {
  let name = localStorage.getItem("displayName");
  if (!name) {
    name = (window.prompt("What's your name? (shown to others in this group order)") || "Guest").trim().slice(0, 40) || "Guest";
    localStorage.setItem("displayName", name);
  }
  return name;
}

// Returns true if it handled the add (group mode active)
async function groupOrderAddItem(menuItem) {
  if (!currentSession) return false;
  const sessionCode = currentSession.sessionCode;
  const deviceId = getDeviceId();
  const name = getDisplayName();

  await api.addSessionItem(sessionCode, menuItem._id, 1, deviceId, name);
  return true;
}

function escapeHtmlLocal(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}