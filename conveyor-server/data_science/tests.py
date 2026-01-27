from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from authentication.models import Workspace
from .models import Experiment, ExperimentRun

User = get_user_model()

class ExperimentViewSetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.workspace = Workspace.objects.create(name='Test Workspace', owner=self.user)
        self.client.force_authenticate(user=self.user)
        self.client.defaults['HTTP_X_Workspace_ID'] = str(self.workspace.id)

    def test_experiment_summary(self):
        # Create some experiments
        Experiment.objects.create(
            workspace=self.workspace,
            name='Test Experiment 1',
            status='active',
            owner=self.user
        )
        Experiment.objects.create(
            workspace=self.workspace,
            name='Test Experiment 2',
            status='completed',
            owner=self.user
        )

        # Create some runs
        exp = Experiment.objects.first()
        ExperimentRun.objects.create(experiment=exp, status='completed')
        ExperimentRun.objects.create(experiment=exp, status='failed')

        response = self.client.get('/api/data-science/experiments/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['total_experiments'], 2)
        self.assertEqual(data['active_experiments'], 1)
        self.assertEqual(data['total_runs'], 2)
        self.assertEqual(data['successful_runs'], 1)
        self.assertEqual(data['failed_runs'], 1)
