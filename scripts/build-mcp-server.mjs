import { build } from "esbuild";

await build({
  entryPoints: ["dist/mcp/server.js"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "bridge/mcp-server.cjs",
  external: [],
  banner: {
    js: "#!/usr/bin/env node",
  },
});

console.log("Built bridge/mcp-server.cjs");
