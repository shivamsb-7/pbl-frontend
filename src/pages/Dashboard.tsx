// src/pages/Dashboard.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getNotices } from "../api/notices";
import {
  type Notice,
  formatDate,
  groupNotices,
  groupNoticesForTeacher,
  isGeneralNotice,
  dummyNotices
} from "../utils/noticeUtils";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const CLASSES = ["FE", "SE", "TE", "BE"] as const;
const BRANCHES = ["CE", "ENTC", "IT", "AI/DS", "ECE"] as const;
const BATCH_MAP: Record<string, string[]> = {
  CE:      ["1", "2", "3", "4"],
  ENTC:    ["5", "6", "7", "8"],
  IT:      ["9", "10", "11"],
  "AI/DS": ["12"],
  ECE:     ["13"],
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

function NoticeModal({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const title = notice.title?.trim() || "Untitled";
  const v = notice.visibility;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
          aria-label="Close"
        >
          <Icon name="close" />
        </button>

        {v && (
          <div className="flex flex-wrap gap-2 mb-3">
            {isGeneralNotice(notice) && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-violet-300 bg-violet-900/40 border border-violet-800 px-2 py-0.5 rounded-full">
                <Icon name="public" className="text-xs" /> General
              </span>
            )}
            {v.department && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-300 bg-blue-900/40 border border-blue-800 px-2 py-0.5 rounded-full">
                <Icon name="business" className="text-xs" /> {v.department}
              </span>
            )}
            {v.class && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-300 bg-purple-900/40 border border-purple-800 px-2 py-0.5 rounded-full">
                <Icon name="school" className="text-xs" /> {v.class}
              </span>
            )}
            {v.batch && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300 bg-emerald-900/40 border border-emerald-800 px-2 py-0.5 rounded-full">
                <Icon name="groups" className="text-xs" /> Batch {v.batch}
              </span>
            )}
          </div>
        )}

        <h2 id="notice-modal-title" className="text-xl font-bold text-white mb-1 pr-6">
          {title}
        </h2>

        {notice.createdAt && (
          <p className="text-xs text-gray-500 mb-4">{formatDate(notice.createdAt)}</p>
        )}

        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{notice.content}</p>
      </div>
    </div>
  );
}

function NoticeCard({ notice, onClick }: { notice: Notice; onClick: () => void }) {
  const title = notice.title?.trim() || "Untitled";
  const preview = notice.content.length > 90 ? notice.content.slice(0, 90) + "…" : notice.content;
  const v = notice.visibility;

  const accentClass = isGeneralNotice(notice)
    ? "border-violet-800 hover:border-violet-500"
    : v?.batch
      ? "border-emerald-900 hover:border-emerald-600"
      : v?.class
        ? "border-purple-900 hover:border-purple-600"
        : v?.department
          ? "border-blue-900 hover:border-blue-600"
          : "border-gray-700 hover:border-gray-500";

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left bg-gray-900 border ${accentClass} rounded-2xl p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 flex flex-col gap-2 h-44`}
    >
      <p className="text-sm font-semibold text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
        {title}
      </p>
      <p className="text-xs text-gray-400 line-clamp-3 flex-1">{preview}</p>
      {notice.createdAt && (
        <p className="text-xs text-gray-600 mt-auto">{formatDate(notice.createdAt)}</p>
      )}
    </button>
  );
}

interface GroupSectionProps {
  label: string;
  icon: string;
  notices: Notice[];
  onCardClick: (n: Notice) => void;
  accent?: string;
}

function GroupSection({ label, icon, notices, onCardClick, accent = "text-gray-400" }: GroupSectionProps) {
  if (notices.length === 0) return null;

  return (
    <section className="mb-10">
      <h3 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 ${accent}`}>
        <Icon name={icon} /> {label}
        <span className="ml-1 text-xs font-normal text-gray-600 normal-case tracking-normal">({notices.length})</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {notices.map(n => (
          <NoticeCard key={n._id} notice={n} onClick={() => onCardClick(n)} />
        ))}
      </div>
    </section>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1 min-w-56">
      <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none">
        search
      </span>
      <input
        type="text"
        placeholder="Search by title or content…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
      />
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

