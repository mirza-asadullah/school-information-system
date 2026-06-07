import base64
import hashlib

from app.core.config import settings


def _derive_key(secret: str) -> bytes:
    return hashlib.sha256(secret.encode("utf-8")).digest()


def encrypt_string(plain: str) -> str:
    key = _derive_key(settings.SECRET_KEY)
    plain_bytes = plain.encode("utf-8")
    cipher_bytes = bytes(b ^ key[i % len(key)] for i, b in enumerate(plain_bytes))
    return base64.urlsafe_b64encode(cipher_bytes).decode("utf-8")


def decrypt_string(token: str) -> str:
    try:
        cipher_bytes = base64.urlsafe_b64decode(token.encode("utf-8"))
    except (TypeError, ValueError) as exc:
        raise ValueError("Invalid encrypted data") from exc

    key = _derive_key(settings.SECRET_KEY)
    plain_bytes = bytes(b ^ key[i % len(key)] for i, b in enumerate(cipher_bytes))
    return plain_bytes.decode("utf-8")
