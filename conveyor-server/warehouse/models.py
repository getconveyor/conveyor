from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class QueryHistory(models.Model):
    """Stores executed Trino queries for history and auditing"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace_id = models.UUIDField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='queries')

    # Query details
    name = models.CharField(max_length=255, blank=True, null=True)
    query_text = models.TextField()
    catalog = models.CharField(max_length=100, default='iceberg')
    schema = models.CharField(max_length=100, blank=True, null=True)

    # Execution details
    status = models.CharField(
        max_length=20,
        choices=[
            ('running', 'Running'),
            ('finished', 'Finished'),
            ('failed', 'Failed'),
            ('cancelled', 'Cancelled'),
        ],
        default='running'
    )
    rows_returned = models.IntegerField(null=True, blank=True)
    execution_time_ms = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Query Histories'

    def __str__(self):
        return f"{self.name or 'Query'} - {self.status}"
