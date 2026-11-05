/* Export: render with background/shadow, PNG/WebP/JPG, copy, and a dependency-free ZIP writer. */
import { $, msg, pathOf, load, save } from "./utils.js";
import { state, active } from "./state.js";

async function render(item, fmt) {
  const im = await load(item.res), c = document.createElement("canvas");
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext("2d"), W = c.width, H = c.height, { bg, bgImage } = state;
  const type = fmt === "jpeg" && bg.t === "none" ? "white" : bg.t;  // JPG has no transparency
  if (type === "white") { x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); }
  else if (type === "solid") { x.fillStyle = bg.a; x.fillRect(0, 0, W, H); }
  else if (type === "grad") {
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, bg.a); g.addColorStop(1, bg.b);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  } else if (type === "img") {
    const s = Math.max(W / bgImage.width, H / bgImage.height);
    x.drawImage(bgImage, (W - bgImage.width * s) / 2, (H - bgImage.height * s) / 2, bgImage.width * s, bgImage.height * s);
  }
  if ($("shadow").checked) {
    x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = Math.max(W, H) * .03; x.shadowOffsetY = Math.max(W, H) * .02;
  }
  x.drawImage(im, 0, 0);
  return new Promise(r => c.toBlob(r, "image/" + fmt, .95));
}

const fileName = (i, fmt) =>
  (pathOf(i.file).replace(/\.[^.]+$/, "") || "image") + "-cutout." + (fmt === "jpeg" ? "jpg" : fmt);

const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = u => { let c = ~0; for (let i = 0; i < u.length; i++) c = crcTable[(c ^ u[i]) & 255] ^ (c >>> 8); return ~c >>> 0; };

async function zip(files) {  // store-only ZIP (PNG/WebP/JPG are already compressed)
  const enc = new TextEncoder(), parts = [], cen = [];
  let off = 0, cs = 0;
  for (const f of files) {
    const d = new Uint8Array(await f.blob.arrayBuffer()), n = enc.encode(f.name), c = crc32(d);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint32(14, c, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, n.length, true);
    const e = new DataView(new ArrayBuffer(46));
    e.setUint32(0, 0x02014b50, true); e.setUint16(4, 20, true); e.setUint16(6, 20, true); e.setUint16(8, 0x0800, true);
    e.setUint32(16, c, true); e.setUint32(20, d.length, true); e.setUint32(24, d.length, true); e.setUint16(28, n.length, true); e.setUint32(42, off, true);
    parts.push(h, n, d); cen.push(e, n); off += 30 + n.length + d.length; cs += 46 + n.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cs, true); end.setUint32(16, off, true);
  return new Blob([...parts, ...cen, end], { type: "application/zip" });
}

export async function downloadItem(i) {
  const f = $("fmt").value;
  save(await render(i, f), fileName(i, f).split("/").pop());
}

export function initExport() {
  $("dl").onclick = () => downloadItem(active());
  $("dlall").onclick = async () => {
    const f = $("fmt").value, done = state.items.filter(x => x.res);
    if (done.length === 1) return save(await render(done[0], f), fileName(done[0], f).split("/").pop());
    msg("Packing ZIP…");
    const used = new Set(), files = [];
    for (const i of done) {
      let n = fileName(i, f);
      while (used.has(n)) n = n.replace(/(\.\w+)$/, "-2$1");
      used.add(n); files.push({ name: n, blob: await render(i, f) });
    }
    save(await zip(files), "cutouts.zip");
    msg(`ZIP ready with ${files.length} images.`, "ok");
  };
  $("copy").onclick = async () => {
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": await render(active(), "png") })]); msg("Copied to clipboard.", "ok"); }
    catch { msg("Your browser blocked copying. Use Download instead.", "err"); }
  };
}
