import { requireAuth, clerkClient } from "@clerk/express";

export function requireAuthWithRole(allowedRoles = []) {
  return [
    requireAuth(), // ensures user is logged in

    async (req, res, next) => {
      try {
        const userId = req.auth?.userId; // Clerk session user ID

        if (!userId) {
          return res.status(401).json({
            error: "Unauthorized: No active session",
          });
        }

        // Fetch full Clerk user info
        const user = await clerkClient.users.getUser(userId);

        // Extract role from Clerk metadata
        const role =
          user?.publicMetadata?.role || user?.unsafeMetadata?.role || null;

        // Role check
        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
          return res.status(403).json({
            error: "Forbidden: Insufficient role",
            receivedRole: role,
            requiredRoles: allowedRoles,
          });
        }

        // Attach to request for controller access
        req.user = {
          id: user.id,
          clerkId: user.id,
          email:
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses?.[0]?.emailAddress,
          role,
        };

        next();
      } catch (err) {
        console.error("Auth Error:", err);
        return res.status(500).json({
          error: "Internal auth server error",
        });
      }
    },
  ];
}
