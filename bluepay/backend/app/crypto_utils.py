"""
AES-256-GCM helpers used to decrypt the payment payload that the browser
encrypted with the Web Crypto API. Both sides use the same convention:
ciphertext = AES-GCM(plaintext) with the 16-byte auth tag appended at the
end, which is exactly what SubtleCrypto.encrypt() returns in the browser
and what `cryptography`'s AESGCM expects/produces here.
"""
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def generate_session_key() -> bytes:
    """32 random bytes = AES-256 key, shared between the two paired devices."""
    return os.urandom(32)


def key_to_hex(key: bytes) -> str:
    return key.hex()


def key_from_hex(key_hex: str) -> bytes:
    return bytes.fromhex(key_hex)


def decrypt_payload(key: bytes, iv_hex: str, ciphertext_hex: str) -> bytes:
    aesgcm = AESGCM(key)
    iv = bytes.fromhex(iv_hex)
    ciphertext = bytes.fromhex(ciphertext_hex)
    return aesgcm.decrypt(iv, ciphertext, None)
