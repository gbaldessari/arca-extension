// Relays requests from the content script and the popup to the Arca app over native messaging.
try {
  importScripts("i18n.js");
} catch {
  // Firefox loads i18n.js from the background scripts list.
}
const api = globalThis.browser ?? globalThis.chrome;
const HOST = "com.arca.vault";
const PENDING_TTL = 3 * 60 * 1000;

async function native(message) {
  try {
    return await api.runtime.sendNativeMessage(HOST, { ...message, lang: ARCA_LANG });
  } catch {
    return { error: arcaT("connectFailed") };
  }
}

const siteOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
};

// Captured credentials wait here (memory only) until the page asks whether to offer saving them.
const pendingKey = (tabId) => `pending:${tabId}`;
// The page that loads after a submit can ask before the capture is checked with Arca.
const capturing = new Map();

async function takePending(tabId) {
  const key = pendingKey(tabId);
  const pending = (await api.storage.session.get(key))[key];
  await api.storage.session.remove(key);
  return pending;
}

async function handle(message, sender) {
  // A page only ever acts on its own URL, as reported by the browser; the popup names the active tab.
  const tabId = sender.tab ? sender.tab.id : message.tabId;
  const url = sender.tab ? sender.url : tabId === undefined ? "" : (await api.tabs.get(tabId)).url;

  switch (message.type) {
    case "logins":
      return native({ type: "logins", url });
    case "fill":
    case "copy":
      return native({ type: message.type, url, id: message.id });
    case "generate":
      return native({ type: "generate" });
    case "open":
      return native({ type: "open" });
    case "unlock":
      return native({ type: "unlock", password: message.password });
    case "unlock_hello":
      return native({ type: "unlock_hello" });
    case "hello_status": {
      const status = await native({ type: "hello_status" });
      if (!status.error) await api.storage.local.set({ helloDefault: !!(status.available && status.enabled) });
      return status;
    }
    case "hello_default":
      return { enabled: !!(await api.storage.local.get("helloDefault")).helloDefault };
    case "copy_text":
      return native({ type: "copy_text", text: message.text });
    case "fillTab": {
      const login = await native({ type: "fill", url, id: message.id });
      if (!login.error) await api.tabs.sendMessage(tabId, { type: "fill", ...login });
      return login;
    }
    case "captured": {
      const { username, password } = message;
      const check = (async () => {
        const result = await native({ type: "save_status", url, username, password });
        if (result.status === "new" || result.status === "update") {
          const pending = { url, username, password, status: result.status, at: Date.now() };
          await api.storage.session.set({ [pendingKey(tabId)]: pending });
        }
        return result;
      })();
      capturing.set(tabId, check);
      try {
        return await check;
      } finally {
        if (capturing.get(tabId) === check) capturing.delete(tabId);
      }
    }
    case "pending": {
      await capturing.get(tabId);
      const key = pendingKey(tabId);
      const pending = (await api.storage.session.get(key))[key];
      const fresh = pending && Date.now() - pending.at < PENDING_TTL && siteOf(pending.url) === siteOf(url);
      return fresh ? { username: pending.username, status: pending.status } : null;
    }
    case "save": {
      const pending = await takePending(tabId);
      if (!pending) return { error: arcaT("nothingToSave") };
      const { username, password } = pending;
      return native({ type: "save", url: pending.url, username, password });
    }
    case "dismiss":
      await takePending(tabId);
      return null;
  }
  return { error: arcaT("unknownRequest") };
}

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== api.runtime.id) return;
  handle(message, sender).then(sendResponse, (error) => sendResponse({ error: String(error) }));
  return true;
});

api.tabs.onRemoved.addListener((tabId) => api.storage.session.remove(pendingKey(tabId)));
