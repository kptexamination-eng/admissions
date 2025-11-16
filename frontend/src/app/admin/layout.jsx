"use client";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  // Only allow admin users
  if (
    user?.publicMetadata?.role !== "placement-officer" &&
    user?.publicMetadata?.role !== "placement-coordinator" &&
    user?.publicMetadata?.role !== "principal" &&
    user?.publicMetadata?.role !== "admin"
  ) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-red-50 text-red-700">
        <p className="text-lg font-semibold">🚫 Admin access only.</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6">
        <h2 className="font-bold text-blue-700 text-lg mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-3 text-gray-700">
          <Link href="/admin">Dashboard</Link>

          <Link href="/admin/statistics">Placement Statistics</Link>
          <Link href="/admin/placedStudents"> Placed Students Page</Link>
          <Link href="/admin/recentlyVisitedCompanies">
            Recently Visited Companies
          </Link>
          <Link href="/admin/announcements">Announcements</Link>
          <Link href="/admin/events">Events</Link>
          <Link href="/admin/team">Our Team</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
