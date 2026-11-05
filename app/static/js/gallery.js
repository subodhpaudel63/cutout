/* "Completed" grid: preview every finished cut-out, compare or download each one. */
import { $, pathOf } from "./utils.js";
import { state, cssBg } from "./state.js";
import { downloadItem } from "./exporter.js";

let lastKey = "";

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

export function renderGallery() {
  const done = state.items.filter(i => i.res), sec = $("results");
  sec.hidden = state.items.length < 2 || !done.length;
  const shadow = $("shadow").checked, bg = cssBg();
  const key = done.map(i => i.id + i.res).join() + "|" + bg + "|" + shadow + "|" + state.cur + "|" + state.items.length;
  if (key === lastKey) return;
  lastKey = key;
  $("rcount").textContent = `${done.length} of ${state.items.length} done`;
  const grid = $("rgrid"); grid.innerHTML = "";
  for (const i of done) {
    const card = el("article", "rc"), pick = el("button", "rimg" + (shadow ? " shadow" : ""));
    card.setAttribute("aria-current", i.id === state.cur);
    pick.setAttribute("aria-label", "Compare " + i.file.name);
    const wrap = el("span"), img = el("img");
    wrap.style.background = bg; img.src = i.res; img.alt = ""; img.loading = "lazy";
    wrap.append(img); pick.append(wrap);
    const show = () => document.dispatchEvent(new CustomEvent("cutout:select", { detail: i.id }));
    pick.onclick = show;
    const cmp = el("button", "btn sm", "Compare"), dl = el("button", "btn sm", "Download"), del = el("button", "btn sm x danger", "✕");
    del.setAttribute("aria-label", "Delete " + i.file.name); del.title = "Delete";
    cmp.onclick = show; dl.onclick = () => downloadItem(i);
    del.onclick = () => document.dispatchEvent(new CustomEvent("cutout:delete", { detail: i.id }));
    const name = el("span", "rname", pathOf(i.file)); name.title = pathOf(i.file);
    const meta = el("div", "rmeta"), acts = el("span", "racts");
    acts.append(cmp, dl, del); meta.append(name, acts);
    card.append(pick, meta); grid.append(card);
  }
}
