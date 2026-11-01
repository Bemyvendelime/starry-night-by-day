// Bundle src/js into build/bundle.js. Only the three.js core stays outside (CDN, via the import map);
// its addons (GLTFLoader, SkeletonUtils, OrbitControls) are bundled from node_modules.
import { build } from "esbuild";

await build({
  entryPoints: ["src/js/main.js"],
  bundle: true,
  format: "esm",
  outfile: "build/bundle.js",
  charset: "utf8",
  legalComments: "none",
  logLevel: "warning",
  plugins: [{
    name: "three-core-from-cdn",
    setup(b) { b.onResolve({ filter: /^three$/ }, () => ({ path: "three", external: true })); },
  }],
});

// the no-WebGL picture version: content only, no three.js, so it runs where the 3D page cannot
await build({
  entryPoints: ["src/js/fallback.js"],
  bundle: true,
  format: "esm",
  outfile: "build/fallback.js",
  charset: "utf8",
  legalComments: "none",
  logLevel: "warning",
});
