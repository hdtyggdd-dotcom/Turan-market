import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(appDir, "../..");
const config = JSON.parse(fs.readFileSync(path.join(appDir, "app.json"), "utf8")).expo;
assert(config.name && !config.name.startsWith(".") && !config.name.endsWith("."), "Android Gradle project name cannot start or end with a dot");
assert.equal(config.android.package, "com.turanmarket.app", "Preserve the existing Android application identity");
assert(Number.isSafeInteger(config.android.versionCode) && config.android.versionCode > 0);
assert.match(config.version, /^\d+\.\d+\.\d+$/);
assert(!fs.existsSync(path.join(appDir, "app.config.ts")) && !fs.existsSync(path.join(appDir, "app.config.js")), "Expo configuration must remain static");
const plugin = config.plugins.find(item => Array.isArray(item) && item[0] === "expo-image-picker");
assert.equal(plugin?.[1]?.microphonePermission, false);
for (const permission of ["RECORD_AUDIO", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]) {
  assert(config.android.blockedPermissions.includes(`android.permission.${permission}`), `Unexpected broad permission: ${permission}`);
}

function checkPng(file, width, height, allowAlpha = false) {
  const bytes = fs.readFileSync(file);
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${file}: expected PNG`);
  assert.equal(bytes.readUInt32BE(16), width, `${file}: width`);
  assert.equal(bytes.readUInt32BE(20), height, `${file}: height`);
  assert.equal(bytes[24], 8, `${file}: expected 8-bit channels`);
  assert([2, ...(allowAlpha ? [6] : [])].includes(bytes[25]), `${file}: RGB${allowAlpha ? "/RGBA" : ", without alpha"}`);
}
checkPng(path.join(appDir, config.icon), 1024, 1024);
checkPng(path.join(appDir, config.android.adaptiveIcon.foregroundImage), 1024, 1024, true);
checkPng(path.join(root, "release-assets/turan-market/play-icon.png"), 512, 512);
checkPng(path.join(root, "release-assets/turan-market/feature-graphic.png"), 1024, 500);
const description = fs.readFileSync(path.join(appDir, "docs/store-listing-uz.txt"), "utf8");
const short = description.split("QISQA TAVSIF (80 belgigacha)\n")[1]?.split("\n")[0];
assert(short && [...short].length <= 80);
assert(fs.existsSync(path.join(appDir, "docs/play-console-guide.html")));
console.log("Android configuration and store-material checks passed.");
console.log("Preparation only: no signed AAB, native-device approval, account-deletion compliance or Google Play approval is implied.");
