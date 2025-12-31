"use client"

import Link from "next/link"
import {
  IconSchool,
  IconDatabase,
  IconTransform,
  IconChartBar,
  IconCode,
  IconClock,
  IconUsers,
  IconStar,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function TutorialsPage() {
  const categories = [
    { name: "All Tutorials", count: 24, active: true },
    { name: "Data Integration", count: 6, active: false },
    { name: "Data Transformation", count: 5, active: false },
    { name: "Analytics", count: 7, active: false },
    { name: "Data Science", count: 4, active: false },
    { name: "Governance", count: 2, active: false },
  ]

  const tutorials = [
    {
      title: "Building Your First Data Pipeline",
      description: "Learn how to create an ETL pipeline from start to finish, including data extraction, transformation, and loading into your warehouse.",
      difficulty: "Beginner",
      duration: "15 min",
      category: "Data Integration",
      icon: IconDatabase,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      views: "2.3K",
      rating: 4.8,
    },
    {
      title: "Data Transformation with Notebooks",
      description: "Master data transformation using Python and SQL notebooks with hands-on examples and best practices.",
      difficulty: "Intermediate",
      duration: "25 min",
      category: "Data Transformation",
      icon: IconTransform,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      views: "1.8K",
      rating: 4.9,
    },
    {
      title: "Creating Interactive Dashboards",
      description: "Build compelling data visualizations and interactive dashboards for business intelligence.",
      difficulty: "Beginner",
      duration: "20 min",
      category: "Analytics",
      icon: IconChartBar,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      views: "1.5K",
      rating: 4.7,
    },
    {
      title: "SQL Query Optimization Techniques",
      description: "Learn advanced SQL optimization techniques to improve query performance and reduce execution time.",
      difficulty: "Advanced",
      duration: "30 min",
      category: "Analytics",
      icon: IconCode,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      views: "1.2K",
      rating: 4.9,
    },
    {
      title: "Real-Time Data Streaming",
      description: "Set up real-time data streams and process events with low latency using stream processing.",
      difficulty: "Intermediate",
      duration: "35 min",
      category: "Data Integration",
      icon: IconDatabase,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      views: "980",
      rating: 4.6,
    },
    {
      title: "Machine Learning Model Deployment",
      description: "Deploy ML models to production with automated pipelines and monitoring.",
      difficulty: "Advanced",
      duration: "40 min",
      category: "Data Science",
      icon: IconCode,
      color: "text-fuchsia-500",
      bgColor: "bg-fuchsia-500/10",
      views: "856",
      rating: 4.8,
    },
  ]

  const learningPaths = [
    {
      title: "Data Engineer Path",
      description: "Complete tutorials track for data engineers",
      tutorials: 12,
      duration: "6 hours",
    },
    {
      title: "Analytics Professional",
      description: "Learn BI and analytics from scratch",
      tutorials: 8,
      duration: "4 hours",
    },
    {
      title: "Data Scientist Track",
      description: "ML and advanced analytics tutorials",
      tutorials: 10,
      duration: "8 hours",
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
            <IconSchool className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tutorials</h1>
            <p className="text-sm text-muted-foreground">
              Step-by-step guides for common tasks and workflows
            </p>
          </div>
        </div>
        <Button variant="outline">
          <IconStar className="mr-2 h-4 w-4" />
          My Bookmarks
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={category.active ? "default" : "outline"}
                size="sm"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tutorials.map((tutorial, idx) => (
          <Card key={idx} className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tutorial.bgColor}`}>
                  <tutorial.icon className={`h-6 w-6 ${tutorial.color}`} />
                </div>
                <Badge variant="outline" className="text-xs">
                  {tutorial.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg">{tutorial.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {tutorial.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <IconClock className="h-3 w-3" />
                    {tutorial.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconUsers className="h-3 w-3" />
                    {tutorial.views}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <IconStar className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span>{tutorial.rating}</span>
                </div>
              </div>
              <Button className="w-full">Start Tutorial</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Paths</CardTitle>
          <CardDescription>Curated tutorial sequences for different roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {learningPaths.map((path, idx) => (
              <div key={idx} className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">{path.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{path.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{path.tutorials} tutorials</span>
                  <span>{path.duration}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Path
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
