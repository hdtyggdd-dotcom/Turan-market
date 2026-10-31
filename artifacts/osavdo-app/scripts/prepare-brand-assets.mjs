import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// Reproduce exact-sized native/store derivatives without altering the original
// logo. ImageMagick must be available in the build environment.
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(appDir, "../..");
const config = JSON.parse(fs.readFileSync(path.join(appDir, "app.json"), "utf8")).expo;
const source = path.resolve(appDir, config.splash.image);
assert(fs.existsSync(source), "The approved brand logo must exist first");
const release = path.join(root, "release-assets/cosmis");
fs.mkdirSync(release, { recursive: true });
const icon = path.resolve(appDir, config.icon);
const foreground = path.resolve(appDir, config.android.adaptiveIcon.foregroundImage);
execFileSync("magick", [source, "-resize", "1024x1024!", "-alpha", "off", "-depth", "8", `PNG24:${icon}`]);
execFileSync("magick", [
  "-size", "1024x1024", "canvas:none", "(", source, "-resize", "704x704!", ")",
  "-gravity", "center", "-compose", "over", "-composite", "-depth", "8", `PNG32:${foreground}`,
]);
execFileSync("magick", [source, "-resize", "512x512!", "-alpha", "off", "-depth", "8",
  `PNG24:${path.join(release, "play-icon.png")}`]);
execFileSync("magick", [
  "-size", "1024x500", "canvas:black", "(", source, "-resize", "450x450!", ")",
  "-gravity", "NorthWest", "-geometry", "+20+25", "-compose", "over", "-composite",
  "-font", "DejaVu-Sans-Bold", "-fill", "white", "-pointsize", "34", "-annotate", "+500+105", config.name,
  "-font", "DejaVu-Sans", "-fill", "#dddddd", "-pointsize", "24", "-annotate", "+500+185",
  "Tovarlar va xizmatlar\nRasm orqali qidirish\nYuk tashish va buyurtmalar",
  "-alpha", "off", "-depth", "8", `PNG24:${path.join(release, "feature-graphic.png")}`,
]);
console.log("Native icons and 512×512 / 1024×500 store assets prepared for", config.name);
