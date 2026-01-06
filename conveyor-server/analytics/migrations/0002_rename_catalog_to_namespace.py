# Generated manually - Rename catalog to namespace

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='savedquery',
            old_name='catalog',
            new_name='namespace',
        ),
    ]
