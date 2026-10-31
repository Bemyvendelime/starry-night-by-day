// The painting: Vincent van Gogh, The Starry Night (1889, MoMA), public-domain image from Wikimedia Commons.
// The <img id="starryImg"> in index.html carries it, so the build can swap in a data URI.
import * as THREE from "three";

export const paintImg = document.getElementById("starryImg");
export const paintTex = new THREE.Texture(paintImg);
paintTex.minFilter = THREE.LinearMipmapLinearFilter;
paintTex.anisotropy = 8;
export const IMG_ASPECT = 1024 / 811;

export async function paintReady() {
  try { if (paintImg.decode) await paintImg.decode(); } catch {}
  paintTex.needsUpdate = true;
}
