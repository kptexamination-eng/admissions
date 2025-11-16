"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function OfficeAdmissionDashboard() {
  const { getToken } = useAuth();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const fetchStudents = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/students?status=Pending&search=${search}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(res.data);
    setStudents(res.data.students || []);
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const approveStudent = async (id) => {
    const token = await getToken();
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/students/approve/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      alert("Admission Approved!");
      fetchStudents();
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-indigo-50 to-purple-50">
      <h1 className="text-5xl font-extrabold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Office Admission Dashboard
      </h1>

      <div className="max-w-3xl mx-auto mt-8">
        <input
          className="w-full p-4 rounded-xl shadow-md border border-indigo-200 focus:ring-4 focus:ring-indigo-300"
          placeholder="Search student by name or application number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {students.map((s) => (
          <div
            key={s._id}
            className="p-8 bg-white rounded-2xl shadow-xl border hover:shadow-2xl transition"
          >
            <h2 className="text-2xl font-bold text-indigo-700">
              {s.identity?.studentName}
            </h2>

            <p className="mt-2 text-gray-500">
              Application: {s.applicationNumber}
            </p>

            <p className="text-gray-500">
              Program: {s.program} / Department: {s.department}
            </p>

            <p className="text-gray-500">
              Entry: {s.entryType} – {s.entryYear}
            </p>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => approveStudent(s._id)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow hover:opacity-90"
              >
                Approve Admission
              </button>

              <button className="px-6 py-3 border rounded-xl text-indigo-600 hover:bg-indigo-50">
                View Profile
              </button>
            </div>
          </div>
        ))}

        {students.length === 0 && (
          <div className="text-center text-gray-500 text-xl mt-20 w-full col-span-2">
            No pending applications found.
          </div>
        )}
      </div>
    </div>
  );
}
