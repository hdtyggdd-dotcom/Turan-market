import importlib.util
from pathlib import Path
import struct
import unittest

spec = importlib.util.spec_from_file_location(
    "bundle_checks", Path(__file__).with_name("check-play-bundle.py"))
checks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checks)


def elf64(alignment, endian="<"):
    data = bytearray(120)
    data[:6] = b"\x7fELF\x02" + (b"\x01" if endian == "<" else b"\x02")
    struct.pack_into(endian + "Q", data, 32, 64)
    struct.pack_into(endian + "HH", data, 54, 56, 1)
    struct.pack_into(endian + "IIQQQQQQ", data, 64, 1, 5, 0, 0, 0, 0, 0, alignment)
    return data


class NativeAlignmentTests(unittest.TestCase):
    def test_16k_and_64k_load_segments_pass(self):
        for alignment in (16384, 65536):
            for endian in ("<", ">"):
                checks.check_elf(elf64(alignment, endian))

    def test_4k_load_segments_fail(self):
        with self.assertRaisesRegex(ValueError, "16 KB"):
            checks.check_elf(elf64(4096))

    def test_incongruent_addresses_fail(self):
        data = elf64(16384)
        struct.pack_into("<Q", data, 80, 4096)
        with self.assertRaisesRegex(ValueError, "16 KB"):
            checks.check_elf(data)

    def test_non_elf_and_no_load_segments_fail(self):
        with self.assertRaisesRegex(ValueError, "ELF"):
            checks.check_elf(b"not an ELF")
        data = elf64(16384)
        struct.pack_into("<I", data, 64, 0)
        with self.assertRaisesRegex(ValueError, "LOAD"):
            checks.check_elf(data)


if __name__ == "__main__":
    unittest.main()
