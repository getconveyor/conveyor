# Generated manually - Rename catalog to namespace

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('warehouse', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='queryhistory',
            old_name='catalog',
            new_name='namespace',
        ),
    ]
