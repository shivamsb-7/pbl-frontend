// src/pages/Notices.tsx
import { useEffect, useState } from "react";
import { getNotices } from "../api/notices";
import { useNavigate } from "react-router-dom";

export default function Notices() {
  const [notices, setNotices] = useState<any[]>([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    getNotices(token || undefined)
      .then(res => {
        if (res.data.length === 0) {
          setNotices(dummyNotices);
        } else {
          setNotices(res.data);
        }
      })
      .catch(() => {
        setNotices(dummyNotices);
      });
  }, []);

  // Dummy fallback data
  const dummyNotices = [
    {
      _id: "1",
      title: "📢 Welcome to the Portal",
      content: "Stay updated with the latest notices and announcements."
    },
    {
      _id: "2",
      title: "📝 Assignment Submission",
      content: "Submit your assignments before Friday 5 PM."
    },
    {
      _id: "3",
      title: "🎉 Tech Fest",
      content: "Join us for the annual tech fest next week!"
    }
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        
        <h2 className="text-2xl font-bold text-gray-800">
          📢 Notices
        </h2>

        <div className="flex gap-3">
          
          {!token && (
            <>
              <button
                onClick={() => navigate("/login")}
                className="bg-indigo-500 text-white px-4 py-1 rounded-lg hover:bg-indigo-600 transition"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="bg-green-500 text-white px-4 py-1 rounded-lg hover:bg-green-600 transition"
              >
                Register
              </button>
            </>
          )}

          {token && (
            <button
              onClick={() => navigate("/add-notice")}
              className="bg-indigo-600 text-white px-4 py-1 rounded-lg hover:bg-indigo-700 transition"
            >
              + Add Notice
            </button>
          )}

        </div>
      </div>

      {/* Notices List */}
      <div className="max-w-3xl mx-auto space-y-4">
        {notices.map(n => (
          <div
            key={n._id}
            className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-indigo-600">
              {n.title}
            </h3>
            <p className="text-gray-600 mt-1">
              {n.content}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}