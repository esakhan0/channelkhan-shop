import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261102230729 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "refund_request" add column if not exists "resolution" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "refund_request" drop column if exists "resolution";`);
  }

}
