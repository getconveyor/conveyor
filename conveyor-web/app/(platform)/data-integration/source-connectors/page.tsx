"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { integrationApi, Source } from "@/lib/api/integration";
import { toast } from "sonner";
import {
  IconPlus,
  IconSearch,
  IconApi,
  IconDatabase,
  IconCloud,
  IconFile,
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandStripe,
  IconBrandSlack,
  IconExternalLink,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SourceCategory = "api" | "database" | "cloud" | "file";

interface SourceType {
  id: string;
  name: string;
  description: string;
  category: SourceCategory;
  icon: React.ElementType;
  popular: boolean;
  authTypes: string[];
  documentation: string;
}

// Source Types Catalog (templates)
const sourceTypesCatalog: SourceType[] = [
  {
    id: "rest-api",
    name: "REST API",
    description: "Connect to any REST API endpoint with custom authentication",
    category: "api",
    icon: IconApi,
    popular: true,
    authTypes: ["API Key", "Bearer Token", "OAuth 2.0", "Basic Auth"],
    documentation: "https://docs.example.com/rest-api",
  },
  {
    id: "graphql",
    name: "GraphQL API",
    description: "Query GraphQL endpoints with custom queries and mutations",
    category: "api",
    icon: IconApi,
    popular: false,
    authTypes: ["API Key", "Bearer Token", "OAuth 2.0"],
    documentation: "https://docs.example.com/graphql",
  },
  {
    id: "github",
    name: "GitHub API",
    description: "Access repositories, issues, pull requests, and more",
    category: "api",
    icon: IconBrandGithub,
    popular: true,
    authTypes: ["Personal Access Token", "OAuth App", "GitHub App"],
    documentation: "https://docs.github.com/rest",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Website and app analytics data from Google Analytics 4",
    category: "api",
    icon: IconBrandGoogle,
    popular: true,
    authTypes: ["OAuth 2.0", "Service Account"],
    documentation: "https://developers.google.com/analytics",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing and subscription management data",
    category: "api",
    icon: IconBrandStripe,
    popular: true,
    authTypes: ["Secret Key", "Restricted Key"],
    documentation: "https://stripe.com/docs/api",
  },
  {
    id: "slack",
    name: "Slack API",
    description: "Messages, channels, users, and workspace data",
    category: "api",
    icon: IconBrandSlack,
    popular: false,
    authTypes: ["OAuth 2.0", "Bot Token"],
    documentation: "https://api.slack.com",
  },
  {
    id: "mysql",
    name: "MySQL",
    description: "MySQL relational database connection",
    category: "database",
    icon: IconDatabase,
    popular: true,
    authTypes: ["Password", "SSL Certificate"],
    documentation: "https://dev.mysql.com/doc/",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "PostgreSQL database with advanced SQL features",
    category: "database",
    icon: IconDatabase,
    popular: true,
    authTypes: ["Password", "SSL Certificate", "SCRAM-SHA-256"],
    documentation: "https://www.postgresql.org/docs/",
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "Amazon S3 object storage buckets",
    category: "cloud",
    icon: IconCloud,
    popular: true,
    authTypes: ["Access Key", "IAM Role", "Temporary Credentials"],
    documentation: "https://docs.aws.amazon.com/s3/",
  },
  {
    id: "sftp",
    name: "SFTP",
    description: "Secure file transfer protocol for file storage",
    category: "file",
    icon: IconFile,
    popular: false,
    authTypes: ["Password", "SSH Key"],
    documentation: "https://www.ssh.com/academy/ssh/sftp",
  },
];

export default function SourcesPage() {
  const { currentWorkspace } = useWorkspace();
  const [sources, setSources] = useState<Source[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<string>("all");
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    loadSources();
  }, [currentWorkspace]);

  async function loadSources() {
    if (!currentWorkspace) return;

    try {
      setIsFetching(true);
      const data = await integrationApi.getSources();
      setSources(data);
    } catch (error: any) {
      console.error("Failed to load sources:", error);
      toast.error(error.message || "Failed to load sources");
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Source Connectors</h1>
          <p className="text-sm text-muted-foreground">
            List of available data source connectors
          </p>
        </div>
        <Button onClick={() => setIsCatalogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      <div className="py-4 min-h-0 overflow-hidden flex-1 flex flex-col">
        <Tabs
          value={catalogCategory}
          onValueChange={setCatalogCategory}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
            <TabsList>
              <TabsTrigger value="all">All Sources</TabsTrigger>
              <TabsTrigger value="api">APIs</TabsTrigger>
              <TabsTrigger value="database">Databases</TabsTrigger>
              <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
              <TabsTrigger value="file">File Systems</TabsTrigger>
            </TabsList>
            <div className="relative w-80">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search source types..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
              {sourceTypesCatalog.map((sourceType) => {
                const TypeIcon = sourceType.icon;
                return (
                  <Card
                    key={sourceType.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg leading-tight">
                              {sourceType.name}
                            </h3>
                            {sourceType.popular && (
                              <Badge variant="secondary" className="text-xs">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            {sourceType.category}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {sourceType.description}
                      </p>
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Authentication
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {sourceType.authTypes.slice(0, 3).map((auth, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {auth}
                            </Badge>
                          ))}
                          {sourceType.authTypes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{sourceType.authTypes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a
                            href={sourceType.documentation}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <IconExternalLink className="mr-1 h-3 w-3" />
                            Docs
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </Tabs>
      </div>
    </>
  );
}
