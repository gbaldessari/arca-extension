// Offers saved logins and strong passwords on login and sign-up forms, and offers to save what the
// user submits. Arca's UI lives in a closed shadow root the page cannot read, it only reacts to real
// user input, and a password only reaches the page when the user picks it.
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const ask = (message) =>
    api.runtime.sendMessage(message).catch(() => ({ error: arcaT("reloadPage") }));

  const STYLE = `
    :host { all: initial; }
    [hidden] { display: none !important; }
    .menu, .banner {
      position: fixed; z-index: 2147483647; box-sizing: border-box;
      font: 13px/1.4 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
      color: #e8ecf3; background: #141922; border: 1px solid #2b3445; border-radius: 12px;
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
      animation: arca-in 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .menu { padding: 6px; max-width: calc(100vw - 16px); }
    .banner { top: 16px; right: 16px; width: 340px; max-width: calc(100vw - 32px); padding: 14px; display: grid; gap: 10px; }
    .brand { display: flex; align-items: center; gap: 8px; padding: 2px 6px 6px; color: #aab4c5; font-size: 12px; font-weight: 700; }
    .item {
      all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 8px 10px; border-radius: 8px; cursor: pointer;
    }
    .item:hover, .item:focus-visible { background: #1f2735; }
    .item:focus-visible { outline: 2px solid #7aa7ff; outline-offset: -2px; }
    .item svg { color: #7aa7ff; flex: none; }
    .text { display: flex; flex-direction: column; min-width: 0; }
    .text strong, .text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .text strong { font-weight: 600; }
    .text small { color: #8a94a6; font-size: 12px; }
    .note { display: flex; align-items: center; gap: 8px; margin: 0; padding: 8px 10px; color: #8a94a6; }
    .banner p { margin: 0; }
    .banner .error { color: #ffb4b4; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .actions button {
      all: unset; padding: 7px 14px; border-radius: 8px; cursor: pointer;
      border: 1px solid #2b3445; background: #1a202b; font-weight: 600;
    }
    .actions button.primary { background: #2f6feb; border-color: #2f6feb; color: #fff; }
    .actions button:focus-visible { outline: 2px solid #7aa7ff; outline-offset: 2px; }
    .gate { display: grid; gap: 8px; padding: 2px 6px 8px; }
    .gate input {
      all: unset; box-sizing: border-box; width: 100%; padding: 8px 10px;
      border: 1px solid #2b3445; border-radius: 8px; background: #1a202b;
    }
    .gate .actions button { flex: 1; text-align: center; }
    .gate .error { margin: 0; color: #ffb4b4; font-size: 12px; }
    @keyframes arca-in { from { opacity: 0; transform: translateY(-4px); } }
    @media (prefers-color-scheme: light) {
      .menu, .banner { color: #141a24; background: #fff; border-color: #dce1ea; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.16); }
      .brand, .note, .text small { color: #5b6577; }
      .item:hover, .item:focus-visible { background: #eef2f8; }
      .item svg { color: #2559c9; }
      .actions button { background: #fff; border-color: #dce1ea; }
      .banner .error { color: #b4182c; }
      .gate input { border-color: #dce1ea; background: #fff; }
      .gate .error { color: #b4182c; }
    }
    @media (prefers-reduced-motion: reduce) { .menu, .banner { animation: none; } }
  `;

  const element = (tag, className = "", text = "") => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };
  const brand = () => {
    const row = element("div", "brand", "Arca");
    row.prepend(arcaLogo(16));
    return row;
  };

  const host = document.createElement("arca-helper");
  const shadow = host.attachShadow({ mode: "closed" });
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLE);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    shadow.append(element("style", "", STYLE));
  }
  const menu = element("div", "menu");
  const banner = element("div", "banner");
  menu.hidden = banner.hidden = true;
  banner.setAttribute("role", "dialog");
  shadow.append(menu, banner);
  document.documentElement.append(host);

  const TEXT_INPUTS = 'input:not([type]), input[type="text"], input[type="email"], input[type="tel"]';
  const visible = (el) => el.isConnected && el.getClientRects().length > 0;
  const scopeOf = (el) => el.form ?? document;
  const passwordsIn = (scope) => [...scope.querySelectorAll('input[type="password"]')].filter(visible);
  const usernameFor = (password) =>
    [...scopeOf(password).querySelectorAll(TEXT_INPUTS)]
      .filter((el) => visible(el) && el.compareDocumentPosition(password) & Node.DOCUMENT_POSITION_FOLLOWING)
      .pop();
  const isLoginField = (el) =>
    el instanceof HTMLInputElement &&
    (el.type === "password" ||
      (el.matches(TEXT_INPUTS) &&
        (/\busername\b/.test(el.autocomplete) || passwordsIn(scopeOf(el)).some((p) => usernameFor(p) === el))));
  const wantsNewPassword = (field) =>
    field.type === "password" &&
    (/new-password/.test(field.autocomplete) || passwordsIn(scopeOf(field)).length > 1);

  // Assigning through the prototype setter makes frameworks like React notice the change.
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  const setValue = (input, value) => {
    valueSetter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  function fill(field, { username, password }) {
    const passwordField = field?.type === "password" ? field : passwordsIn(field ? scopeOf(field) : document)[0];
    const usernameField = passwordField ? usernameFor(passwordField) : field;
    if (usernameField && username) setValue(usernameField, username);
    if (passwordField && password) setValue(passwordField, password);
  }

  // Menu under the focused login field

  let anchor = null;
  let helloInFlight = false;

  async function prefersHello(closed) {
    if (closed) return !!(await ask({ type: "hello_default" })).enabled;
    const status = await ask({ type: "hello_status" });
    return !!(status.available && status.enabled);
  }

  function place() {
    if (!anchor || menu.hidden) return;
    const box = anchor.getBoundingClientRect();
    const width = Math.min(Math.max(box.width, 280), innerWidth - 16);
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(8, Math.min(box.left, innerWidth - width - 8))}px`;
    menu.style.top = `${box.bottom + 6}px`;
  }

  function closeMenu() {
    menu.hidden = true;
    anchor = null;
  }

  function showItems(items) {
    const rows = items.map((item) => {
      if (!item.run) {
        const note = element("p", "note", item.note);
        if (item.icon) note.prepend(arcaIcon(item.icon));
        return note;
      }
      const button = element("button", "item");
      button.type = "button";
      const text = element("span", "text");
      text.append(element("strong", "", item.title), element("small", "", item.detail));
      button.append(arcaIcon(item.icon), text);
      button.addEventListener("click", (e) => e.isTrusted && item.run());
      return button;
    });
    menu.replaceChildren(brand(), ...rows);
    menu.hidden = false;
    place();
  }

  async function showGate(field, state) {
    const closed = state === "cerrada";
    const preferred = await prefersHello(closed);
    if (anchor !== field) return;
    const password = element("input");
    password.type = "password";
    password.placeholder = arcaT("masterPassword");
    password.setAttribute("aria-label", arcaT("masterPassword"));
    password.autocomplete = "current-password";
    const error = element("p", "error");
    error.hidden = true;
    const submit = element("button", preferred ? "" : "primary", arcaT(closed ? "openWithPassword" : "usePassword"));
    submit.type = "submit";
    const hello = element("button", preferred ? "primary" : "", "Windows Hello");
    hello.type = "button";
    const actions = element("div", "actions");
    actions.append(...(preferred ? [hello, submit] : [submit, hello]));
    if (closed) {
      const open = element("button", "", arcaT("onlyOpen"));
      open.type = "button";
      open.addEventListener("click", async (e) => {
        if (!e.isTrusted) return;
        open.disabled = true;
        const result = await ask({ type: "open" });
        open.disabled = false;
        if (result.error) {
          error.hidden = false;
          error.textContent = result.error;
        }
      });
      actions.append(open);
    }
    const form = element("form", "gate");
    form.append(password, error, actions);
    const finish = (result) => {
      password.value = "";
      submit.disabled = false;
      hello.disabled = false;
      if (result.error) {
        error.hidden = false;
        error.textContent = result.error;
        return;
      }
      openMenu(field);
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!e.isTrusted || !password.value) return;
      submit.disabled = true;
      finish(await ask({ type: "unlock", password: password.value }));
    });
    hello.addEventListener("click", async (e) => {
      if (!e.isTrusted) return;
      hello.disabled = true;
      error.hidden = false;
      error.textContent = arcaT("waitingHello");
      finish(await ask({ type: "unlock_hello" }));
    });
    const note = element("p", "note", arcaT(closed ? "closed" : "locked"));
    note.prepend(arcaIcon(closed ? "alert" : "lock"));
    menu.replaceChildren(brand(), note, form);
    menu.hidden = false;
    place();
    if (!preferred) return password.focus();
    if (helloInFlight) return;
    helloInFlight = true;
    hello.disabled = true;
    error.hidden = false;
    error.textContent = arcaT("waitingHello");
    const result = await ask({ type: "unlock_hello" });
    helloInFlight = false;
    if (anchor === field) finish(result);
  }

  async function openMenu(field) {
    anchor = field;
    showItems([{ note: arcaT("searching") }]);
    const response = await ask({ type: "logins" });
    if (anchor !== field) return;
    if (response.error || response.locked) return showGate(field, response.locked ? "bloqueada" : "cerrada");
    const items = [];
    if (wantsNewPassword(field)) {
      items.push({ icon: "wand", title: arcaT("useSecure"), detail: arcaT("generatedBy"), run: () => suggest(field) });
    }
    for (const login of response.logins) {
      items.push({ icon: "key", title: login.title, detail: login.username || arcaT("noUsername"), run: () => pick(field, login.id) });
    }
    if (!response.logins.length) items.push({ note: arcaT("noLogins") });
    showItems(items);
  }

  async function pick(field, id) {
    const login = await ask({ type: "fill", id });
    if (login.error) return showItems([{ icon: "alert", note: login.error }]);
    fill(field, login);
    closeMenu();
  }

  async function suggest(field) {
    const { password, error } = await ask({ type: "generate" });
    if (error) return showItems([{ icon: "alert", note: error }]);
    const fields = passwordsIn(scopeOf(field));
    const fresh = fields.filter((p) => /new-password/.test(p.autocomplete));
    // Without hints, a form with three password fields is "current, new, repeat".
    for (const target of fresh.length ? fresh : fields.length > 2 ? fields.slice(1) : fields) {
      setValue(target, password);
    }
    closeMenu();
  }

  document.addEventListener(
    "focusin",
    (e) => {
      if (e.isTrusted && e.target !== anchor && isLoginField(e.target)) openMenu(e.target);
    },
    true,
  );
  const closeUnlessFocused = () =>
    setTimeout(() => {
      if (document.activeElement !== anchor && document.activeElement !== host) closeMenu();
    }, 120);
  document.addEventListener("focusout", (e) => e.target === anchor && closeUnlessFocused(), true);
  host.addEventListener("focusout", closeUnlessFocused);
  document.addEventListener(
    "keydown",
    (e) => {
      if (menu.hidden) return;
      if (e.key === "Escape") closeMenu();
      if (e.key === "ArrowDown" && e.target === anchor) {
        e.preventDefault();
        menu.querySelector("button")?.focus();
      }
    },
    true,
  );
  menu.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const buttons = [...menu.querySelectorAll("button")];
    const next = buttons.indexOf(shadow.activeElement) + (e.key === "ArrowDown" ? 1 : -1);
    buttons[(next + buttons.length) % buttons.length]?.focus();
  });
  // Keeps focus in the page's field while the menu is clicked.
  // Keeps the page field focused while the menu is used, except when typing the master password.
  menu.addEventListener("mousedown", (e) => {
    if (e.target instanceof Element && e.target.closest("input")) return;
    e.preventDefault();
  });
  addEventListener("scroll", place, true);
  addEventListener("resize", place);

  // Offer to save submitted credentials

  let lastCaptured = "";

  function capture(scope) {
    const filled = passwordsIn(scope).filter((p) => p.value);
    if (!filled.length) return;
    const password = filled.find((p) => /new-password/.test(p.autocomplete)) ?? filled[filled.length > 2 ? 1 : 0];
    const username = usernameFor(password)?.value.trim() ?? "";
    const key = `${username}\n${password.value}`;
    if (key === lastCaptured) return;
    lastCaptured = key;
    ask({ type: "captured", username, password: password.value }).then(() => setTimeout(offerSave, 1200));
  }

  document.addEventListener("submit", (e) => capture(e.target), true);
  document.addEventListener(
    "click",
    (e) => {
      const button = e.target instanceof Element && e.target.closest('button, input[type="submit"]');
      if (button?.type === "submit") capture(scopeOf(button));
    },
    true,
  );
  document.addEventListener(
    "keydown",
    (e) => e.key === "Enter" && isLoginField(e.target) && capture(scopeOf(e.target)),
    true,
  );

  async function offerSave() {
    const pending = await ask({ type: "pending" });
    if (!pending?.status || !banner.hidden) return;
    const update = pending.status === "update";
    const question = update
      ? pending.username ? arcaT("updateFor", pending.username) : arcaT("updateSaved")
      : pending.username ? arcaT("saveFor", pending.username) : arcaT("saveNew");
    const later = element("button", "", arcaT("notNow"));
    const save = element("button", "primary", arcaT(update ? "update" : "save"));
    const actions = element("div", "actions");
    actions.append(later, save);
    banner.replaceChildren(brand(), element("p", "", question), actions);
    banner.hidden = false;

    later.addEventListener("click", (e) => {
      if (!e.isTrusted) return;
      ask({ type: "dismiss" });
      banner.hidden = true;
    });
    save.addEventListener("click", async (e) => {
      if (!e.isTrusted) return;
      const result = await ask({ type: "save" });
      banner.replaceChildren(brand(), element("p", result.error ? "error" : "", result.error ?? arcaT("savedInArca")));
      setTimeout(() => (banner.hidden = true), 2500);
    });
  }

  // Fill requested from the popup.
  api.runtime.onMessage.addListener((message) => {
    if (message.type !== "fill") return;
    const focused = document.activeElement;
    fill(isLoginField(focused) ? focused : null, message);
  });

  offerSave();
})();
