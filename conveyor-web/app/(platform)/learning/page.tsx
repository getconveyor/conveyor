import { IconSchool, IconRocket, IconBook, IconVideo, IconCode } from "@tabler/icons-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LearningPage() {
  const learningPaths = [
    {
      title: "Getting Started",
      description: "New to the platform? Start here to learn the fundamentals",
      icon: IconRocket,
      url: "/learning/getting-started",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      duration: "30 mins",
      lessons: 5,
    },
    {
      title: "Tutorials",
      description: "Step-by-step guides for common tasks and workflows",
      icon: IconSchool,
      url: "/learning/tutorials",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      duration: "2-3 hours",
      lessons: 12,
    },
    {
      title: "Documentation",
      description: "Complete reference documentation for all platform features",
      icon: IconBook,
      url: "/learning/docs",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      duration: "Reference",
      lessons: 50,
    },
    {
      title: "API Reference",
      description: "REST APIs, SDKs, and integration guides",
      icon: IconCode,
      url: "/learning/api",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      duration: "Reference",
      lessons: 25,
    },
  ]

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <IconSchool className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Learning Center</h1>
          <p className="text-sm text-muted-foreground">
            Learn how to build and manage your data platform
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {learningPaths.map((path) => (
          <Card key={path.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${path.bgColor}`}>
                  <path.icon className={`h-6 w-6 ${path.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle>{path.title}</CardTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{path.lessons} lessons</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{path.duration}</span>
                  </div>
                </div>
              </div>
              <CardDescription>{path.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={path.url}>Start Learning</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Resources</CardTitle>
          <CardDescription>Most viewed learning materials this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: "Building Your First Data Pipeline",
                type: "Tutorial",
                duration: "15 min",
                views: "2.3K",
              },
              {
                title: "Data Transformation with Notebooks",
                type: "Hands-on Lab",
                duration: "25 min",
                views: "1.8K",
              },
              {
                title: "SQL Query Optimization",
                type: "Video",
                duration: "12 min",
                views: "1.5K",
              },
              {
                title: "Setting Up Data Governance",
                type: "Guide",
                duration: "20 min",
                views: "1.2K",
              },
            ].map((resource, index) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{resource.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{resource.type}</span>
                    <span>•</span>
                    <span>{resource.duration}</span>
                    <span>•</span>
                    <span>{resource.views} views</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
