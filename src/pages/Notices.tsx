// src/pages/Notices.tsx
import { useEffect, useState } from "react";
import { getNotices } from "../api/notices";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

interface Visibility {
  role?: string;
  department?: string;
  class?: string;
  batch?: string;
}

interface Notice {
  _id: string;
  title?: string;
  content: string;
  createdAt?: string;
  visibility?: Visibility;
}

// Dummy fallback data with representative visibility values
const dummyNotices: Notice[] = [
  {
    _id: "1",
    title: "Welcome to the Portal",
    content: "Stay updated with the latest notices and announcements.",
    createdAt: new Date().toISOString(),
    visibility: { role: "student", department: "IT" }
  },
  {
    _id: "2",
    title: "Assignment Submission",
    content: "Submit your assignments before Friday 5 PM.",
    createdAt: new Date().toISOString(),
    visibility: { role: "student", department: "IT", class: "FE" }
  },
  {
    _id: "3",
    title: "Tech Fest",
    content: "Join us for the annual tech fest next week!",
    createdAt: new Date().toISOString(),
    visibility: { role: "student", department: "IT", class: "SE", batch: "A" }
  }
];

/** Assign each notice to exactly one group based on the visibility hierarchy. */
function groupNotices(notices: Notice[]) {
  const batch: Notice[] = [];
  const cls: Notice[] = [];
  const department: Notice[] = [];
  const general: Notice[] = [];

  for (const n of notices) {
    const v = n.visibility;
    if (v?.batch) {
      batch.push(n);
    } else if (v?.class) {
      cls.push(n);
    } else if (v?.department) {
      department.push(n);
    } else {
      general.push(n);
    }
  }

  return { batch, class: cls, department, general };
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

interface NoticeCardProps {
  notice: Notice;
  onClick: (n: Notice) => void;
}

function NoticeCard({ notice, onClick }: NoticeCardProps) {
  const title = notice.title?.trim() || "Untitled";
  const preview =
    notice.content.length > 80
      ? notice.content.slice(0, 80) + "\u2026"
      : notice.content;

  return (
    <button
      onClick={() => onClick(notice)}
      className="w-full h-36 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition p-4 text-left flex flex-col justify-between border border-transparent hover:border-indigo-300 dark:hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 line-clamp-1">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3 flex-1">{preview}</p>
      {notice.createdAt && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatDate(notice.createdAt)}</p>
      )}
    </button>
  );
}

interface GroupSectionProps {
  label: string;
  emoji: string;
  notices: Notice[];
  onCardClick: (n: Notice) => void;
}

function GroupSection({ label, emoji, notices, onCardClick }: GroupSectionProps) {
  if (notices.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
        {emoji} {label}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {notices.map(n => (
          <NoticeCard key={n._id} notice={n} onClick={onCardClick} />
        ))}
      </div>
    </section>
  );
}

interface NoticeModalProps {
  notice: Notice;
  onClose: () => void;
}

function NoticeModal({ notice, onClose }: NoticeModalProps) {
  const title = notice.title?.trim() || "Untitled";
  const v = notice.visibility;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      onClick={e => { if (e.target === e.currentTarget) { e.stopPropagation(); onClose(); } }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none focus:outline-none"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 id="notice-modal-title" className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mb-1 pr-6">
          {title}
        </h2>

        {notice.createdAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{formatDate(notice.createdAt)}</p>
        )}

        {v && (
          <div className="flex flex-wrap gap-2 mb-4">
            {v.department && (
              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                Dept: {v.department}
              </span>
            )}
            {v.class && (
              <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">
                Class: {v.class}
              </span>
            )}
            {v.batch && (
              <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                Batch: {v.batch}
              </span>
            )}
            {!v.department && !v.class && !v.batch && (
              <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs px-2 py-0.5 rounded-full">
                General
              </span>
            )}
          </div>
        )}

        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
      </div>
    </div>
  );
}

interface NoticesProps {
  /** When true, hides the standalone top-bar (used when embedded in Dashboard) */
  embedded?: boolean;
}

export default function Notices({ embedded = false }: NoticesProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selected, setSelected] = useState<Notice | null>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const canCreateNotice = ["admin", "faculty"].includes(user.role);

  useEffect(() => {
    getNotices(token || undefined)
      .then(res => {
        setNotices(res.data.length === 0 ? dummyNotices : res.data);
      })
      .catch(() => {
        setNotices(dummyNotices);
      });
  }, []);

  const groups = groupNotices(notices);

  const content = (
    <div className="max-w-5xl mx-auto">
      {/* Top Bar (only when not embedded) */}
      {!embedded && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📢 Notices</h2>

          <div className="flex gap-3 items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {!token && (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-indigo-500 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-600 transition font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 transition font-medium"
                >
                  Register
                </button>
              </>
            )}
            {token && canCreateNotice && (
              <button
                onClick={() => navigate("/add-notice")}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                + Add Notice
              </button>
            )}
          </div>
        </div>
      )}

      {/* Embedded header */}
      {embedded && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">📢 Latest Notices</h2>
          {canCreateNotice && (
            <button
              onClick={() => navigate("/add-notice")}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
            >
              + Add Notice
            </button>
          )}
        </div>
      )}

      {/* Grouped Sections */}
      <GroupSection
        label="Batch Notices"
        emoji="🎓"
        notices={groups.batch}
        onCardClick={setSelected}
      />
      <GroupSection
        label="Class Notices"
        emoji="🏫"
        notices={groups.class}
        onCardClick={setSelected}
      />
      <GroupSection
        label="Department Notices"
        emoji="🏢"
        notices={groups.department}
        onCardClick={setSelected}
      />
      <GroupSection
        label="General Notices"
        emoji="📋"
        notices={groups.general}
        onCardClick={setSelected}
      />

      {notices.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-10">No notices available.</p>
      )}

      {/* Modal */}
      {selected && (
        <NoticeModal notice={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 p-6">
      {content}
    </div>
  );
}

