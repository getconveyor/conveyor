import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// Define auth routes (redirect to dashboard if already logged in)
const authRoutes = ["/login", "/register"];

// Define API routes that should bypass middleware
const apiRoutes = ["/api"];

// Rate limiting configuration (in-memory for edge runtime)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

// Content Security Policy configuration
const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Next.js
  "style-src": ["'self'", "'unsafe-inline'"], // Required for Tailwind
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    "ws:", // WebSocket connections
    "wss:",
  ],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
};

function generateCSP(): string {
  return Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

function getClientIP(request: NextRequest): string {
  // Try various headers for client IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default identifier
  return "unknown";
}

function checkRateLimit(clientIP: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.timestamp > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!clientData || now - clientData.timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientIP, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  clientData.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - clientData.count,
  };
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set("Content-Security-Policy", generateCSP());

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS filtering
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);

  // Skip rate limiting and auth for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check rate limiting
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    const response = new NextResponse(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    response.headers.set("Retry-After", "60");
    response.headers.set(
      "X-RateLimit-Limit",
      RATE_LIMIT_MAX_REQUESTS.toString()
    );
    response.headers.set("X-RateLimit-Remaining", "0");
    return addSecurityHeaders(response);
  }

  // Get auth token from cookie
  const authToken = request.cookies.get("auth_token")?.value;
  const hasAuth = !!authToken;

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Create response
  let response: NextResponse;

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && hasAuth) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  }
  // Allow public routes
  else if (isPublicRoute) {
    response = NextResponse.next();
  }
  // For protected routes, let client-side handle auth
  // (we can't validate JWT on edge without the secret)
  else {
    response = NextResponse.next();
  }

  // Add rate limit headers
  response.headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
  response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());

  // Add security headers
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
