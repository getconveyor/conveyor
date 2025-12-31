"use client"

import Link from "next/link"
import {
  IconBrain,
  IconFlask,
  IconRocket,
  IconBook,
  IconCpu,
  IconPlus,
  IconTrendingUp,
  IconCheck,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DataSciencePage() {
  const stats = [
    { title: "ML Models", value: "34", change: "+5 this month", icon: IconBrain },
    { title: "Experiments", value: "127", change: "18 running", icon: IconFlask },
    { title: "Deployments", value: "28", change: "24 active", icon: IconRocket },
    { title: "Accuracy", value: "94.7%", change: "Avg across models", icon: IconCheck },
  ]

  const recentModels = [
    { name: "Customer Churn Predictor", accuracy: "96.2%", status: "deployed" as const, version: "v2.1" },
    { name: "Sales Forecasting", accuracy: "93.8%", status: "training" as const, version: "v1.4" },
    { name: "Fraud Detection", accuracy: "98.1%", status: "deployed" as const, version: "v3.0" },
    { name: "Product Recommendation", accuracy: "91.5%", status: "testing" as const, version: "v1.2" },
  ]

  const quickActions = [
    {
      title: "New Experiment",
      description: "Start ML experiment",
      icon: IconFlask,
      href: "/data-science/experiments",
      color: "text-blue-500",
    },
    {
      title: "Deploy Model",
      description: "Deploy to production",
      icon: IconRocket,
      href: "/data-science/deployments",
      color: "text-purple-500",
    },
    {
      title: "Jupyter Notebooks",
      description: "Interactive development",
      icon: IconBook,
      href: "/data-science/notebooks",
      color: "text-green-500",
    },
    {
      title: "Model Registry",
      description: "Browse trained models",
      icon: IconBrain,
      href: "/data-science/models",
      color: "text-orange-500",
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-fuchsia-500/10">
            <IconBrain className="h-6 w-6 text-fuchsia-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Science</h1>
            <p className="text-sm text-muted-foreground">
              Build, train, and deploy machine learning models with MLOps capabilities
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/data-science/experiments">
            <IconPlus className="mr-2 h-4 w-4" />
            New Experiment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-all hover:border-primary cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-opacity-10 ${action.color}`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Models</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/data-science/models">View All</Link>
              </Button>
            </div>
            <CardDescription>Latest ML model versions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentModels.map((model, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <IconBrain className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{model.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {model.version} • Accuracy: {model.accuracy}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      model.status === "deployed"
                        ? "default"
                        : model.status === "training"
                        ? "outline"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {model.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Resources</CardTitle>
            <CardDescription>Compute resource utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">GPU Utilization</span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "78%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm font-medium">64%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "64%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium">82%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: "82%" }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-fuchsia-50 dark:bg-fuchsia-950 rounded-lg">
              <div className="flex items-start gap-3">
                <IconCpu className="h-5 w-5 text-fuchsia-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400">
                    High Performance
                  </p>
                  <p className="text-xs text-fuchsia-600/80 dark:text-fuchsia-400/80 mt-1">
                    GPU-accelerated training reducing model training time by 65%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
          <CardDescription>Production model metrics overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">High Accuracy (&gt;95%)</span>
                <span className="text-sm font-medium">12 models (43%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "43%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Good Accuracy (90-95%)</span>
                <span className="text-sm font-medium">14 models (50%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "50%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Needs Improvement (&lt;90%)</span>
                <span className="text-sm font-medium">2 models (7%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: "7%" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-start gap-3">
              <IconTrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Quality Improving
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                  Average model accuracy increased 3.2% this quarter through improved training
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MLOps Capabilities</CardTitle>
          <CardDescription>
            End-to-end machine learning platform with experiment tracking, model registry, and deployment automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconFlask className="h-4 w-4 text-blue-500" />
                Experimentation
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Jupyter notebooks</div>
                <div>• Experiment tracking</div>
                <div>• Hyperparameter tuning</div>
                <div>• AutoML capabilities</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconBrain className="h-4 w-4 text-purple-500" />
                Model Management
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Model registry</div>
                <div>• Version control</div>
                <div>• Performance monitoring</div>
                <div>• A/B testing</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconRocket className="h-4 w-4 text-green-500" />
                Deployment
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• API endpoints</div>
                <div>• Batch inference</div>
                <div>• Auto-scaling</div>
                <div>• Rollback support</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
