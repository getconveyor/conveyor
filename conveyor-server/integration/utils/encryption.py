"""
Encryption utilities for secure password and credential storage.

Uses Fernet symmetric encryption from the cryptography library.
The encryption key should be stored securely in environment variables.
"""

from cryptography.fernet import Fernet
from django.conf import settings
import base64
import logging

logger = logging.getLogger(__name__)


def get_encryption_key() -> bytes:
    """
    Get or create encryption key.

    In production, this should be stored in environment variables.
    The key should be generated once and reused for all encryption/decryption.

    Returns:
        bytes: The encryption key
    """
    key = getattr(settings, 'ENCRYPTION_KEY', None)

    if not key:
        logger.warning(
            "ENCRYPTION_KEY not found in settings. Generating a new key. "
            "This should only happen in development!"
        )
        # Generate new key (should only happen in development)
        key = Fernet.generate_key()
        # In production, this should be stored persistently

    # Ensure key is bytes
    if isinstance(key, str):
        key = key.encode()

    return key


def encrypt_password(password: str) -> str:
    """
    Encrypt a password for secure storage.

    Args:
        password: Plain text password to encrypt

    Returns:
        str: Base64-encoded encrypted password

    Example:
        >>> encrypted = encrypt_password("my_secret_password")
        >>> # Store encrypted in database
    """
    if not password:
        return ''

    try:
        f = Fernet(get_encryption_key())
        encrypted = f.encrypt(password.encode())
        # Return as base64 string for storage
        return base64.b64encode(encrypted).decode()
    except Exception as e:
        logger.error(f"Failed to encrypt password: {str(e)}")
        raise


def decrypt_password(encrypted_password: str) -> str:
    """
    Decrypt a password for use.

    Args:
        encrypted_password: Base64-encoded encrypted password

    Returns:
        str: Decrypted plain text password

    Example:
        >>> encrypted = "..."  # From database
        >>> password = decrypt_password(encrypted)
        >>> # Use password to connect
    """
    if not encrypted_password:
        return ''

    try:
        f = Fernet(get_encryption_key())
        # Decode from base64
        encrypted_bytes = base64.b64decode(encrypted_password)
        # Decrypt
        decrypted = f.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception as e:
        logger.error(f"Failed to decrypt password: {str(e)}")
        raise


def encrypt_dict(data: dict) -> str:
    """
    Encrypt a dictionary (useful for full credential objects).

    Args:
        data: Dictionary to encrypt

    Returns:
        str: Base64-encoded encrypted JSON string
    """
    if not data:
        return ''

    import json
    try:
        f = Fernet(get_encryption_key())
        json_str = json.dumps(data)
        encrypted = f.encrypt(json_str.encode())
        return base64.b64encode(encrypted).decode()
    except Exception as e:
        logger.error(f"Failed to encrypt dict: {str(e)}")
        raise


def decrypt_dict(encrypted_data: str) -> dict:
    """
    Decrypt a dictionary.

    Args:
        encrypted_data: Base64-encoded encrypted JSON string

    Returns:
        dict: Decrypted dictionary
    """
    if not encrypted_data:
        return {}

    import json
    try:
        f = Fernet(get_encryption_key())
        encrypted_bytes = base64.b64decode(encrypted_data)
        decrypted = f.decrypt(encrypted_bytes)
        return json.loads(decrypted.decode())
    except Exception as e:
        logger.error(f"Failed to decrypt dict: {str(e)}")
        raise
