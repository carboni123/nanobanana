#!/usr/bin/env python3
"""
Verify Google Gemini API credentials for Imagen model access.

This script checks:
1. GOOGLE_API_KEY is set in environment
2. The API key is valid and can authenticate with Google
3. The API key has access to the Imagen 3 model for image generation
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.config import settings  # noqa: E402


def verify_api_key_configured() -> tuple[bool, str]:
    """Check if GOOGLE_API_KEY is configured in environment."""
    api_key = settings.google_api_key

    if not api_key:
        return False, "GOOGLE_API_KEY is not set in environment"

    if api_key == "your_google_api_key_here":
        return False, "GOOGLE_API_KEY is still set to the placeholder value"

    if len(api_key) < 20:
        return False, f"GOOGLE_API_KEY appears invalid (too short: {len(api_key)} chars)"

    # Google API keys typically start with "AIza"
    if not api_key.startswith("AIza"):
        return False, "GOOGLE_API_KEY doesn't match expected format (should start with 'AIza')"

    return True, f"GOOGLE_API_KEY is configured ({api_key[:10]}...)"


def verify_google_genai_installed() -> tuple[bool, str]:
    """Check if google-genai package is installed."""
    try:
        import google.genai
        return True, f"google-genai package is installed (version: {google.genai.__version__})"
    except ImportError as e:
        return False, f"google-genai package is not installed: {e}"


def verify_api_key_valid() -> tuple[bool, str]:
    """Verify the API key is valid by attempting to authenticate."""
    try:
        import google.genai as genai

        # Configure the client with our API key
        client = genai.Client(api_key=settings.google_api_key)

        # Try to list available models to verify authentication
        models = list(client.models.list())

        if not models:
            return False, "Authentication succeeded but no models are available"

        return True, f"API key is valid. Found {len(models)} available models"

    except Exception as e:
        error_msg = str(e)
        if "API key" in error_msg or "authentication" in error_msg.lower():
            return False, f"API key authentication failed: {error_msg}"
        return False, f"Error verifying API key: {error_msg}"


def verify_imagen_access() -> tuple[bool, str]:
    """Verify access to Imagen 3 model for image generation."""
    try:
        import google.genai as genai

        client = genai.Client(api_key=settings.google_api_key)

        # List all available models
        models = list(client.models.list())

        # Look for Imagen models
        imagen_models = [m for m in models if m.name and 'imagen' in m.name.lower()]

        if not imagen_models:
            available = [m.name for m in models if m.name]
            return False, f"No Imagen models found. Available models: {', '.join(available[:5])}"

        # Look specifically for Imagen 3
        imagen3_models = [m for m in imagen_models if m.name and '3' in m.name]

        model_names = [m.name for m in imagen_models if m.name]

        if imagen3_models:
            return True, f"✓ Imagen 3 model access confirmed. Available: {', '.join(model_names)}"
        else:
            return True, f"Imagen models found (but not v3): {', '.join(model_names)}"

    except Exception as e:
        return False, f"Error checking Imagen access: {e}"


def main():
    """Run all verification checks."""
    print("=" * 70)
    print("Google Gemini API Credentials Verification")
    print("=" * 70)
    print()

    checks = [
        ("Configuration Check", verify_api_key_configured),
        ("Package Installation", verify_google_genai_installed),
        ("API Key Validation", verify_api_key_valid),
        ("Imagen Model Access", verify_imagen_access),
    ]

    results = []

    for check_name, check_func in checks:
        print(f"Running: {check_name}...")
        try:
            success, message = check_func()
            results.append((check_name, success, message))

            status = "✓ PASS" if success else "✗ FAIL"
            print(f"  {status}: {message}")
            print()

            # Stop if a critical check fails
            if not success and check_name in ["Configuration Check", "Package Installation"]:
                print("Critical check failed. Cannot proceed with remaining checks.")
                break

        except Exception as e:
            results.append((check_name, False, f"Exception: {e}"))
            print(f"  ✗ FAIL: Exception occurred: {e}")
            print()
            break

    # Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)

    passed = sum(1 for _, success, _ in results if success)
    total = len(results)

    for check_name, success, message in results:
        status = "✓" if success else "✗"
        print(f"  {status} {check_name}: {message}")

    print()
    print(f"Result: {passed}/{total} checks passed")
    print("=" * 70)

    # Exit code
    if passed == total:
        print("\n✓ All checks passed! Google Gemini API is properly configured.")
        sys.exit(0)
    else:
        print("\n✗ Some checks failed. Please review the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
