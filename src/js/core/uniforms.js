// Light shared by every pen-hatched surface: the monitor, and the window (in the lake world, the sky).
import * as THREE from "three";
import { LOOK } from "../content/look.js";

export const U = {
  uMonPos: { value: new THREE.Vector3(0, 1.12, -1.78) },
  uMonI: { value: LOOK.monitorPower },
  uWinPos: { value: new THREE.Vector3(-2.35, 1.55, -0.9) },
  uWinI: { value: LOOK.nightWindow },
  uWinAtt: { value: 0.3 },
  uWinCol: { value: new THREE.Color(...LOOK.windowTint) },
  uColorMix: { value: 0 },
  uCam: { value: new THREE.Vector3() },
  uInk: { value: new THREE.Color(...LOOK.ink) },
  uLineBright: { value: LOOK.hatchLineBright },
};
