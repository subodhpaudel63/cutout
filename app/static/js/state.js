/* Shared app state. items: {id, file, orig, res, status: wait|work|done|fail, o: settings snapshot}
   mode: "single" | "folder"   view: "slider" | "side" | "orig" | "cut" */
export const state = { items: [], cur: null, mode: "single", view: "slider", bg: { t: "none" }, bgImage: null, pos: 50 };
export const active = () => state.items.find(i => i.id === state.cur);
export const cssBg = () => {
  const { bg, bgImage } = state;
  return bg.t === "solid" ? bg.a : bg.t === "grad" ? `linear-gradient(135deg,${bg.a},${bg.b})`
    : bg.t === "img" ? `url(${bgImage.src})` : "transparent";
};
