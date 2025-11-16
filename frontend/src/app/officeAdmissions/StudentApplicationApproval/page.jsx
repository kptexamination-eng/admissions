"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import ViewModal from "./ViewModal"; // or paste inside same file

export default function OfficeAdmissionDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [applications, setApplications] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Draft");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApps();
  }, [statusFilter, page]);

  const fetchApps = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications/list-office`,
      {
        params: { status: statusFilter, search, page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setApplications(res.data.data);
    setTotal(res.data.total);
  };

  const totalPages = Math.ceil(total / 10);

  if (user?.publicMetadata?.role !== "office-admissions") {
    return <div>Not authorized</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-10">
      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          className="border p-3 rounded"
          placeholder="Search student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => fetchApps()}
        >
          Search
        </button>

        <select
          className="border p-2 rounded"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Admitted">Admitted</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-3">Photo</th>
            <th className="p-3">Name</th>
            <th className="p-3">Program</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app._id}
              className="border-b hover:bg-gray-100 cursor-pointer"
              onClick={() => setSelectedApp(app)}
            >
              <td className="p-3">
                <img className="w-14 h-14 rounded" src={app.photo.url} />
              </td>
              <td className="p-3">{app.identity.studentName}</td>
              <td className="p-3">{app.program}</td>
              <td className="p-3">{app.status}</td>
              <td className="p-3">
                <button
                  className="text-sm text-purple-600 underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications/pdf/${app._id}`
                    );
                  }}
                >
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-3">
        <button
          disabled={page <= 1}
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span className="px-4 py-2">
          {page} / {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {selectedApp && (
        <ViewModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  );
}
