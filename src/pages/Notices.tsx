// src/pages/Notices.tsx
import { useEffect, useMemo, useState } from "react";
import { getNotices, deleteNotice } from "../api/notices";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import ReactMarkdown from "react-markdown";
import { type Notice, isGeneralNotice, isNoticeExpired, stripMarkdown } from "../utils/noticeUtils";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
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
  user?: { _id?: string; role?: string };
  onDelete?: (id: string) => void;
}

function NoticeCard({ notice, onClick, user, onDelete }: NoticeCardProps) {
  const title = notice.title?.trim() || "Untitled";
  const plain = stripMarkdown(notice.content);
  const preview = plain.length > 80 ? plain.slice(0, 80) + "\u2026" : plain;

  const canDelete =
    !!onDelete &&
    (user?.role === "faculty" || user?.role === "admin") &&
    (!notice.createdBy || notice.createdBy === user?._id);

  const handleDelete = (e: { preventDefault(): void; stopPropagation(): void }) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this notice?")) {
      onDelete!(notice._id);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={() => onClick(notice)}
        className="w-full h-36 bg-white rounded-xl shadow-md hover:shadow-lg transition p-4 text-left flex flex-col justify-between border border-transparent hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <p className="text-sm font-semibold text-indigo-700 line-clamp-1">{title}</p>
        <p className="text-xs text-slate-600 mt-1 line-clamp-3 flex-1">{preview}</p>
        {notice.createdAt && (
          <p className="text-xs text-slate-500 mt-2">{formatDate(notice.createdAt)}</p>
        )}
        {notice.expiryDate && (
          <p className="text-xs text-amber-700 mt-1">
            Expires: {formatDate(notice.expiryDate)}
          </p>
        )}
      </button>
      {canDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-700 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Delete notice"
        >
          <Icon name="delete" className="text-base" />
        </button>
      )}
    </div>
  );
}

interface GroupSectionProps {
  label: string;
  emoji: string;
  notices: Notice[];
  onCardClick: (n: Notice) => void;
  user?: { _id?: string; role?: string };
  onDelete?: (id: string) => void;
}

function GroupSection({ label, emoji, notices, onCardClick, user, onDelete }: GroupSectionProps) {
  if (notices.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 className="text-lg font-semibold text-slate-700 mb-3">
        {emoji} {label}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {notices.map(n => (
          <NoticeCard key={n._id} notice={n} onClick={onCardClick} user={user} onDelete={onDelete} />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      onClick={e => { if (e.target === e.currentTarget) { e.stopPropagation(); onClose(); } }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl leading-none focus:outline-none"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 id="notice-modal-title" className="text-xl font-bold text-indigo-700 mb-1 pr-6">
          {title}
        </h2>

        {notice.createdAt && (
          <p className="text-xs text-slate-500 mb-4">{formatDate(notice.createdAt)}</p>
        )}
        {notice.expiryDate && (
          <p className="text-xs text-amber-700 mb-4">Expires: {formatDate(notice.expiryDate)}</p>
        )}

        {v && (
          <div className="flex flex-wrap gap-2 mb-4">
            {v.department && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Dept: {v.department}
              </span>
            )}
            {v.class && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                Class: {v.class}
              </span>
            )}
            {v.batch && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Batch: {v.batch}
              </span>
            )}
            {!v.department && !v.class && !v.batch && (
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                General
              </span>
            )}
          </div>
        )}

        <p className="text-slate-700 leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-indigo-600 [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-slate-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_a]:text-indigo-600 [&_a]:underline [&_strong]:font-bold [&_em]:italic [&_p]:mb-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic">
          <ReactMarkdown>{notice.content}</ReactMarkdown>
        </p>
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
  const [showPastGeneral, setShowPastGeneral] = useState(false);
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
  }, [token]);

  const handleDeleteNotice = async (id: string) => {
    try {
      await deleteNotice(id, token || "");
      setNotices(prev => prev.filter(n => n._id !== id));
    } catch {
      alert("Failed to delete notice. Please try again.");
    }
  };

  const { activeNotices, pastGeneralNotices, allGeneralNotices } = useMemo(() => {
    const active: Notice[] = [];
    const pastGeneral: Notice[] = [];
    const general: Notice[] = [];

    for (const notice of notices) {
      const expired = isNoticeExpired(notice);
      const generalNotice = isGeneralNotice(notice);

      if (!expired) active.push(notice);
      if (generalNotice) {
        general.push(notice);
        if (expired) pastGeneral.push(notice);
      }
    }

    return { activeNotices: active, pastGeneralNotices: pastGeneral, allGeneralNotices: general };
  }, [notices]);
  const groups = groupNotices(activeNotices);

  const summary = {
    total: allGeneralNotices.length,
    active: allGeneralNotices.filter(n => !isNoticeExpired(n)).length,
    expired: allGeneralNotices.filter(n => isNoticeExpired(n)).length
  };

  const content = (
    <div className="max-w-5xl mx-auto">
      {/* Top Bar (only when not embedded) */}
      {!embedded && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">📢 Notices</h2>

          <div className="flex gap-3 items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100 transition focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label="Toggle theme"
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
          <h2 className="text-2xl font-semibold text-slate-700">📢 Latest Notices</h2>
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
      <section className="mb-6 p-4 rounded-xl border border-indigo-200 bg-indigo-50/70">
        <h3 className="text-sm font-semibold text-indigo-700 mb-2">General Notices Summary</h3>
        <p className="text-sm text-slate-700">
          Total: <b>{summary.total}</b> · Active: <b>{summary.active}</b> · Past: <b>{summary.expired}</b>
        </p>
      </section>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowPastGeneral(false)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            !showPastGeneral
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          Active Notices
        </button>
        <button
          onClick={() => setShowPastGeneral(true)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            showPastGeneral
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          Past General Notices
        </button>
      </div>

      {!showPastGeneral ? (
        <>
          <GroupSection
            label="Batch Notices"
            emoji="🎓"
            notices={groups.batch}
            onCardClick={setSelected}
            user={user}
            onDelete={handleDeleteNotice}
          />
          <GroupSection
            label="Class Notices"
            emoji="🏫"
            notices={groups.class}
            onCardClick={setSelected}
            user={user}
            onDelete={handleDeleteNotice}
          />
          <GroupSection
            label="Department Notices"
            emoji="🏢"
            notices={groups.department}
            onCardClick={setSelected}
            user={user}
            onDelete={handleDeleteNotice}
          />
          <GroupSection
            label="General Notices"
            emoji="📋"
            notices={groups.general}
            onCardClick={setSelected}
            user={user}
            onDelete={handleDeleteNotice}
          />
        </>
      ) : (
        <GroupSection
          label="Past General Notices"
          emoji="🗂️"
          notices={pastGeneralNotices}
          onCardClick={setSelected}
          user={user}
          onDelete={handleDeleteNotice}
        />
      )}

      {activeNotices.length === 0 && !showPastGeneral && (
        <p className="text-center text-slate-600 mt-10">No notices available.</p>
      )}
      {showPastGeneral && pastGeneralNotices.length === 0 && (
        <p className="text-center text-slate-600 mt-10">No past general notices.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 transition-colors duration-300 p-6">
      {content}
    </div>
  );
}
