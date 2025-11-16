"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function MyApplicationStatus() {
  const { getToken } = useAuth();
  const [app, setApp] = useState(null);

  useEffect(() => {
    const loadStatus = async () => {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApp(res.data.data);
    };

    loadStatus();
  }, []);

  if (!app) return <p className="p-10">No Application Found</p>;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">My Application Status</h1>

      <div className="mt-6 p-6 bg-white shadow rounded">
        <p>
          <strong>Student Name:</strong> {app.identity.studentName}
        </p>
        <p>
          <strong>Program:</strong> {app.program}
        </p>
        <p>
          <strong>Status:</strong> {app.status}
        </p>
        <p>
          <strong>Submitted On:</strong>{" "}
          {new Date(app.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
