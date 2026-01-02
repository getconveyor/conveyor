# Generated migration to remove plan-related models

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_plan_workspace_subscription_invoice_apikey_workspace_and_more'),
    ]

    operations = [
        # Drop foreign key constraints first
        migrations.RunSQL(
            sql='ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql='ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_workspace_id_fkey CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql='ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_subscription_id_fkey CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Drop tables
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS invoices CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS subscriptions CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS plans CASCADE;',
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
