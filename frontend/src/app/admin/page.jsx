"use client";
import Link from "next/link";

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 mb-4">
        Welcome, Admin 👋
      </h1>
      <p className="text-gray-600 mb-8">
        Manage Training & Placement data for KPT Mangalore here.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/statistics"
          className="p-6 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
        >
          Manage Placement Statistics
        </Link>

        <Link
          href="/admin/companies"
          className="p-6 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
        >
          Add Visited Companies
        </Link>
        <Link
          href="/admin/gallery"
          className="p-6 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
        >
          Upload Gallery Photos
        </Link>
      </div>
    </div>
  );
}
