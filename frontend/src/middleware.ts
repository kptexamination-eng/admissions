import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/contact",
  "/recruiters",
  "/statistics",
]);

export default clerkMiddleware((auth, req) => {
  // Public pages don't need authentication
  if (isPublicRoute(req)) return;

  // Protect all other routes (like /dashboard, /admin, etc.)
  auth.protect();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
