import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261102174551 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "refund_request" ("id" text not null, "customer_id" text not null, "order_id" text not null, "order_display_id" integer not null, "kind" text check ("kind" in ('refund', 'cancellation')) not null, "status" text check ("status" in ('pending', 'reviewing', 'closed', 'declined')) not null default 'pending', "items" jsonb not null, "customer_note" text not null, "response" text not null default '', "reviewed_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "refund_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_refund_request_customer_id" ON "refund_request" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_refund_request_order_id" ON "refund_request" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_refund_request_deleted_at" ON "refund_request" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "refund_request" cascade;`);
  }

}
