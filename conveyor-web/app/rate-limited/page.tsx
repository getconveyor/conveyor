"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IconClock, IconRefresh, IconShieldOff } from "@tabler/icons-react";

export default function RateLimitedPage() {
  const [countdown, setCountdown] = useState(60);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanRetry(true);
    }
  }, [countdown]);

  const handleRetry = () => {
    window.location.href = "/dashboard";
  };

  const progressValue = ((60 - countdown) / 60) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
            <IconShieldOff className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl">Rate Limit Exceeded</CardTitle>
          <CardDescription className="text-base mt-2">
            You&apos;ve made too many requests. Please wait before trying again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time remaining</span>
              <span className="font-mono font-semibold flex items-center gap-1.5">
                <IconClock className="h-4 w-4" />
                {countdown}s
              </span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Why am I seeing this?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Too many API requests in a short period</li>
              <li>Automated scripts or bots may trigger this</li>
              <li>Rate limits help protect our services</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRetry}
              disabled={!canRetry}
              className="w-full"
            >
              {canRetry ? (
                <>
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </>
              ) : (
                <>
                  <IconClock className="mr-2 h-4 w-4" />
                  Please wait {countdown}s
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              If this continues, please contact support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
