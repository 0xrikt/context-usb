import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "fs";

const isWatch = process.argv.includes("--watch");

const buildOptions = {
  bundle: true,
  format: "esm",
  target: "chrome120",
  sourcemap: false,
  minify: !isWatch,
};

async function build() {
  // Ensure build directory exists
  mkdirSync("build/popup", { recursive: true });
  mkdirSync("build/background", { recursive: true });
  mkdirSync("build/content-scripts", { recursive: true });
  mkdirSync("build/icons", { recursive: true });

  // Build all entry points
  const entries = [
    {
      entryPoints: ["src/popup/popup.ts"],
      outfile: "build/popup/popup.js",
      ...buildOptions,
    },
    {
      entryPoints: ["src/background/service-worker.ts"],
      outfile: "build/background/service-worker.js",
      ...buildOptions,
    },
    {
      entryPoints: ["src/content-scripts/context-reader.ts"],
      outfile: "build/content-scripts/context-reader.js",
      ...buildOptions,
      format: "iife",
    },
    {
      entryPoints: ["src/content-scripts/injector.ts"],
      outfile: "build/content-scripts/injector.js",
      ...buildOptions,
      format: "iife",
    },
  ];

  for (const entry of entries) {
    if (isWatch) {
      const ctx = await esbuild.context(entry);
      await ctx.watch();
    } else {
      await esbuild.build(entry);
    }
  }

  // Copy static files
  cpSync("manifest.json", "build/manifest.json");
  cpSync("src/popup/popup.html", "build/popup/popup.html");
  cpSync("icons", "build/icons", { recursive: true });

  console.log(isWatch ? "Watching for changes..." : "Build complete!");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
