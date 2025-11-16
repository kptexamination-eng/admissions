"use client";

import { useState } from "react";
import ZoomPhotoViewer from "./ZoomPhotoViewer";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

/* -------------------------------
   STATUS → STYLISH BADGE COLORS
-------------------------------- */
const statusColors = {
  Draft: "bg-gray-200 text-gray-800",
  Pending: "bg-blue-200 text-blue-800",
  Approved: "bg-amber-200 text-amber-800",
  NotAllotted: "bg-slate-200 text-slate-800",
  Admitted: "bg-green-200 text-green-800",
  Rejected: "bg-red-200 text-red-800",
  Withdrawn: "bg-orange-200 text-orange-800",
};

export default function ViewModal({ app, onClose, onUpdated }) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!app) return null;

  /* ---------------------------------------------------------
     Update Status Handler
  --------------------------------------------------------- */
  const updateStatus = async (newStatus) => {
    try {
      setLoading(true);
      const token = await getToken();

      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications/update-status/${app._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Status updated to " + newStatus);

      if (onUpdated) onUpdated();
      onClose();
      window.location.reload();
    } catch (err) {
      alert(err?.response?.data?.message || "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     Generate Action Buttons dynamically based on status
  --------------------------------------------------------- */
  const getActionButtons = () => {
    switch (app.status) {
      case "Draft":
        return (
          <>
            <button
              className="btn-blue"
              onClick={() => updateStatus("Pending")}
              disabled={loading}
            >
              Move to Pending
            </button>

            <button
              className="btn-red"
              onClick={() => updateStatus("Rejected")}
              disabled={loading}
            >
              Reject
            </button>
          </>
        );

      case "Pending":
        return (
          <>
            <button
              className="btn-green"
              onClick={() => updateStatus("Approved")}
              disabled={loading}
            >
              Approve (Verify)
            </button>

            <button
              className="btn-gray"
              onClick={() => updateStatus("NotAllotted")}
              disabled={loading}
            >
              Not Allotted
            </button>

            <button
              className="btn-red"
              onClick={() => updateStatus("Rejected")}
              disabled={loading}
            >
              Reject
            </button>
          </>
        );

      case "Approved":
        return (
          <>
            <button
              className="btn-blue"
              onClick={() => updateStatus("Admitted")}
              disabled={loading}
            >
              Mark Admitted (Seat + Fee)
            </button>

            <button
              className="btn-gray"
              onClick={() => updateStatus("NotAllotted")}
              disabled={loading}
            >
              Not Allotted
            </button>
          </>
        );

      case "Admitted":
        return (
          <button
            className="btn-orange"
            onClick={() => updateStatus("Withdrawn")}
            disabled={loading}
          >
            Mark Withdrawn
          </button>
        );

      default:
        return null;
    }
  };

  /* ---------------- Style Helpers ---------------- */
  const badgeClass = `px-3 py-1 rounded-full text-sm font-semibold ${
    statusColors[app.status]
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Application Details</h2>
          <button className="text-white text-2xl" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Section — Photo + Info */}
          <div className="flex items-center gap-6">
            <img
              src={app.photo?.url}
              alt="photo"
              className="w-36 h-36 rounded-xl object-cover shadow cursor-zoom-in"
              onClick={() => setZoomOpen(true)}
            />

            <div>
              <div className="text-lg font-semibold">
                {app.identity?.studentName}
              </div>
              <div className="text-sm text-gray-600">{app.program}</div>

              <div className="mt-2 flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <span className={badgeClass}>{app.status}</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-3">{getActionButtons()}</div>

          {/* Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Identity" data={app.identity} />
            <Section title="Study Details" data={app.studyDetails} />
            <Section title="Marks" data={app.marks} />
            <Section title="Contact" data={app.contact} />
            <Section title="Parents" data={app.parents} />
            <Section title="Course Options" data={app.courseOptions} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <div className="text-sm text-gray-600">Application ID: {app._id}</div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() =>
                window.open(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications/pdf/${app._id}`
                )
              }
            >
              Download PDF
            </button>

            <button
              className="px-4 py-2 bg-white border rounded"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {zoomOpen && (
          <ZoomPhotoViewer
            photoUrl={app.photo.url}
            onClose={() => setZoomOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

/* --------------------------
   Section Component
--------------------------- */
function Section({ title, data }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h4 className="font-semibold mb-2">{title}</h4>
      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
        {JSON.stringify(data || {}, null, 2)}
      </pre>
    </div>
  );
}

/* --------------------------
   BUTTON STYLE CLASSES
--------------------------- */
/* You can place these globally if needed */
const styles = `
.btn-blue { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 8px; }
.btn-green { background: #22c55e; color: white; padding: 0.5rem 1rem; border-radius: 8px; }
.btn-red { background: #dc2626; color: white; padding: 0.5rem 1rem; border-radius: 8px; }
.btn-gray { background: #6b7280; color: white; padding: 0.5rem 1rem; border-radius: 8px; }
.btn-orange { background: #ea580c; color: white; padding: 0.5rem 1rem; border-radius: 8px; }
`;
