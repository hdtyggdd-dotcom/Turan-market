import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Preserve the approved eagle and ornaments, replacing only the old wordmark.
// Keep the source artwork intact for historical builds.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
execFileSync("magick", [
  path.join(root, "assets/images/cosmos-logo.png"),
  "-fill", "black", "-stroke", "none",
  "-draw", "rectangle 80,625 946,788 rectangle 180,825 844,884",
  "-gravity", "center", "-font", "DejaVu-Serif",
  "-pointsize", "155", "-fill", "#cbc9c4",
  "-stroke", "#74716c", "-strokewidth", "1",
  "-annotate", "+0+192", "COSMIS",
  "-alpha", "off", "-depth", "8",
  `PNG24:${path.join(root, "assets/images/cosmis-logo.png")}`,
]);
console.log("Cosmis logo prepared; original eagle artwork retained.");
