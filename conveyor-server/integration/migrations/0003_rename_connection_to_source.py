# Generated manually to rename Connection model to Source
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('integration', '0002_pipelinerun_celery_task_id_pipelinerun_current_step_and_more'),
    ]

    operations = [
        # Rename the Connection model to Source
        migrations.RenameModel(
            old_name='Connection',
            new_name='Source',
        ),

        # Rename the database table
        migrations.AlterModelTable(
            name='source',
            table='sources',
        ),

        # Rename foreign key fields in DataSource model
        migrations.RenameField(
            model_name='datasource',
            old_name='connection',
            new_name='source',
        ),

        # Rename foreign key fields in Pipeline model
        migrations.RenameField(
            model_name='pipeline',
            old_name='source_connection',
            new_name='source',
        ),
        migrations.RenameField(
            model_name='pipeline',
            old_name='destination_connection',
            new_name='destination',
        ),
    ]
