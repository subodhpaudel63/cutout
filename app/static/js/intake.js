/* Adding images. Single mode: one image at a time. Folder mode: whole folders (picker or drag-drop), many files, paste. */
import { $, msg, pathOf, openPicker } from "./utils.js";
import { state, active } from "./state.js";
import { renderQueue, select } from "./viewer.js";
import { opts, pump } from "./processing.js";

const MAX_BYTES = 20 * 1024 * 1024;
const isImage = f => /^image\/(png|jpe?g|webp)$/.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name);

export function setMode(m) {
  state.mode = m;
  const folder = m === "folder";
  document.querySelectorAll("#modes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === m));
  $("dropTitle").textContent = folder ? "Drop a folder here" : "Drop an image here";
  $("dropHint").textContent = folder ? "Subfolders are included. PNG, JPG or WebP, up to 20 MB each"
    : "Click to browse, or paste with Ctrl+V. PNG, JPG or WebP, up to 20 MB";
  $("pick").textContent = folder ? "Choose folder" : "Choose image";
  $("pickFiles").hidden = !folder;
  $("addBtn").textContent = folder ? "Add images" : "New image";
  $("file").multiple = folder;
}

function resetAll() {
  state.items.forEach(i => { i.ctl?.abort(); URL.revokeObjectURL(i.orig); if (i.res) URL.revokeObjectURL(i.res); });
  state.items = []; state.cur = null;
}

export function add(files) {
  files = [...files];
  const ok = files.filter(f => isImage(f) && f.size <= MAX_BYTES);
  if (!ok.length) return msg(files.length ? "No PNG, JPG or WebP images under 20 MB found." : "Nothing to add.", "err");
  if (state.mode === "single") { if (ok.length > 1) setMode("folder"); else resetAll(); }  // many files means folder mode
  ok.sort((a, b) => pathOf(a).localeCompare(pathOf(b), undefined, { numeric: true }));
  const o = opts(), first = state.items.length;  // one settings snapshot per batch keeps results consistent
  ok.forEach(f => state.items.push({ id: crypto.randomUUID(), file: f, orig: URL.createObjectURL(f), res: null, status: "wait", o }));
  $("drop").style.display = "none"; $("cmp").style.display = "inline-block";
  if (!active()) select(state.items[first].id); else renderQueue();
  const skipped = files.length - ok.length;
  msg(`${ok.length} image${ok.length > 1 ? "s" : ""} queued` + (skipped ? `, ${skipped} skipped (not images or over 20 MB)` : ""));
  pump();
}

async function walk(entry, out) {
  if (entry.isFile) {
    await new Promise(r => entry.file(f => { f.relPath = entry.fullPath.replace(/^\//, ""); out.push(f); r(); }, r));
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    let batch;
    do {
      batch = await new Promise(r => reader.readEntries(r, () => r([])));
      for (const e of batch) await walk(e, out);
    } while (batch.length);
  }
}

async function fromDrop(dt) {
  const entries = [...dt.items].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if (!entries.length) return [...dt.files];
  const out = [];
  for (const e of entries) await walk(e, out);
  if (entries.some(e => e.isDirectory)) setMode("folder");  // a dropped folder switches to folder mode
  return out;
}

export function initIntake() {
  const canvas = $("canvas"), drop = $("drop");
  document.querySelectorAll("#modes button").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  setMode("single");
  drop.onclick = e => { if (!e.target.closest("button")) openPicker(); };
  drop.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } };
  $("pick").onclick = openPicker;
  $("pickFiles").onclick = () => $("file").click();
  $("addBtn").onclick = openPicker;
  for (const id of ["file", "folder"]) $(id).onchange = e => { add(e.target.files); e.target.value = ""; };
  ["dragover", "dragenter"].forEach(n => canvas.addEventListener(n, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(n => canvas.addEventListener(n, e => { e.preventDefault(); drop.classList.remove("over"); }));
  canvas.addEventListener("drop", async e => add(await fromDrop(e.dataTransfer)));
  addEventListener("paste", e => { if (e.clipboardData.files.length) add(e.clipboardData.files); });
}
