"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";

// Icons
import {
  BarChart3,
  Clock,
  FileEdit,
  UserCheck,
  UserX,
  CheckCircle2,
  MinusCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

export default function OfficeAdmissionDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [stats, setStats] = useState({
    drafts: 0,
    pending: 0,
    approved: 0,
    notAllotted: 0,
    admitted: 0,
    rejected: 0,
    withdrawn: 0,
    applied: 0,
    total: 0,
  });

  const fetchCounts = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications/counts`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setStats(res.data.data);
  };

  if (user?.publicMetadata?.role !== "office-admissions") {
    return <div className="p-10 text-red-600 text-center">Not authorized</div>;
  }

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-10 space-y-10">
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow">
        Admissions – Office Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 gap-6">
        <StatCard
          title="Total Applications"
          value={stats.total}
          gradient="from-purple-500 to-pink-600"
          icon={<BarChart3 size={32} />}
        />

        <StatCard
          title="Applied"
          value={stats.applied}
          gradient="from-sky-500 to-blue-600"
          icon={<ArrowUpCircle size={32} />}
        />

        <StatCard
          title="Drafts"
          value={stats.drafts}
          gradient="from-gray-500 to-gray-700"
          icon={<FileEdit size={32} />}
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          gradient="from-blue-500 to-indigo-600"
          icon={<Clock size={32} />}
        />

        <StatCard
          title="Approved"
          value={stats.approved}
          gradient="from-amber-500 to-yellow-600"
          icon={<CheckCircle2 size={32} />}
        />

        <StatCard
          title="Not Allotted"
          value={stats.notAllotted}
          gradient="from-slate-500 to-slate-700"
          icon={<MinusCircle size={32} />}
        />

        <StatCard
          title="Admitted"
          value={stats.admitted}
          gradient="from-green-500 to-emerald-600"
          icon={<UserCheck size={32} />}
        />

        <StatCard
          title="Rejected"
          value={stats.rejected}
          gradient="from-red-500 to-rose-600"
          icon={<UserX size={32} />}
        />

        <StatCard
          title="Withdrawn"
          value={stats.withdrawn}
          gradient="from-orange-500 to-red-600"
          icon={<ArrowDownCircle size={32} />}
        />
      </div>
    </div>
  );
}

/* ------------------------------
   Reusable Gradient Stat Card
------------------------------ */
function StatCard({ title, value, gradient, icon }) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} text-white p-6 rounded-2xl shadow-xl 
                  flex flex-col justify-between hover:scale-[1.02] transition`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold tracking-wide">{title}</h3>
        <div className="opacity-90">{icon}</div>
      </div>
      <p className="text-4xl font-extrabold">{value}</p>
    </div>
  );
}
