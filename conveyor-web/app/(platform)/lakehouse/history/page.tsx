"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getQueryHistory,
  deleteQuery,
  QueryHistory,
} from "@/lib/api/lakehouse";
import {
  IconClock,
  IconRefresh,
  IconTrash,
  IconCode,
  IconCheck,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HistoryPage() {
  const [queries, setQueries] = useState<QueryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await getQueryHistory();
      setQueries(history);
    } catch (error) {
      console.error("Failed to load query history:", error);
      toast({
        title: "Failed to Load History",
        description: "Could not retrieve query history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteQuery(deleteId);
      setQueries((prev) => prev.filter((q) => q.id !== deleteId));
      toast({
        title: "Query Deleted",
        description: "Query removed from history",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete query",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "finished":
        return <IconCheck className="h-4 w-4 text-green-600" />;
      case "failed":
        return <IconX className="h-4 w-4 text-red-600" />;
      case "running":
        return <IconLoader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <IconClock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      finished: "default",
      failed: "destructive",
      running: "secondary",
      cancelled: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Query History</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your executed Trino queries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadHistory} disabled={isLoading}>
            <IconRefresh
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Link href="/lakehouse/sql-editor">
            <Button>
              <IconCode className="mr-2 h-4 w-4" />
              SQL Editor
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <IconRefresh className="h-4 w-4 animate-spin" />
              <span>Loading query history...</span>
            </div>
          </CardContent>
        </Card>
      ) : queries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <IconClock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="mb-2">No query history</p>
            <p className="text-sm mb-4">
              Execute queries to see them appear here
            </p>
            <Link href="/lakehouse/sql-editor">
              <Button size="sm">Go to SQL Editor →</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queries?.map((query) => (
            <Card key={query.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(query.status)}
                      <h3 className="font-semibold truncate">
                        {query.name || "Untitled Query"}
                      </h3>
                      {getStatusBadge(query.status)}
                    </div>

                    <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto mb-3 font-mono">
                      {query.query_text.length > 300
                        ? `${query.query_text.substring(0, 300)}...`
                        : query.query_text}
                    </pre>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>{new Date(query.created_at).toLocaleString()}</span>
                      {query.rows_returned !== null && (
                        <span>{query.rows_returned.toLocaleString()} rows</span>
                      )}
                      {query.execution_time_display && (
                        <Badge variant="outline" className="text-xs">
                          {query.execution_time_display}
                        </Badge>
                      )}
                      <span>Namespace: {query.namespace}</span>
                      {query.schema && <span>Schema: {query.schema}</span>}
                      <span className="text-muted-foreground">
                        By: {query.user_email}
                      </span>
                    </div>

                    {query.error_message && (
                      <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">
                          Error:
                        </p>
                        <p className="text-xs text-destructive/80">
                          {query.error_message}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => setDeleteId(query.id)}
                  >
                    <IconTrash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            Total: {queries.length} quer{queries.length !== 1 ? "ies" : "y"}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Query?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this query from history. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Query"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
