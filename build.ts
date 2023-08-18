"use strict";

import * as fs from "node:fs";

import { buildSync } from "esbuild";

const targetBundleFiles = ["js/tools.ts"];
const targetNoBundleFiles = ["js/index.ts", "build.ts", "webpack.config.ts"];

if (fs.existsSync("./dist/js")) fs.rmSync("./dist/js", { recursive: true });

buildSync({
    allowOverwrite: true,
    bundle: true,
    entryPoints: targetBundleFiles,
    format: "cjs",
    outdir: "./dist/js",
    platform: "node",
    target: "esnext",
    tsconfig: "./tsconfig.json",
    sourcemap: true,
    sourcesContent: false,
    write: true,
});

buildSync({
    allowOverwrite: true,
    bundle: false,
    entryPoints: targetNoBundleFiles,
    format: "cjs",
    outdir: "./dist",
    platform: "node",
    target: "esnext",
    tsconfig: "./tsconfig.json",
    sourcemap: true,
    sourcesContent: false,
    write: true,
});
