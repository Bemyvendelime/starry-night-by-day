// Shared, mutable state. `S` is what the monitor shows, `G` is where the story is.

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

export const S = {
  compose: false, // mail window open on the monitor
  badge: true, // red badge visible
  pulse: false, // red badge pulsing
  done: [], // finished letter lines shown in the mail window
  cur: "", // the line being typed
  typing: false,
  dirty: true, // monitor needs a redraw
};

const savedStill = store.get("byeolbam:still");
export const G = {
  k: 0, // current beat
  still: savedStill ? savedStill === "1" : matchMedia("(prefers-reduced-motion: reduce)").matches,
  dropT: -1, // seconds since the drop fell, -1 = no drop
  badgeMisses: 0,
  hintOn: true,
  freeCam: false, // ?dev free camera
  povOn: false, // looking down into the lake
};
