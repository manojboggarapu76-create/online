import { useState, useEffect } from "react";

export default function DynamicWatermark({
  username = "Guest Student",
  sessionId = "SEC-XXXXXX",
  sectionTitle = "Online Class",
}) {
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const watermarkString = `CONFIDENTIAL • ${username} • ${sessionId} • ${currentTime} • ${sectionTitle}`;

  // Generate an array of repeated watermark rows
  const rows = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="oc-watermark-overlay" aria-hidden="true">
      <div className="oc-watermark-grid">
        {rows.map((r) => (
          <div className="oc-watermark-row" key={r}>
            <span>{watermarkString}</span>
            <span>{watermarkString}</span>
            <span>{watermarkString}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
