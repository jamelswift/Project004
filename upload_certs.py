#!/usr/bin/env python3
"""
Upload certificates to ESP32 SPIFFS partition
Usage: python upload_certs.py <COM_PORT> [--erase]
Example: python upload_certs.py COM3
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent
CERTS_DIR = PROJECT_ROOT / "certificates"
HARDWARE_DIR = PROJECT_ROOT / "hardware"

CERTIFICATES = {
    "esp32-relay-01-certificate.pem.crt": "/esp32-relay-01-certificate.pem.crt",
    "esp32-relay-01-private.pem.key": "/esp32-relay-01-private.pem.key",
    "AmazonRootCA1.pem": "/AmazonRootCA1.pem",
}

def check_dependencies():
    """Check if esptool.py is installed"""
    try:
        subprocess.run(["esptool.py", "--version"], capture_output=True, check=True)
        print("✓ esptool.py found")
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("ERROR: esptool.py not found")
        print("Install with: pip install esptool")
        sys.exit(1)

def check_certificates():
    """Check if all certificates exist"""
    print("\nChecking certificates...")
    all_exist = True
    
    for cert_file in CERTIFICATES.keys():
        cert_path = CERTS_DIR / cert_file
        if cert_path.exists():
            size = cert_path.stat().st_size
            print(f"  ✓ {cert_file} ({size} bytes)")
        else:
            print(f"  ✗ {cert_file} - NOT FOUND")
            all_exist = False
    
    if not all_exist:
        print("\nERROR: Some certificates are missing!")
        print(f"Expected location: {CERTS_DIR}")
        sys.exit(1)
    
    return True

def build_project(port):
    """Build the ESP32 project"""
    print("\n[1/3] Building project...")
    os.chdir(HARDWARE_DIR)
    
    result = subprocess.run(
        ["platformio", "run", "-e", "esp32dev"],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("ERROR: Build failed")
        print(result.stderr)
        sys.exit(1)
    
    print("✓ Build successful")

def upload_firmware(port):
    """Upload firmware to ESP32"""
    print("\n[2/3] Uploading firmware...")
    os.chdir(HARDWARE_DIR)
    
    result = subprocess.run(
        ["platformio", "run", "-e", "esp32dev", "-t", "upload", "--upload-port", port],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("ERROR: Upload failed")
        print(result.stderr)
        sys.exit(1)
    
    print("✓ Firmware uploaded")

def upload_spiffs(port):
    """Upload SPIFFS filesystem with certificates"""
    print("\n[3/3] Uploading SPIFFS with certificates...")
    
    # Find the SPIFFS image
    spiffs_bin = HARDWARE_DIR / ".pio" / "build" / "esp32dev" / "spiffs.bin"
    
    if not spiffs_bin.exists():
        print("ERROR: SPIFFS binary not found")
        print(f"Expected: {spiffs_bin}")
        print("\nYou may need to:")
        print("1. Install PlatformIO SPIFFS plugin: platformio pkg install --platform espressif32 --tool tool-mkspiffs")
        print("2. Or manually create SPIFFS using esptool.py")
        return False
    
    print(f"SPIFFS binary: {spiffs_bin}")
    
    # Upload using esptool.py
    # SPIFFS partition offset for ESP32 with huge_app.csv
    # Check your board's partition table for correct offset
    spiffs_offset = "0x291000"  # Default for huge_app.csv
    
    result = subprocess.run(
        ["esptool.py", "--port", port, "--baud", "921600", "write_flash", spiffs_offset, str(spiffs_bin)],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✓ SPIFFS uploaded")
        return True
    else:
        print("ERROR: SPIFFS upload failed")
        print(result.stderr)
        print("\nAlternative: Manually upload certificates:")
        print("  esptool.py --port COM3 write_flash 0x291000 <path-to-spiffs.bin>")
        return False

def erase_flash(port):
    """Erase ESP32 flash"""
    print("\nErasing flash...")
    result = subprocess.run(
        ["esptool.py", "--port", port, "erase_flash"],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✓ Flash erased")
    else:
        print("ERROR: Erase failed")
        print(result.stderr)

def main():
    parser = argparse.ArgumentParser(
        description="Upload ESP32 firmware and certificates to SPIFFS"
    )
    parser.add_argument("port", help="COM port (e.g., COM3)")
    parser.add_argument("--erase", action="store_true", help="Erase flash before upload")
    parser.add_argument("--no-build", action="store_true", help="Skip building (use existing binary)")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("ESP32 Firmware & Certificates Upload")
    print("=" * 50)
    print(f"Port: {args.port}")
    
    # Check dependencies
    check_dependencies()
    
    # Check certificates
    if not check_certificates():
        sys.exit(1)
    
    # Erase if requested
    if args.erase:
        erase_flash(args.port)
    
    # Build project
    if not args.no_build:
        build_project(args.port)
    
    # Upload firmware
    upload_firmware(args.port)
    
    # Upload SPIFFS
    upload_spiffs(args.port)
    
    print("\n" + "=" * 50)
    print("✓ Upload completed!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Open Serial Monitor: platformio device monitor -p COM3")
    print("2. ESP32 should connect to WiFi and AWS IoT Core")
    print("3. Check for 'Connected to AWS IoT Core' message")

if __name__ == "__main__":
    main()
