from django.core.management.base import BaseCommand
from authentication.models import Plan


class Command(BaseCommand):
    help = 'Seed initial subscription plans'

    def handle(self, *args, **options):
        plans_data = [
            {
                'name': 'Free',
                'plan_type': 'free',
                'description': 'Get started with basic features',
                'price_monthly': 0,
                'price_yearly': 0,
                'max_users': 1,
                'max_pipelines': 3,
                'max_storage_gb': 5,
                'max_queries_per_day': 50,
                'features': {
                    'data_integration': True,
                    'basic_transformations': True,
                    'query_editor': True,
                    'dashboards': False,
                    'real_time_analytics': False,
                    'ml_features': False,
                    'api_access': False,
                    'support': 'Community',
                }
            },
            {
                'name': 'Starter',
                'plan_type': 'starter',
                'description': 'Perfect for small teams getting started',
                'price_monthly': 49,
                'price_yearly': 490,  # ~15% discount
                'max_users': 5,
                'max_pipelines': 10,
                'max_storage_gb': 50,
                'max_queries_per_day': 500,
                'features': {
                    'data_integration': True,
                    'basic_transformations': True,
                    'advanced_transformations': True,
                    'query_editor': True,
                    'dashboards': True,
                    'max_dashboards': 5,
                    'real_time_analytics': False,
                    'ml_features': False,
                    'api_access': True,
                    'support': 'Email',
                }
            },
            {
                'name': 'Professional',
                'plan_type': 'professional',
                'description': 'Advanced features for growing teams',
                'price_monthly': 149,
                'price_yearly': 1490,  # ~17% discount
                'max_users': 20,
                'max_pipelines': 50,
                'max_storage_gb': 500,
                'max_queries_per_day': 5000,
                'features': {
                    'data_integration': True,
                    'basic_transformations': True,
                    'advanced_transformations': True,
                    'query_editor': True,
                    'dashboards': True,
                    'max_dashboards': 25,
                    'real_time_analytics': True,
                    'ml_features': True,
                    'notebooks': True,
                    'data_science': True,
                    'governance': True,
                    'api_access': True,
                    'webhooks': True,
                    'support': 'Priority Email & Chat',
                }
            },
            {
                'name': 'Enterprise',
                'plan_type': 'enterprise',
                'description': 'Unlimited power for large organizations',
                'price_monthly': 499,
                'price_yearly': 4990,  # ~17% discount
                'max_users': 999999,  # Unlimited
                'max_pipelines': 999999,  # Unlimited
                'max_storage_gb': 999999,  # Unlimited
                'max_queries_per_day': 999999,  # Unlimited
                'features': {
                    'data_integration': True,
                    'basic_transformations': True,
                    'advanced_transformations': True,
                    'query_editor': True,
                    'dashboards': True,
                    'max_dashboards': 999999,
                    'real_time_analytics': True,
                    'ml_features': True,
                    'notebooks': True,
                    'data_science': True,
                    'governance': True,
                    'advanced_governance': True,
                    'audit_logs': True,
                    'api_access': True,
                    'webhooks': True,
                    'sso': True,
                    'dedicated_support': True,
                    'sla': True,
                    'support': '24/7 Phone & Dedicated Success Manager',
                }
            }
        ]

        for plan_data in plans_data:
            plan, created = Plan.objects.update_or_create(
                plan_type=plan_data['plan_type'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created plan: {plan.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated plan: {plan.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n✓ Successfully seeded subscription plans!')
        )