function StudentDashboard({ notices }: { notices: Notice[] }) {
  const [selected, setSelected] = useState<Notice | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return notices;
    const q = search.toLowerCase();
    return notices.filter(n =>
      (n.title || "").toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );
  }, [notices, search]);

  const groups = groupNotices(filtered);

  return (
    <>
      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-8">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {search && (
        <p className="text-xs text-gray-500 mb-4">
          {filtered.length} notice{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <Icon name={search ? "search_off" : "inbox"} className="text-6xl mb-4" />
          <p className="text-lg font-medium">
            {search ? "No notices match your search." : "No notices for you yet."}
          </p>
        </div>
      ) : (
        <>
          <GroupSection label="General" icon="public" notices={groups.general} onCardClick={setSelected} accent="text-violet-400" />
          <GroupSection label="Department" icon="business" notices={groups.department} onCardClick={setSelected} accent="text-blue-400" />
          <GroupSection label="Class" icon="school" notices={groups.class} onCardClick={setSelected} accent="text-purple-400" />
          <GroupSection label="Batch" icon="groups" notices={groups.batch} onCardClick={setSelected} accent="text-emerald-400" />
        </>
      )}
      {selected && <NoticeModal notice={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ─── Teacher / Admin Dashboard ────────────────────────────────────────────────

function TeacherDashboard({ notices }: { notices: Notice[] }) {
  const [selected, setSelected] = useState<Notice | null>(null);
  const [search, setSearch] = useState("");
  const [filterSort, setFilterSort] = useState<"newest" | "oldest">("newest");
  const [filterClass, setFilterClass] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  const filtered = useMemo(() => {
    let result = notices;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        (n.title || "").toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }

    if (filterClass) {
      result = result.filter(n => n.visibility?.class === filterClass);
    }

    if (filterBatch) {
      result = result.filter(n => n.visibility?.batch === filterBatch);
    } else if (filterBranch) {
      const branchBatches = BATCH_MAP[filterBranch] ?? [];
      result = result.filter(n => n.visibility?.batch && branchBatches.includes(n.visibility.batch));
    }

    result = [...result].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return filterSort === "newest" ? tb - ta : ta - tb;
    });

    return result;
  }, [notices, search, filterSort, filterClass, filterBranch, filterBatch]);

  const groups = groupNoticesForTeacher(filtered);
  const classKeys = Object.keys(groups.byClass).sort();

  const batchOptions = filterBranch ? BATCH_MAP[filterBranch] ?? [] : [];
  const selectClass = "px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} />

        <select
          value={filterSort}
          onChange={e => setFilterSort(e.target.value as "newest" | "oldest")}
          className={selectClass}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Class + Branch + Batch filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className={selectClass}
        >
          <option value="">All Classes</option>
          {CLASSES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filterBranch}
          onChange={e => {
            const b = e.target.value;
            setFilterBranch(b);
            // Reset batch if it no longer belongs to the new branch
            const valid = b ? BATCH_MAP[b] ?? [] : [];
            if (filterBatch && !valid.includes(filterBatch)) setFilterBatch("");
          }}
          className={selectClass}
        >
          <option value="">All Branches</option>
          {BRANCHES.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {filterBranch && (
          <select
            value={filterBatch}
            onChange={e => setFilterBatch(e.target.value)}
            className={selectClass}
          >
            <option value="">All Batches</option>
            {batchOptions.map(b => (
              <option key={b} value={b}>Batch {b}</option>
            ))}
          </select>
        )}
      </div>

      {search && (
        <p className="text-xs text-gray-500 mb-4">
          {filtered.length} notice{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <Icon name="search_off" className="text-6xl mb-4" />
          <p className="text-lg font-medium">No notices match your filters.</p>
        </div>
      ) : (
        <>
          <GroupSection label="General" icon="public" notices={groups.general} onCardClick={setSelected} accent="text-violet-400" />

          {classKeys.map(cls => (
            <GroupSection
              key={cls}
              label={`Class ${cls}`}
              icon="school"
              notices={groups.byClass[cls]}
              onCardClick={setSelected}
              accent="text-purple-400"
            />
          ))}

          <GroupSection label="Batch Notices" icon="groups" notices={groups.batch} onCardClick={setSelected} accent="text-emerald-400" />
          <GroupSection label="Department" icon="business" notices={groups.department} onCardClick={setSelected} accent="text-blue-400" />
          <GroupSection label="Other" icon="article" notices={groups.other} onCardClick={setSelected} accent="text-gray-400" />
        </>
      )}

      {selected && <NoticeModal notice={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user") || "{}";
  const user = (() => { try { return JSON.parse(userStr); } catch { return {}; } })();
  const canCreateNotice = ["admin", "faculty"].includes(user?.role);
  const isTeacher = user?.role === "faculty";
  const isAdmin = user?.role === "admin";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    setLoading(true);
    getNotices(token || undefined)
      .then(res => {
        // Trust the backend to filter notices by role — show all returned notices.
        const all: Notice[] = res.data.length === 0 ? dummyNotices : res.data;
        setNotices(all);
      })
      .catch(() => {
        setNotices(dummyNotices);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const roleLabel = isAdmin ? "Admin" : isTeacher ? "Faculty" : "Student";
  const roleIcon = isAdmin ? "admin_panel_settings" : isTeacher ? "person_pin" : "school";

  const dashboardTitle = isAdmin
    ? "Admin Dashboard"
    : isTeacher
      ? "Teacher Dashboard"
      : "Your Notices";

  const dashboardSubtitle = isAdmin
    ? "All notices across every role, department, class and batch."
    : isTeacher
      ? "All notices returned for your role, grouped by category."
      : "All notices personalized for you.";

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Icon name="dashboard" className="text-2xl text-violet-400" />
          <span className="text-lg font-bold tracking-tight text-white">Dashboard</span>
          {user?.name && (
            <span className="hidden sm:inline text-sm text-gray-500">— {user.name}</span>
          )}
          <span className="hidden sm:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-600 border border-gray-700 rounded-full px-2 py-0.5">
            <Icon name={roleIcon} className="text-xs" /> {roleLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            aria-label="Toggle theme"
          >
            <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate("/admin/requests")}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-800/50 text-amber-400 hover:text-amber-300 font-medium text-sm transition"
            >
              <Icon name="manage_accounts" /> Requests
            </button>
          )}

          {canCreateNotice && (
            <button
              onClick={() => navigate("/add-notice")}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition"
            >
              <Icon name="add" /> Add Notice
            </button>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-900/50 text-red-400 hover:text-red-300 font-medium text-sm transition"
          >
            <Icon name="logout" /> Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{dashboardTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{dashboardSubtitle}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-600">
            <Icon name="refresh" className="text-4xl animate-spin mr-3" />
            <span className="text-lg">Loading notices…</span>
          </div>
        ) : (isTeacher || isAdmin) ? (
          <TeacherDashboard notices={notices} />
        ) : (
          <StudentDashboard notices={notices} />
        )}
      </main>
    </div>
  );
}
