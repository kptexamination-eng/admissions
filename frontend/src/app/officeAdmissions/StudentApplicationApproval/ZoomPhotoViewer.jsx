"use client";

import { useState } from "react";

export default function ZoomPhotoViewer({ photoUrl, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const startDrag = (e) => {
    setDragging(true);
    setStart({ x: e.clientX - drag.x, y: e.clientY - drag.y });
  };

  const duringDrag = (e) => {
    if (!dragging) return;
    setDrag({
      x: e.clientX - start.x,
      y: e.clientY - start.y,
    });
  };

  const endDrag = () => setDragging(false);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      onMouseUp={endDrag}
      onMouseMove={duringDrag}
    >
      <div className="absolute top-5 right-5 flex gap-4">
        <button
          className="bg-white p-3 rounded-full shadow"
          onClick={() => setZoom((z) => Math.min(z + 0.2, 4))}
        >
          ➕
        </button>

        <button
          className="bg-white p-3 rounded-full shadow"
          onClick={() => setZoom((z) => Math.max(z - 0.2, 1))}
        >
          ➖
        </button>

        <button
          className="bg-white p-3 rounded-full shadow"
          onClick={() => window.open(photoUrl, "_blank")}
        >
          ⬇️ Download
        </button>

        <button
          className="bg-red-600 text-white p-3 rounded-full shadow"
          onClick={onClose}
        >
          ✖
        </button>
      </div>

      <img
        src={photoUrl}
        alt="Zoomed"
        onMouseDown={startDrag}
        style={{
          transform: `scale(${zoom}) translate(${drag.x / zoom}px, ${
            drag.y / zoom
          }px)`,
          cursor: "grab",
          maxWidth: "80%",
          maxHeight: "80%",
        }}
        className="select-none transition-transform"
      />
    </div>
  );
}
