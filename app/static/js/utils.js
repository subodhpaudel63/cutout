import { state } from "./state.js";

export const $ = id => document.getElementById(id);
export const msg = (t, c = "") => { $("msg").textContent = t; $("msg").className = "msg " + c; };
export const pathOf = f => f.relPath || f.webkitRelativePath || f.name;
export const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
export function save(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export const openPicker = () => $(state.mode === "folder" ? "folder" : "file").click();
