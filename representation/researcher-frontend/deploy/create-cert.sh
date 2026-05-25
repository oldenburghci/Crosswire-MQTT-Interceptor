#!/bin/sh

DIR="/usr/local/nginx/conf"
CERT_FILE="/usr/local/nginx/conf/cert.pem"
KEY_FILE="/usr/local/nginx/conf/key.pem"

# Check if the directory does not exist
if [ ! -d "$DIR" ]; then
    # Create the directory with the -p flag
    mkdir -p "$DIR"
    echo "Directory $DIR created."
else
    echo "Directory $DIR already exists."
fi

# Check if both files exist
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "One or both files are missing. Generating new SSL certificate and key..."

  # Generate self-signed SSL certificate and key
  openssl req -x509 -newkey rsa:4096 \
    -keyout $KEY_FILE \
    -out $CERT_FILE \
    -sha256 -days 365 -nodes \
    -subj "/C=DE/ST=LowerSaxony/L=Oldenburg/O=UniversityOfOldenburg/OU=DepartmentMultimedia/CN=localhost"

  echo "SSL certificate and key have been generated."
else
  echo "Both files exist. No action needed."
fi