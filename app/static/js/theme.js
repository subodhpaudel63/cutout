const root = document.documentElement;
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

export function initTheme() {
  const acc = store.get("acc");
  root.dataset.theme = store.get("theme") || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
  root.dataset.acc = ["lime", "orange"].includes(acc) ? acc : "lime";
  const dots = document.querySelectorAll(".dots button");
  const sync = () => dots.forEach(b => b.setAttribute("aria-pressed", b.dataset.acc === root.dataset.acc));
  sync();
  document.getElementById("theme").onclick = () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    store.set("theme", root.dataset.theme);
  };
  dots.forEach(b => b.onclick = () => { root.dataset.acc = b.dataset.acc; store.set("acc", b.dataset.acc); sync(); });
}
