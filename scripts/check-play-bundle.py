"""Verify generated Play metadata and 16 KB alignment of bundled 64-bit ELF files."""
import json
from pathlib import Path
import struct
import sys
import xml.etree.ElementTree as ET
import zipfile


def check_elf(data):
    if data[:4] != b"\x7fELF":
        raise ValueError("A native library is not an ELF file")
    endian = "<" if data[5] == 1 else ">"
    if data[4] == 2:
        offset = struct.unpack_from(endian + "Q", data, 32)[0]
        size, count = struct.unpack_from(endian + "HH", data, 54)
        layout = endian + "IIQQQQQQ"
        field_offsets = (2, 3, 7)
    else:
        offset = struct.unpack_from(endian + "I", data, 28)[0]
        size, count = struct.unpack_from(endian + "HH", data, 42)
        layout = endian + "IIIIIIII"
        field_offsets = (1, 2, 7)
    segments = 0
    for index in range(count):
        header = struct.unpack_from(layout, data, offset + index * size)
        if header[0] == 1:
            segments += 1
            file_offset, virtual_address, alignment = [header[i] for i in field_offsets]
            if alignment < 16384 or (virtual_address - file_offset) % 16384:
                raise ValueError("Native LOAD segment is not 16 KB aligned")
    if not segments:
        raise ValueError("Native library has no LOAD segments")


def main():
    bundle, manifest_path = sys.argv[1:]
    config = json.loads(Path("artifacts/osavdo-app/app.json").read_text())["expo"]
    manifest = ET.parse(manifest_path).getroot()
    android = "{http://schemas.android.com/apk/res/android}"
    assert manifest.attrib["package"] == config["android"]["package"], "Application ID mismatch"
    assert int(manifest.attrib[android + "versionCode"]) == config["android"]["versionCode"]
    assert manifest.attrib[android + "versionName"] == config["version"]
    sdk = manifest.find("uses-sdk")
    assert sdk is not None and int(sdk.attrib[android + "targetSdkVersion"]) >= 36
    declared = {item.attrib[android + "name"] for item in manifest.findall("uses-permission")}
    assert not declared.intersection(config["android"]["blockedPermissions"]), "Unexpected broad permission"
    with zipfile.ZipFile(bundle) as archive:
        libraries = [name for name in archive.namelist()
                     if name.endswith(".so") and "/lib/" in name
                     and any(f"/{abi}/" in name for abi in ("arm64-v8a", "x86_64"))]
        assert libraries, "No 64-bit native libraries found"
        for name in libraries:
            try:
                check_elf(archive.read(name))
            except ValueError as error:
                raise ValueError(f"{name}: {error}") from error
        assert any(name.startswith("META-INF/") and name.endswith(".RSA")
                   for name in archive.namelist()), "Missing upload signature"
    print(f"Verified {config['android']['package']}, version {config['version']}, target API >=36, "
          f"restricted permissions and 16 KB alignment for {len(libraries)} libraries.")
    print("Build verification is not real-device testing or Google Play approval.")


if __name__ == "__main__":
    main()
