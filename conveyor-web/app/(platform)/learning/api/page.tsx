"use client"

import Link from "next/link"
import {
  IconCode,
  IconApi,
  IconKey,
  IconBook,
  IconTerminal,
  IconBrandPython,
  IconBrandJavascript,
  IconCheck,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function APIReferencePage() {
  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/pipelines",
      description: "List all data integration pipelines",
      category: "Data Integration",
    },
    {
      method: "POST",
      path: "/api/v1/pipelines",
      description: "Create a new pipeline",
      category: "Data Integration",
    },
    {
      method: "GET",
      path: "/api/v1/notebooks",
      description: "List all notebooks",
      category: "Data Transformation",
    },
    {
      method: "POST",
      path: "/api/v1/query/execute",
      description: "Execute SQL query",
      category: "Data Warehouse",
    },
    {
      method: "GET",
      path: "/api/v1/dashboards",
      description: "List all dashboards",
      category: "Data Analytics",
    },
  ]

  const sdks = [
    {
      name: "Python SDK",
      icon: IconBrandPython,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      version: "v2.1.0",
      description: "Official Python client for Conveyor API",
      install: "pip install conveyor-sdk",
    },
    {
      name: "JavaScript SDK",
      icon: IconBrandJavascript,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      version: "v2.0.5",
      description: "Official JavaScript/TypeScript client",
      install: "npm install @conveyor/sdk",
    },
    {
      name: "REST API",
      icon: IconApi,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      version: "v1",
      description: "Direct HTTP REST API access",
      install: "curl https://api.conveyor.io",
    },
  ]

  const guides = [
    {
      title: "Authentication",
      description: "API keys, OAuth, and JWT token management",
      topics: ["API Keys", "OAuth 2.0", "Rate Limiting", "Error Codes"],
    },
    {
      title: "Webhooks",
      description: "Event-driven integrations and callbacks",
      topics: ["Setup", "Event Types", "Payload Schema", "Security"],
    },
    {
      title: "Data Models",
      description: "Request and response object schemas",
      topics: ["Pipeline", "Notebook", "Dashboard", "Query Result"],
    },
  ]

  const quickStart = {
    python: `from conveyor import Client

# Initialize client
client = Client(api_key="your-api-key")

# List pipelines
pipelines = client.pipelines.list()

# Create a new pipeline
pipeline = client.pipelines.create(
    name="My Pipeline",
    source="postgres",
    destination="warehouse"
)`,
    javascript: `import { Conveyor } from '@conveyor/sdk';

// Initialize client
const client = new Conveyor({
  apiKey: 'your-api-key'
});

// List pipelines
const pipelines = await client.pipelines.list();

// Create a new pipeline
const pipeline = await client.pipelines.create({
  name: 'My Pipeline',
  source: 'postgres',
  destination: 'warehouse'
});`,
    curl: `# List pipelines
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.conveyor.io/v1/pipelines

# Create pipeline
curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My Pipeline","source":"postgres"}' \\
  https://api.conveyor.io/v1/pipelines`,
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <IconCode className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">API Reference</h1>
          <p className="text-sm text-muted-foreground">
            REST APIs, SDKs, and integration guides for developers
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {sdks.map((sdk, idx) => (
          <Card key={idx} className="hover:bg-accent/30 transition-colors">
            <CardHeader>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${sdk.bgColor} mb-3`}>
                <sdk.icon className={`h-6 w-6 ${sdk.color}`} />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{sdk.name}</CardTitle>
                <Badge variant="outline" className="text-xs">{sdk.version}</Badge>
              </div>
              <CardDescription>{sdk.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md mb-3 font-mono text-xs">
                {sdk.install}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Documentation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Examples</CardTitle>
          <CardDescription>Get started with the Conveyor API in your language</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconBrandPython className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-sm">Python</span>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {quickStart.python}
              </pre>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconBrandJavascript className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold text-sm">JavaScript</span>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {quickStart.javascript}
              </pre>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <IconTerminal className="h-4 w-4 text-green-500" />
                <span className="font-semibold text-sm">cURL</span>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {quickStart.curl}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Available REST API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {endpoints.map((endpoint, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={endpoint.method === "GET" ? "default" : "secondary"}
                    className="text-xs font-mono w-16 justify-center"
                  >
                    {endpoint.method}
                  </Badge>
                  <div>
                    <p className="font-mono text-sm">{endpoint.path}</p>
                    <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {endpoint.category}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View Complete API Reference
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {guides.map((guide, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-base">{guide.title}</CardTitle>
              <CardDescription>{guide.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guide.topics.map((topic, topicIdx) => (
                  <div key={topicIdx} className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">{topic}</span>
                  </div>
                ))}
              </div>
              <Button variant="link" size="sm" className="p-0 h-auto mt-3">
                Read Guide →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Developer Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <IconKey className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">API Keys</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Generate and manage API keys for authentication
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    Manage Keys →
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconBook className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">API Changelog</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Track API updates and breaking changes
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    View Changelog →
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <IconTerminal className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Interactive Console</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Test API endpoints in your browser
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    Open Console →
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconCode className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Code Examples</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Browse community-contributed examples
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    View Examples →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
