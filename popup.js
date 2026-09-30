const api = globalThis.browser ?? globalThis.chrome;
const ask = (message) => api.runtime.sendMessage(message);
const $ = (id) => document.getElementById(id);
const [tab] = await api.tabs.query({ active: true, currentWindow: true });

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
  text.append(element("strong", "", login.title), element("span", "", login.username || "Sin usuario"));
  const fill = element("button", "primary", "Rellenar");
  const copy = element("button", "icon");
  copy.title = "Copiar contraseña";
  copy.setAttribute("aria-label", `Copiar la contraseña de ${login.title}`);
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

async function showLogins() {
  const list = $("logins");
  const site = /^https?:/.test(tab?.url ?? "") ? new URL(tab.url).host : "";
  $("site").textContent = site || "Sin sitio web";
  if (!site) return list.replaceChildren(note("Abre un sitio web para usar tus contraseñas.", "key"));
  const response = await ask({ type: "logins", tabId: tab.id });
  if (response.error) return list.replaceChildren(note(response.error));
  if (response.locked) return list.replaceChildren(note("Arca está bloqueada. Desbloquéala para ver tus contraseñas.", "lock"));
  if (!response.logins.length) return list.replaceChildren(note("Arca no tiene contraseñas para este sitio.", "key"));
  list.replaceChildren(...response.logins.map(loginRow));
}

async function generate() {
  const { password, error } = await ask({ type: "generate" });
  $("password").textContent = password ?? "";
  $("copy-generated").disabled = !password;
  if (error && !$("logins").querySelector(".note")) $("logins").replaceChildren(note(error));
}

$("regenerate").append(arcaIcon("refresh"));
$("copy-generated").append(arcaIcon("copy"));
$("regenerate").addEventListener("click", generate);
$("copy-generated").addEventListener("click", async () => {
  const result = await ask({ type: "copy_text", text: $("password").textContent });
  if (!result.error) flashCopied($("copy-generated"));
});

showLogins();
generate();
