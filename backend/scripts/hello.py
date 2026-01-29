#!/usr/bin/env python3
"""
Hello World Script

A simple hello world script for the NanoBanana project.
"""

import sys


def greet(name: str = "World") -> str:
    """Return a greeting message."""
    return f"Hello, {name}!"


def main() -> None:
    """Main entry point for the script."""
    name = sys.argv[1] if len(sys.argv) > 1 else "World"

    print(greet(name))
    print("\nWelcome to NanoBanana - Simple API for AI image generation!")


if __name__ == "__main__":
    main()
