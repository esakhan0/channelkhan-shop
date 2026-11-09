#!/bin/sh
set -eu
umask 077

# The private volume is mounted ONLY by PostgreSQL. Medusa receives public trust only.
private_dir=${1:-/var/lib/postgresql/tls}
trust_dir=${2:-/var/lib/postgresql/trust}
mkdir -p "$private_dir/ca" "$private_dir/server" "$trust_dir"
chmod 700 "$private_dir" "$private_dir/ca" "$private_dir/server"
chmod 755 "$trust_dir"

ca="$private_dir/ca/ca.crt"
key="$private_dir/ca/ca.key"
if [ ! -e "$ca" ] && [ ! -e "$key" ]; then
  # Do not silently replace a previously published CA after a partial volume restore.
  if [ -e "$trust_dir/ca.crt" ] || [ -e "$private_dir/server/server.crt" ]; then
    echo 'Missing database CA. Restore the private TLS volume before starting.' >&2
    exit 1
  fi
  openssl req -x509 -newkey rsa:3072 -nodes -sha256 -days 3650 \
    -subj '/CN=Mukkys internal database CA' \
    -addext 'basicConstraints=critical,CA:TRUE' \
    -addext 'keyUsage=critical,keyCertSign,cRLSign' \
    -keyout "$key" -out "$ca"
fi
# Fail closed if a CA file is missing/corrupt/expired, or its private key differs.
openssl x509 -in "$ca" -checkend 31536000 -noout
openssl pkey -in "$key" -pubout -out "$private_dir/ca/key.pub"
openssl x509 -in "$ca" -pubkey -noout > "$private_dir/ca/cert.pub"
cmp "$private_dir/ca/key.pub" "$private_dir/ca/cert.pub"

server="$private_dir/server"
if [ ! -s "$server/server.crt" ] || ! openssl x509 -in "$server/server.crt" -checkend 2592000 -noout; then
  # Renew on startup when less than 30 days remain, preserving the CA.
  openssl req -new -newkey rsa:3072 -nodes -sha256 \
    -subj '/CN=postgres' -keyout "$server/server.key.next" -out "$server/server.csr"
  cat > "$server/extensions.cnf" <<'EXT'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:postgres
EXT
  openssl x509 -req -in "$server/server.csr" -CA "$ca" -CAkey "$key" \
    -set_serial "0x$(openssl rand -hex 16)" -days 365 -sha256 \
    -extfile "$server/extensions.cnf" -out "$server/server.crt.next"
  mv "$server/server.key.next" "$server/server.key"
  mv "$server/server.crt.next" "$server/server.crt"
fi
openssl verify -CAfile "$ca" -purpose sslserver -verify_hostname postgres "$server/server.crt"
openssl pkey -in "$server/server.key" -pubout -out "$server/key.pub"
openssl x509 -in "$server/server.crt" -pubkey -noout > "$server/cert.pub"
cmp "$server/key.pub" "$server/cert.pub"
chmod 600 "$key" "$server/server.key"
cp "$ca" "$trust_dir/ca.crt.next"
chmod 644 "$trust_dir/ca.crt.next"
mv "$trust_dir/ca.crt.next" "$trust_dir/ca.crt"
