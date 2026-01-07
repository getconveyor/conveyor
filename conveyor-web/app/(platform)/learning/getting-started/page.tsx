import { IconRocket, IconCheck } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function GettingStartedPage() {
  const steps = [
    {
      title: "Platform Overview",
      description: "Understand the core capabilities and architecture",
      duration: "5 min",
      completed: false,
    },
    {
      title: "Create Your First Pipeline",
      description: "Build a simple data integration pipeline",
      duration: "10 min",
      completed: false,
    },
    {
      title: "Explore the Data Lake",
      description: "Learn how to store and organize your data",
      duration: "8 min",
      completed: false,
    },
    {
      title: "Run SQL Queries",
      description: "Query your data using the SQL editor",
      duration: "7 min",
      completed: false,
    },
    {
      title: "Build a Dashboard",
      description: "Create your first analytics dashboard",
      duration: "10 min",
      completed: false,
    },
  ]

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <IconRocket className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Getting Started</h1>
          <p className="text-sm text-muted-foreground">
            Your journey to mastering the data platform begins here
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Path</CardTitle>
          <CardDescription>Follow these steps to get up and running</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{step.title}</p>
                    <span className="text-xs text-muted-foreground">{step.duration}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <Button variant="link" className="h-auto p-0 text-xs">
                    Start Lesson →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <IconCheck className="h-4 w-4 text-green-500 mt-0.5" />
              <p className="text-sm">Use keyboard shortcuts to navigate faster</p>
            </div>
            <div className="flex items-start gap-2">
              <IconCheck className="h-4 w-4 text-green-500 mt-0.5" />
              <p className="text-sm">Bookmark frequently used pages</p>
            </div>
            <div className="flex items-start gap-2">
              <IconCheck className="h-4 w-4 text-green-500 mt-0.5" />
              <p className="text-sm">Check the help icon for contextual guidance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Get assistance from our support team or community
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Contact Support</Button>
              <Button variant="outline" size="sm">Join Community</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
