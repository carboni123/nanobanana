"""Tests for hello.py script."""

import sys
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent.parent / "scripts"
sys.path.insert(0, str(scripts_dir))

import hello


def test_greet_default():
    """Test greet with default name."""
    assert hello.greet() == "Hello, World!"


def test_greet_custom_name():
    """Test greet with custom name."""
    assert hello.greet("NanoBanana") == "Hello, NanoBanana!"


def test_greet_empty_string():
    """Test greet with empty string."""
    assert hello.greet("") == "Hello, !"
