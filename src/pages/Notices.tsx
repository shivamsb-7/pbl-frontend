// src/pages/Notices.tsx
import { useEffect, useState } from "react";
import { getNotices } from "../api/notices";

export default function Notices() {
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    getNotices(token || undefined).then(res => {
      setNotices(res.data);
    });
  }, []);

  return (
    <div>
      <h2>Notices</h2>
      {notices.map(n => (
        <div key={n._id} style={{ border: "1px solid #ccc", margin: 10 }}>
          <h3>{n.title}</h3>
          <p>{n.content}</p>
        </div>
      ))}
    </div>
  );
}