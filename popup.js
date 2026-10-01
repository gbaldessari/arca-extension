const api = globalThis.browser ?? globalThis.chrome;
const ask = (message) => api.runtime.sendMessage(message);
const $ = (id) => document.getElementById(id);
const [tab] = await api.tabs.query({ active: true, currentWindow: true });
$("privacy").textContent = arcaT("privacy");

const element = (tag, className = "", text = "") => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};

function note(text, icon = "alert") {
  const paragraph = element("p", "note", text);
  paragraph.prepend(arcaIcon(icon));
  return paragraph;
}

// Arca itself copies, so the password stays out of clipboard history and is cleared after 30 s.
function flashCopied(button) {
  button.replaceChildren(arcaIcon("check"));
  button.classList.add("done");
  setTimeout(() => {
    button.replaceChildren(arcaIcon("copy"));
    button.classList.remove("done");
  }, 1500);
}

function loginRow(login) {
  const row = element("div", "login");
  const text = element("div", "text");
  text.append(element("strong", "", login.title), element("span", "", login.username || arcaT("noUsername")));
  const fill = element("button", "primary", arcaT("fill"));
  const copy = element("button", "icon");
  copy.title = arcaT("copyPassword");
  copy.setAttribute("aria-label", arcaT("copyOf", login.title));
  copy.append(arcaIcon("copy"));
  fill.addEventListener("click", async () => {
    const result = await ask({ type: "fillTab", tabId: tab.id, id: login.id });
    if (result.error) $("logins").prepend(note(result.error));
    else window.close();
  });
  copy.addEventListener("click", async () => {
    const result = await ask({ type: "copy", tabId: tab.id, id: login.id });
    if (!result.error) flashCopied(copy);
  });
  row.append(text, fill, copy);
  return row;
}

async function prefersHello(closed) {
  if (closed) return !!(await ask({ type: "hello_default" })).enabled;
  const status = await ask({ type: "hello_status" });
  return !!(status.available && status.enabled);
}

async function showGate(state) {
  const list = $("logins");
  const closed = state === "cerrada";
  const preferred = await prefersHello(closed);
  const form = element("form", "gate");
  const password = element("input");
  password.type = "password";
  password.placeholder = arcaT("masterPassword");
  password.setAttribute("aria-label", arcaT("masterPassword"));
  password.autocomplete = "current-password";
  const error = element("p", "error");
  error.hidden = true;
  const submit = element("button", preferred ? "" : "primary", arcaT(closed ? "openWithPassword" : "usePassword"));
  const hello = element("button", preferred ? "primary" : "", "Windows Hello");
  hello.type = "button";
  const actions = element("div", "row");
  actions.append(...(preferred ? [hello, submit] : [submit, hello]));
  if (closed) {
    const open = element("button", "", arcaT("onlyOpen"));
    open.type = "button";
    open.addEventListener("click", async () => {
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
    showLogins();
  };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!password.value) return;
    submit.disabled = true;
    finish(await ask({ type: "unlock", password: password.value }));
  });
  hello.addEventListener("click", async () => {
    hello.disabled = true;
    error.hidden = false;
    error.textContent = arcaT("waitingHello");
    finish(await ask({ type: "unlock_hello" }));
  });
  list.replaceChildren(note(arcaT(closed ? "closed" : "locked"), closed ? "alert" : "lock"), form);
  if (!preferred) return password.focus();
  hello.disabled = true;
  error.hidden = false;
  error.textContent = arcaT("waitingHello");
  finish(await ask({ type: "unlock_hello" }));
}

async function showLogins() {
  const list = $("logins");
  const site = /^https?:/.test(tab?.url ?? "") ? new URL(tab.url).host : "";
  $("site").textContent = site || arcaT("noWebsite");
  if (!site) return list.replaceChildren(note(arcaT("openWebsite"), "key"));
  const response = await ask({ type: "logins", tabId: tab.id });
  if (response.error) return showGate("cerrada");
  if (response.locked) return showGate("bloqueada");
  if (!response.logins.length) return list.replaceChildren(note(arcaT("noLogins"), "key"));
  list.replaceChildren(...response.logins.map(loginRow));
}

async function generate() {
  const { password, error } = await ask({ type: "generate" });
  $("password").textContent = password ?? "";
  $("copy-generated").disabled = !password;
  if (error && !$("logins").querySelector(".note")) $("logins").replaceChildren(note(error));
}

$("generator-label").textContent = arcaT("securePassword");
$("regenerate").title = arcaT("regenerate");
$("regenerate").setAttribute("aria-label", arcaT("regenerate"));
$("copy-generated").title = arcaT("copy");
$("copy-generated").setAttribute("aria-label", arcaT("copyGenerated"));
document.querySelector(".generator")?.setAttribute("aria-label", arcaT("securePassword"));
$("regenerate").append(arcaIcon("refresh"));
$("copy-generated").append(arcaIcon("copy"));
$("regenerate").addEventListener("click", generate);
$("copy-generated").addEventListener("click", async () => {
  const result = await ask({ type: "copy_text", text: $("password").textContent });
  if (!result.error) flashCopied($("copy-generated"));
});

showLogins();
generate();
