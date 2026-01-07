"use client"

import { useState } from "react"
import {
  IconSearch,
  IconBook,
  IconHelp,
  IconCode,
  IconDatabase,
  IconChartLine,
  IconSettings,
  IconShield,
  IconRocket,
  IconChevronRight,
  IconExternalLink,
  IconVideo,
  IconFileText,
  IconBulb,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Article {
  id: string
  title: string
  description: string
  category: string
  readTime: string
  type: "guide" | "video" | "docs" | "tutorial"
}

interface Category {
  id: string
  name: string
  icon: any
  description: string
  articleCount: number
  color: string
}

const categories: Category[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: IconRocket,
    description: "Learn the basics and set up your first project",
    articleCount: 12,
    color: "text-blue-500",
  },
  {
    id: "data-transformation",
    name: "Data Transformation",
    icon: IconDatabase,
    description: "Build and manage ETL workflows",
    articleCount: 24,
    color: "text-purple-500",
  },
  {
    id: "analytics",
    name: "Analytics & Reporting",
    icon: IconChartLine,
    description: "Create dashboards and visualizations",
    articleCount: 18,
    color: "text-green-500",
  },
  {
    id: "api",
    name: "API & Integration",
    icon: IconCode,
    description: "Connect with external systems and APIs",
    articleCount: 15,
    color: "text-orange-500",
  },
  {
    id: "security",
    name: "Security & Compliance",
    icon: IconShield,
    description: "Secure your data and meet compliance requirements",
    articleCount: 9,
    color: "text-red-500",
  },
  {
    id: "settings",
    name: "Settings & Configuration",
    icon: IconSettings,
    description: "Configure your workspace and preferences",
    articleCount: 11,
    color: "text-gray-500",
  },
]

const articles: Article[] = [
  {
    id: "1",
    title: "Quick Start Guide",
    description: "Get up and running in 5 minutes with your first workflow",
    category: "getting-started",
    readTime: "5 min",
    type: "guide",
  },
  {
    id: "2",
    title: "Creating Your First ETL Pipeline",
    description: "Step-by-step tutorial on building a data transformation workflow",
    category: "data-transformation",
    readTime: "15 min",
    type: "tutorial",
  },
  {
    id: "3",
    title: "Dashboard Builder Overview",
    description: "Learn how to create interactive dashboards and reports",
    category: "analytics",
    readTime: "10 min",
    type: "video",
  },
  {
    id: "4",
    title: "API Authentication Guide",
    description: "Secure your API integrations with proper authentication",
    category: "api",
    readTime: "8 min",
    type: "docs",
  },
  {
    id: "5",
    title: "Data Security Best Practices",
    description: "Implement security measures to protect your data",
    category: "security",
    readTime: "12 min",
    type: "guide",
  },
  {
    id: "6",
    title: "Workspace Configuration",
    description: "Set up your workspace for optimal productivity",
    category: "settings",
    readTime: "7 min",
    type: "docs",
  },
  {
    id: "7",
    title: "Understanding Data Sources",
    description: "Connect to databases, APIs, and file systems",
    category: "getting-started",
    readTime: "10 min",
    type: "guide",
  },
  {
    id: "8",
    title: "Advanced SQL Transformations",
    description: "Master complex SQL queries for data transformation",
    category: "data-transformation",
    readTime: "20 min",
    type: "tutorial",
  },
]

const popularArticles = articles.slice(0, 5)

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory ? article.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <IconVideo className="h-4 w-4" />
      case "tutorial":
        return <IconBook className="h-4 w-4" />
      case "docs":
        return <IconFileText className="h-4 w-4" />
      case "guide":
        return <IconBulb className="h-4 w-4" />
      default:
        return <IconFileText className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "video":
        return "Video"
      case "tutorial":
        return "Tutorial"
      case "docs":
        return "Docs"
      case "guide":
        return "Guide"
      default:
        return "Article"
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Help Center</h1>
          <p className="text-sm text-muted-foreground">
            Find guides, tutorials, and documentation
          </p>
        </div>
        <Button variant="outline">
          <IconExternalLink className="h-4 w-4 mr-2" />
          API Docs
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for help articles, guides, and tutorials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {!searchQuery && !selectedCategory && (
        <>
          {/* Popular Articles */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Articles</CardTitle>
              <CardDescription>
                Most viewed help articles this week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {popularArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-muted-foreground">
                      {getTypeIcon(article.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {article.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {article.readTime}
                    </span>
                    <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Categories */}
          <div>
            <h2 className="text-base font-medium mb-3">Browse by Category</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:border-primary transition-colors group"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-muted ${category.color}`}>
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {category.articleCount} articles
                        </p>
                      </div>
                      <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <IconVideo className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">Video Tutorials</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Watch step-by-step video guides
                    </p>
                    <Button variant="link" className="px-0 mt-2">
                      Browse Videos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <IconCode className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">API Reference</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete API documentation
                    </p>
                    <Button variant="link" className="px-0 mt-2">
                      View Docs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <IconHelp className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">Contact Support</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get help from our team
                    </p>
                    <Button variant="link" className="px-0 mt-2">
                      Contact Us
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Search Results or Category View */}
      {(searchQuery || selectedCategory) && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : "Search Results"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredArticles.length} articles found
              </p>
            </div>
            {selectedCategory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                View All Categories
              </Button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:border-primary transition-colors group"
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getTypeBadge(article.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {article.readTime}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {article.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {categories.find((c) => c.id === article.category)?.name}
                      </span>
                      <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <IconSearch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No articles found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search or browse by category
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory(null)
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  )
}
