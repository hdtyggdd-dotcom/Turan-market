"""Create an upload key in a disposable runner; export ONLY GitHub sealed boxes.

No private key, password, or plaintext keystore is ever printed or uploaded.
The repository's public encryption key cannot decrypt the exported payload.
"""
import base64
import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess
import tempfile


def main():
    from nacl.public import PublicKey, SealedBox

    public = json.loads(Path(".github/android-signing-public-key.json").read_text())
    box = SealedBox(PublicKey(base64.b64decode(public["key"], validate=True)))
    password = secrets.token_urlsafe(48)
    alias = "cosmis_upload"
    env = {**os.environ, "COSMIS_TEMP_KEY_PASSWORD": password}
    with tempfile.TemporaryDirectory() as temporary:
        keystore = Path(temporary) / "upload.p12"
        subprocess.run([
            "keytool", "-genkeypair", "-keystore", str(keystore),
            "-storetype", "PKCS12", "-alias", alias, "-keyalg", "RSA",
            "-keysize", "4096", "-validity", "10000",
            "-dname", "CN=Cosmis Upload,O=Cosmis,C=UZ",
            "-storepass:env", "COSMIS_TEMP_KEY_PASSWORD",
            "-keypass:env", "COSMIS_TEMP_KEY_PASSWORD",
        ], env=env, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        certificate = subprocess.check_output([
            "keytool", "-exportcert", "-keystore", str(keystore),
            "-alias", alias, "-storepass:env", "COSMIS_TEMP_KEY_PASSWORD",
        ], env=env, stderr=subprocess.DEVNULL)
        values = {
            "COSMIS_UPLOAD_KEYSTORE_BASE64": base64.b64encode(keystore.read_bytes()).decode(),
            "COSMIS_UPLOAD_STORE_PASSWORD": password,
            "COSMIS_UPLOAD_KEY_PASSWORD": password,
            "COSMIS_UPLOAD_KEY_ALIAS": alias,
        }
        encrypted = {
            name: base64.b64encode(box.encrypt(value.encode())).decode()
            for name, value in values.items()
        }
    output = Path("android-key-delivery")
    output.mkdir(exist_ok=True)
    (output / "sealed-upload-key.json").write_text(json.dumps({
        "key_id": public["key_id"],
        "source_revision": os.environ["GITHUB_SHA"],
        "certificate_sha256": hashlib.sha256(certificate).hexdigest(),
        "encrypted_secrets": encrypted,
    }))
    print("Upload key created. Export contains sealed ciphertext only, never a plaintext key.")


if __name__ == "__main__":
    main()
