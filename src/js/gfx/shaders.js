// GLSL. Every shader the piece uses, in one place.

/* Pen hatching (after Every Joule's ej_hatch): light becomes line width, lines keep their width on screen,
   a finer level fades in close up, and far away the lines turn into a flat tone. */
export const HATCH_V = /* glsl */ `
varying vec3 vW; varying vec3 vN;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const HATCH_F = /* glsl */ `
uniform vec3 uMonPos; uniform float uMonI; uniform vec3 uWinPos; uniform float uWinI; uniform float uWinAtt;
uniform vec3 uWinCol; uniform float uColorMix; uniform vec3 uCam; uniform vec3 uInk; uniform float uLineBright;
uniform float uRim; uniform float uBase; uniform float uSeed; uniform float uSp; uniform float uGain;
varying vec3 vW; varying vec3 vN;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float lineAt(float h, float cover) {
  float fw = max(fwidth(h), 1e-4);
  float f = abs(fract(h) - 0.5);
  float hw = 0.5 * cover;
  return 1.0 - smoothstep(hw - fw * 0.75, hw + fw * 0.75, f);
}
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(uCam - vW);
  vec3 lm = uMonPos - vW; float dm = length(lm); lm /= dm;
  // a screen throws its light forward: behind the monitor the wall stays dark
  float cone = mix(0.08, 1.0, smoothstep(-0.05, 0.35, dot(-lm, vec3(0.0, 0.0, 1.0))));
  float im = uMonI * cone * max(dot(n, lm), 0.0) / (1.0 + dm * dm * 2.6);
  vec3 lw = uWinPos - vW; float dw = length(lw); lw /= dw;
  float iw = uWinI * max(dot(n, lw), 0.0) / (1.0 + dw * dw * uWinAtt);
  float L = clamp(im + iw, 0.0, 1.0);
  float rim = uRim * pow(1.0 - max(dot(n, v), 0.0), 3.0) * clamp(im * 2.5 + iw * 2.0 + 0.12, 0.0, 1.0);
  float G = L * uGain;
  vec3 dA = normalize(vec3(0.62, 0.74, 0.45)), dB = normalize(vec3(-0.7, 0.4, 0.6));
  float hA = dot(vW, dA) / uSp + 0.12 * (noise(vW * 9.0 + uSeed) - 0.5);
  float hB = dot(vW, dB) / (uSp * 0.85) + 0.12 * (noise(vW * 7.0 + uSeed + 3.0) - 0.5);
  float cA = lineAt(hA, clamp(G * 0.75, 0.0, 0.55));
  float cB = lineAt(hB, clamp((G - 0.55) * 1.0, 0.0, 0.45));
  float brk = smoothstep(0.22, 0.34, noise(vec3(floor(hA) * 2.31 + uSeed, dot(vW, vec3(0.3, -0.5, 0.8)) * 6.0, 0.5)));
  float c = max(cA * mix(1.0, brk, 0.35), cB);
  float fwA = fwidth(hA);
  float fine = smoothstep(0.12, 0.05, fwA);
  c = max(c, lineAt(hA * 2.0, clamp(G * 0.6, 0.0, 0.45)) * fine * 0.8);
  c = mix(c, G * 0.4, smoothstep(0.3, 0.9, fwA));
  float wmix = clamp(iw / (im + iw + 1e-4), 0.0, 1.0) * uColorMix;
  vec3 ink = mix(uInk, uWinCol, wmix);
  gl_FragColor = vec4(ink * (c * uLineBright + uBase * L) + mix(ink, uWinCol, uColorMix) * rim, 1.0);
}`;

/* The painting on a surface: the window, the backdrop of the lake. It opens out from the big swirl
   (uReveal), takes on colour (uSat) and its strokes keep moving (uMotion). */
export const SKY_V = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const SKY_F = /* glsl */ `
uniform sampler2D uPaint; uniform float uTime; uniform float uReveal; uniform float uSat; uniform float uMotion; uniform vec4 uCrop; uniform float uBright;
varying vec2 vUv;
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash2(i), hash2(i+vec2(1,0)), f.x), mix(hash2(i+vec2(0,1)), hash2(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec2 p = uCrop.xy + vUv * uCrop.zw;
  vec2 d = vec2(sin(p.y * 31.0 + uTime * 0.9 + sin(p.x * 12.0)), cos(p.x * 27.0 - uTime * 0.7 + sin(p.y * 9.0)));
  vec3 pc = texture2D(uPaint, clamp(p + d * 0.0045 * uMotion, 0.001, 0.999)).rgb;
  float g = dot(pc, vec3(0.299, 0.587, 0.114));
  vec3 painted = mix(vec3(g), pc, uSat) * uBright;
  vec2 sp = vUv * vec2(42.0, 48.0);
  float st = step(0.985, hash2(floor(sp))) * smoothstep(0.32, 0.0, length(fract(sp) - 0.5));
  vec3 night = mix(vec3(0.012), vec3(0.05), vUv.y) + st * 0.7;
  float field = 1.0 - length((vUv - vec2(0.38, 0.6)) * vec2(1.0, 1.15)) * 1.25 + 0.18 * (vnoise(vUv * 5.0) - 0.5);
  float m = smoothstep(1.0 - uReveal - 0.22, 1.0 - uReveal + 0.08, field);
  if (uReveal >= 0.999) m = 1.0;
  gl_FragColor = vec4(mix(night, painted, m), 1.0);
}`;

/* The lake: the view ray is mirrored on the water and meets the backdrop plane, so the water shows the painting. */
export const WATER_F = /* glsl */ `
uniform sampler2D uPaint; uniform float uTime; uniform vec3 uCam; uniform vec3 uPC; uniform vec2 uPS;
varying vec3 vW;
void main(){
  vec3 d = normalize(vW - uCam);
  vec2 wv = vec2(sin(vW.x * 1.7 + uTime * 0.9) + sin(vW.z * 2.3 - uTime * 1.1), cos(vW.z * 1.9 + uTime * 0.8) + cos((vW.x + vW.z) * 1.3 - uTime));
  vec3 n = normalize(vec3(wv.x * 0.025, 1.0, wv.y * 0.025));
  vec3 r = reflect(d, n);
  float t = (uPC.z - vW.z) / min(r.z, -1e-3);
  vec3 Q = vW + r * t;
  vec2 uv = vec2((Q.x - uPC.x) / uPS.x + 0.5, (Q.y - uPC.y) / uPS.y + 0.5);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec3 c = mix(vec3(0.02, 0.03, 0.06), texture2D(uPaint, clamp(uv, 0.001, 0.999)).rgb, inside);
  float fres = 0.35 + 0.65 * pow(1.0 - max(-d.y, 0.0), 3.0);
  gl_FragColor = vec4(mix(vec3(0.01, 0.015, 0.03), c * 0.82, fres), 1.0);
}`;

/* Brush strokes drifting round the swirls in the air of the painting. One point = one short stroke,
   turned along the way it is moving. */
export const STROKE_V = /* glsl */ `
attribute vec3 aCenter; attribute float aR; attribute float aPhase; attribute float aW; attribute vec3 aColor; attribute float aSize;
uniform float uTime; uniform float uPx;
varying vec3 vColor; varying float vAng; varying float vFade;
void main(){
  float a = aPhase + uTime * aW;
  vec3 p = aCenter + vec3(cos(a) * aR, sin(a) * aR * 0.62, sin(a * 0.5) * 0.3);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPx / -mv.z;
  vec3 tg = vec3(-sin(a), cos(a) * 0.62, 0.0) * sign(aW);
  vec4 p2 = projectionMatrix * modelViewMatrix * vec4(p + tg * 0.2, 1.0);
  vec2 dd = p2.xy / p2.w - gl_Position.xy / gl_Position.w;
  vAng = atan(dd.y, dd.x);
  vColor = aColor;
  vFade = smoothstep(1.5, 5.0, -mv.z);
}`;
export const STROKE_F = /* glsl */ `
uniform float uOpacity; varying vec3 vColor; varying float vAng; varying float vFade;
void main(){
  vec2 q = gl_PointCoord - 0.5; q.y = -q.y;
  float c = cos(-vAng), s = sin(-vAng);
  vec2 r = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  float d = length(vec2(max(abs(r.x) - 0.34, 0.0), r.y));
  float m = smoothstep(0.07, 0.035, d);
  if (m < 0.01) discard;
  gl_FragColor = vec4(vColor, m * uOpacity * vFade);
}`;

/* Big stars with rings, the way Van Gogh paints them. */
export const STAR_V = /* glsl */ `
attribute float aSize; attribute float aSeed; uniform float uPx; varying float vSeed;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uPx / -mv.z; vSeed = aSeed; }`;
export const STAR_F = /* glsl */ `
uniform float uTime; varying float vSeed;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float pulse = 0.85 + 0.15 * sin(uTime * 1.7 + vSeed * 6.0);
  float core = smoothstep(0.22, 0.0, d);
  float ring = 0.55 * smoothstep(0.05, 0.0, abs(d - 0.55 - 0.04 * sin(uTime * 1.3 + vSeed)));
  float glow = exp(-d * 4.0) * 0.5;
  float a = (core + ring + glow) * pulse * smoothstep(1.0, 0.85, d);
  gl_FragColor = vec4(vec3(1.0, 0.88, 0.5) * a, a);
}`;

/* The full-screen layer. Mode 0: the painting up close. Mode 1: looking down into the lake, rings from one drop,
   the sky upside down, and a figure in the water: the grown-up (mask A) turning into the waving child (mask B). */
export const OV_V = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
export const OV_F = /* glsl */ `
uniform sampler2D uPaint; uniform sampler2D uMaskA; uniform sampler2D uMaskB;
uniform float uTime; uniform float uMode; uniform float uOpacity; uniform float uAspect; uniform float uImg;
uniform float uDrop; uniform vec2 uDropC; uniform float uMaskMix; uniform float uZoom; uniform float uSpark; uniform float uGlow;
varying vec2 vUv;
vec2 cover(vec2 uv, float zoom) {
  vec2 c = uv - 0.5;
  if (uAspect > uImg) c.y *= uImg / uAspect; else c.x *= uAspect / uImg;
  c /= zoom;
  return c + vec2(0.5) + vec2(-0.08, 0.06) * (zoom - 1.0) * 4.0;
}
void main() {
  vec2 uv = vUv;
  vec3 col;
  if (uMode < 0.5) {
    vec2 p = cover(uv, 1.0 + uZoom);
    vec2 d = vec2(sin(p.y * 31.0 + uTime * 0.9 + sin(p.x * 12.0)), cos(p.x * 27.0 - uTime * 0.7 + sin(p.y * 9.0)));
    col = texture2D(uPaint, clamp(p + d * 0.0035, 0.001, 0.999)).rgb;
  } else {
    vec2 q = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
    vec2 c0 = vec2((uDropC.x - 0.5) * uAspect, uDropC.y - 0.5);
    vec2 dv = q - c0; float r = length(dv);
    float w = 0.0;
    if (uDrop >= 0.0) w = sin(r * 55.0 - uDrop * 7.5) * exp(-r * 2.2) * exp(-uDrop * 0.75) * smoothstep(uDrop * 0.28 + 0.03, uDrop * 0.28 - 0.1, r);
    vec2 disp = (r > 1e-4 ? dv / r : vec2(0.0)) * w * 0.028;
    disp += 0.0022 * vec2(sin(uv.y * 40.0 + uTime * 1.3), cos(uv.x * 37.0 + uTime * 1.1));
    vec2 s = uv + disp;
    vec2 pu = vec2(0.12 + s.x * 0.62, 0.38 + (1.0 - s.y) * 0.58);
    vec3 sky = texture2D(uPaint, clamp(pu, 0.001, 0.999)).rgb;
    col = sky * mix(0.5, 0.92, s.y) + vec3(0.0, 0.01, 0.03);
    vec2 mu = vec2((s.x - 0.5) * uAspect / 1.05 + 0.5, s.y * 1.02);
    float inside = step(0.0, mu.x) * step(mu.x, 1.0) * step(mu.y, 1.0);
    float mA = texture2D(uMaskA, clamp(mu, 0.0, 1.0)).a;
    float mB = texture2D(uMaskB, clamp(mu, 0.0, 1.0)).a;
    float halo = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398;
      halo += texture2D(uMaskB, clamp(mu + vec2(cos(a), sin(a)) * 0.03, 0.0, 1.0)).a;
    }
    halo = clamp(halo / 8.0 - mB, 0.0, 1.0) * 1.4; // light only round the outside of the child
    float m = mix(mA, mB, uMaskMix) * inside;
    col = mix(col, vec3(0.012, 0.016, 0.03), m * 0.93);
    col += vec3(1.0, 0.82, 0.42) * halo * uMaskMix * uGlow * inside * 0.55;
    col = mix(col, vec3(0.006), smoothstep(0.09, 0.0, uv.y));
    col += vec3(1.0, 0.85, 0.45) * uSpark * exp(-length(q - vec2(0.0, 0.33)) * 40.0);
  }
  gl_FragColor = vec4(col, uOpacity);
}`;
