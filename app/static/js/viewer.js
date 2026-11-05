/* Preview area: thumbnails, selection, compare views (slider / side by side / original / cutout), backgrounds. */
import { $, msg, openPicker } from "./utils.js";
import { state, active, cssBg } from "./state.js";
import { renderGallery } from "./gallery.js";

export function renderQueue() {
  const q = $("queue"); q.innerHTML = "";
  q.style.display = state.items.length > 1 ? "flex" : "none";
  for (const i of state.items) {
    const b = document.createElement("button");
    b.className = "th " + ({ done: "done", work: "work", fail: "fail" }[i.status] || "");
    b.setAttribute("aria-label", i.file.name);
    b.setAttribute("aria-current", i.id === state.cur);
    b.innerHTML = `<img alt="" loading="lazy" decoding="async" src="${i.res || i.orig}"><b></b>`;
    b.onclick = () => select(i.id);
    q.append(b);
  }
  const add = document.createElement("button");
  add.className = "add"; add.textContent = "+"; add.setAttribute("aria-label", "Add images"); add.onclick = openPicker;
  q.append(add);
  $("dlall").disabled = !state.items.some(i => i.res);
  $("run").disabled = !state.items.length;
  $("del").disabled = !active();
  $("views").classList.toggle("off", !state.items.length);
  renderGallery();
}

/* Applies the chosen compare view. Returns true when the slider had to fall back to side by side. */
function applyView() {
  const i = active(); if (!i) return false;
  const a = $("after"), b = $("before");
  const cropped = !!i.res && a.naturalWidth && b.naturalWidth &&
    Math.abs(a.naturalWidth / a.naturalHeight - b.naturalWidth / b.naturalHeight) > 0.01;  // "Crop to subject" changes the shape
  let v = state.view;
  if (!i.res) v = "orig";
  else if (v === "slider" && cropped) v = "side";
  const cmp = $("cmp");
  cmp.classList.remove("v-side", "v-orig", "v-cut");
  if (v !== "slider") cmp.classList.add("v-" + v);
  document.querySelectorAll("#views button").forEach(x => x.setAttribute("aria-pressed", x.dataset.view === state.view));
  return state.view === "slider" && v === "side";
}

export function select(id) {
  state.cur = id;
  const i = active();
  $("before").src = i.orig;
  $("after").src = i.res || i.orig;
  $("busy").style.display = (i.status === "work" || i.status === "wait") ? "grid" : "none";
  $("dl").disabled = $("copy").disabled = !i.res;
  setPos(i.res ? 50 : 100); applyBg(); applyView(); renderQueue();
  msg(i.status === "done" ? "Done. Use the view buttons to compare." : i.file.name, i.status === "done" ? "ok" : "");
}

/* Remove an image (default: the selected one) and show the next, or the empty state. */
export function removeItem(id = state.cur) {
  const idx = state.items.findIndex(i => i.id === id);
  if (idx < 0) return;
  const [i] = state.items.splice(idx, 1);
  i.ctl?.abort();
  URL.revokeObjectURL(i.orig); if (i.res) URL.revokeObjectURL(i.res);
  if (state.items.length) {
    if (state.cur === id) select(state.items[Math.min(idx, state.items.length - 1)].id); else renderQueue();
  } else {
    state.cur = null;
    $("cmp").style.display = "none"; $("drop").style.display = ""; $("busy").style.display = "none";
    $("dl").disabled = $("copy").disabled = true;
    renderQueue();
  }
  msg(`Removed ${i.file.name}`);
}

function setPos(p) {
  state.pos = Math.max(0, Math.min(100, p));
  $("before").style.clipPath = `inset(0 ${100 - state.pos}% 0 0)`;
  $("bar").style.left = state.pos + "%";
  $("bar").setAttribute("aria-valuenow", Math.round(state.pos));
}

export function applyBg() {
  $("cmp").style.background = cssBg();
  $("cmp").style.backgroundSize = "cover";
  $("cmp").classList.toggle("shadow", $("shadow").checked);
  renderGallery();
}

export function initViewer() {
  const cmp = $("cmp");
  const sliderOn = () => !/\bv-/.test(cmp.className);
  const move = e => { if (!sliderOn()) return; const b = cmp.getBoundingClientRect(); setPos((e.clientX - b.left) / b.width * 100); };
  cmp.addEventListener("pointerdown", e => { move(e); cmp.setPointerCapture(e.pointerId); cmp.onpointermove = move; });
  cmp.addEventListener("pointerup", () => cmp.onpointermove = null);
  $("bar").onkeydown = e => { if (e.key === "ArrowLeft") setPos(state.pos - 4); if (e.key === "ArrowRight") setPos(state.pos + 4); };

  document.querySelectorAll("#views button").forEach(b => b.onclick = () => { state.view = b.dataset.view; applyView(); });
  $("after").onload = $("before").onload = () => { if (applyView()) msg("Cropped to subject, so the slider is shown side by side."); };
  $("del").onclick = () => removeItem();
  document.addEventListener("cutout:delete", e => removeItem(e.detail));
  document.addEventListener("keydown", e => {
    if (e.key === "Delete" && !e.target.closest("input,select,textarea")) removeItem();
  });
  document.addEventListener("cutout:select", e => { select(e.detail); $("canvas").scrollIntoView({ behavior: "smooth", block: "center" }); });

  const press = b => document.querySelectorAll("#sw button").forEach(x => x.setAttribute("aria-pressed", x === b));
  document.querySelectorAll("#sw button").forEach(b => b.onclick = () => {
    press(b); state.bg = { t: b.dataset.t, a: b.dataset.a, b: b.dataset.b }; applyBg();
  });
  $("custom").oninput = e => { press(null); state.bg = { t: "solid", a: e.target.value }; applyBg(); };
  $("bgimg").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const im = new Image();
    im.onload = () => { state.bgImage = im; press(null); state.bg = { t: "img" }; applyBg(); };
    im.src = URL.createObjectURL(f);
  };
  $("shadow").onchange = applyBg;
}
