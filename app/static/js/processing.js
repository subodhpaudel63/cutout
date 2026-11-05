/* Sends images to the server: 2 in parallel, each with its batch's settings snapshot. */
import { $, msg } from "./utils.js";
import { state, active } from "./state.js";
import { renderQueue, select } from "./viewer.js";

const MAX_PARALLEL = 2;
let running = 0;
const finished = () => state.items.filter(i => i.status === "done" || i.status === "fail").length;

export const opts = () => ({
  model: document.querySelector("input[name=model]:checked").value,
  refine: $("refine").value,
  matting: $("matting").checked ? "1" : "0",
  trim: $("trim").checked ? "1" : "0",
});

export function pump() {
  while (running < MAX_PARALLEL) {
    const i = state.items.find(x => x.status === "wait");
    if (!i) break;
    i.status = "work"; running++;
    work(i).finally(() => { running--; pump(); });
  }
  renderQueue();
}

async function work(i) {
  i.ctl = new AbortController();  // lets Delete cancel an upload in progress
  const fd = new FormData();
  fd.append("image", i.file);
  Object.entries(i.o).forEach(([k, v]) => fd.append(k, v));
  try {
    const r = await fetch("/api/remove", { method: "POST", body: fd, signal: i.ctl.signal });
    if (!r.ok) throw new Error((await r.json()).error || "Processing failed.");
    if (i.res) URL.revokeObjectURL(i.res);
    const blob = await r.blob();
    if (!state.items.includes(i)) return;  // deleted while processing
    i.res = URL.createObjectURL(blob);
    i.status = "done";
  } catch (e) { if (e.name === "AbortError") return; i.status = "fail"; msg(`${i.file.name}: ${e.message}`, "err"); }
  if (i.id === state.cur) { $("busy").style.display = "none"; i.status === "done" ? select(i.id) : renderQueue(); }
  else renderQueue();
  if (state.items.length > 1 && i.status === "done")
    msg(`${finished()} of ${state.items.length} processed`, finished() === state.items.length ? "ok" : "");
}

export function initProcessing() {
  const labels = ["Off", "Light", "Medium", "Strong"];
  $("refine").oninput = e => $("rv").textContent = labels[e.target.value];
  $("run").onclick = () => {
    const o = opts();
    state.items.forEach(i => { i.status = "wait"; i.o = o; });
    $("run").textContent = "Apply settings to all";
    if (active()) $("busy").style.display = "grid";
    pump();
  };
  document.querySelector(".side").addEventListener("input", e => {
    const t = e.target;
    if ((t.name === "model" || ["refine", "matting", "trim"].includes(t.id)) && state.items.some(i => i.res))
      $("run").textContent = "Re-run with new settings";
  });
}
