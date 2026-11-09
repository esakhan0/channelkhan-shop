# PostgreSQL TLS on the existing Coolify service

This change keeps PostgreSQL 15 and the existing `postgres_data:/var/lib/postgresql/data` mount. It changes the image wrapper and connection configuration, not the database schema or data. Do not delete/recreate the Coolify resource, change its Compose project name, remove storage, or run `docker compose down -v`.

Coolify's HTTPS certificate protects browser-to-site/API requests. PostgreSQL uses its own TLS listener and internal CA; it must not be published as an HTTP domain or exposed to the internet on port 5432.

## Before the first deployment

1. Take a database backup and confirm it can be restored. Preserve the existing Coolify persistent storage mapping and PostgreSQL password. Keep uploads and the previous deployment configuration too.
2. Confirm the current resource uses this repository's Compose file and the existing PostgreSQL 15 volume. If it is a separately managed Coolify database, do not deploy a second database: configure TLS on that resource instead.
3. The wrapper requires the existing database login to use SCRAM passwords. PostgreSQL 15 normally uses these. An administrator can check without displaying the password hash:
   `SELECT rolname, rolpassword LIKE 'SCRAM-SHA-256$%' AS uses_scram FROM pg_authid WHERE rolname = current_user;`
   If false, set password encryption to `scram-sha-256` and reset the role password securely, updating the matching Coolify secret before deployment. Do not paste credentials into logs or chat.
4. Rebuild/redeploy the existing Compose resource. Allow a brief outage while PostgreSQL restarts. Do not use the reset/delete-storage controls.

## What is configured

- PostgreSQL refuses unencrypted TCP connections and requires password authentication over TLS 1.2 or newer.
- Medusa reads the public CA from a read-only volume and verifies the certificate and hostname. Its hostname stays `postgres`. Connection-string SSL overrides are rejected.
- The private CA and server key live in `postgres_tls`, mounted only in PostgreSQL. `postgres_trust` contains the public CA only. No certificates or credentials are built into images or committed.
- A health check connects with `sslmode=verify-full` and confirms `pg_stat_ssl.ssl` is true before Medusa starts. A wrong password or certificate stops readiness instead of disabling TLS.
- Local Unix-socket access retains the official container's local administration behaviour. Host/container administrators remain trusted; TLS does not protect against a compromised host administrator.

## Verify after deployment

In the PostgreSQL service terminal:

```sh
PGPASSWORD="$POSTGRES_PASSWORD" PGSSLMODE=verify-full \
PGSSLROOTCERT=/var/lib/postgresql/trust/ca.crt \
psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c 'SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid();'
```

Expect `ssl = t`. Repeat with `PGSSLMODE=disable`; it must fail. Check Medusa's `/health`, admin login, a product read, cart update and a Stripe sandbox checkout. Verify existing orders and product counts before considering the rollout complete.

## Renewal, backups and recovery

The server certificate lasts one year. On container start it is renewed if fewer than 30 days remain, using the same CA. Schedule renewal checks/restarts before expiry; there is no background renewal timer. The CA lasts ten years and startup refuses it with less than one year remaining so rotation can be planned. Monitor certificates rather than waiting for an outage.

Back up `postgres_tls` securely alongside the database and existing secrets. The public trust volume can be rebuilt from that CA. A partial restore with an existing public CA but missing private CA fails closed; restore the original private volume. Never mount the private TLS volume into the app.

If rollout fails, keep the data volume intact and inspect the PostgreSQL health/logs. Restore the previous Compose/image and matching backend SSL configuration if rollback is necessary; that temporarily restores the old unencrypted internal connection and should not be treated as the final setup. Do not restore an older database backup over newer orders just to undo TLS settings.

The owner reports encrypted VPS drives on Hetzner. This has not been independently verified. TLS covers database traffic, not disk encryption. Confirm separate backups/snapshots are encrypted and that encryption keys are backed up securely. This setup does not add column encryption or replace access controls.
