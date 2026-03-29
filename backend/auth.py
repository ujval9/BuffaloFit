"""
auth.py
-------
Simple authentication helpers.
bcrypt is the industry-standard way to store passwords safely.
We never store the real password — only a scrambled "hash" of it.
"""

import bcrypt


def hash_password(plain_password: str) -> str:
    """Turn a plain-text password into a bcrypt hash for safe storage."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain password matches the stored hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )
