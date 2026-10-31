// The WebGL renderer, the main 3D scene and its camera. Everything else adds itself to `scene`.
import * as THREE from "three";

export const canvas = document.getElementById("gl");
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setClearColor(0x050506, 1);
renderer.autoClear = false;

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(50, 1, 0.03, 220);
