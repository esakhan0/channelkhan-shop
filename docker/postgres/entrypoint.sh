#!/bin/sh
set -eu
if [ "${1:-}" = postgres ]; then
  /usr/local/share/mukky-postgres/prepare-certificates.sh
  # CA signing key remains root-only; PostgreSQL can read only its server key.
  chown root:postgres /var/lib/postgresql/tls
  chmod 750 /var/lib/postgresql/tls
  chown -R postgres:postgres /var/lib/postgresql/tls/server
  set -- "$@" \
    -c ssl=on \
    -c ssl_min_protocol_version=TLSv1.2 \
    -c ssl_cert_file=/var/lib/postgresql/tls/server/server.crt \
    -c ssl_key_file=/var/lib/postgresql/tls/server/server.key \
    -c hba_file=/usr/local/share/mukky-postgres/pg_hba.conf
fi
# Official entrypoint keeps the existing PGDATA; no database reinitialisation.
exec /usr/local/bin/docker-entrypoint.sh "$@"
