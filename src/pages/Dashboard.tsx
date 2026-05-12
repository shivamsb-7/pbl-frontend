// src/pages/Dashboard.tsx
import { useEffect, useState, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { getNotices, deleteNotice } from "../api/notices";
import ReactMarkdown from "react-markdown";
import type { Components as MarkdownComponents } from "react-markdown";
import AppNavbar from "../components/AppNavbar";
import {
  type Notice,
  formatDate,
  groupNotices,
  groupNoticesForTeacher,
  isGeneralNotice,
  isNoticeExpired,
  stripMarkdown,
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

/** Helper: get expiry timestamp for sorting (notices without expiry sort last/first based on direction) */
function getExpiryTime(notice: Notice, direction: "asc" | "desc"): number {
  if (notice.expiryDate) return new Date(notice.expiryDate).getTime();
  return direction === "asc" ? Infinity : -Infinity;
}

/** Shared markdown components with light defaults (dark mode handled via global CSS overrides) */
const mdComponents: MarkdownComponents = {
  h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold text-slate-900 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-slate-800 mb-1">{children}</h3>,
  p: ({ children }) => <p className="mb-2">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 my-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 my-1">{children}</ol>,
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  code: ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-violet-700 text-xs font-mono">{children}</code>,
  pre: ({ children }) => <pre className="bg-slate-100 rounded-lg p-3 overflow-x-auto my-2 text-sm text-slate-700">{children}</pre>,
  a: ({ href, children }) => {
    const safe = href && /^(https?:|mailto:)/i.test(href) ? href : "#";
    return <a href={safe} className="text-violet-700 underline hover:text-violet-800" target="_blank" rel="noopener noreferrer">{children}</a>;
  },
  blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-300 pl-3 text-slate-600 italic my-2">{children}</blockquote>,
  strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
};

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition"
          aria-label="Close"
        >
          <Icon name="close" />
        </button>

        {v && (
          <div className="flex flex-wrap gap-2 mb-3">
            {isGeneralNotice(notice) && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">
                <Icon name="public" className="text-xs" /> General
              </span>
            )}
            {v.department && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
                <Icon name="business" className="text-xs" /> {v.department}
              </span>
            )}
            {v.class && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                <Icon name="school" className="text-xs" /> {v.class}
              </span>
            )}
            {v.batch && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Icon name="groups" className="text-xs" /> Batch {v.batch}
              </span>
            )}
          </div>
        )}

        <h2 id="notice-modal-title" className="text-xl font-bold text-slate-900 mb-1 pr-6">
          {title}
        </h2>

        {notice.createdAt && (
          <p className="text-xs text-slate-500 mb-1">{formatDate(notice.createdAt)}</p>
        )}
        {notice.expiryDate && (
          <p className={`text-xs mb-4 ${isNoticeExpired(notice) ? "text-red-600" : "text-amber-700"}`}>
            {isNoticeExpired(notice) ? "Expired: " : "Expires: "}{formatDate(notice.expiryDate)}
          </p>
        )}

        <div className="text-slate-700 leading-relaxed text-sm space-y-1">
          <ReactMarkdown components={mdComponents}>{notice.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function NoticeCard({
  notice,
  onClick,
  user,
  onDelete,
}: {
  notice: Notice;
  onClick: () => void;
  user?: { _id?: string; role?: string };
  onDelete?: (id: string) => void;
}) {
  const title = notice.title?.trim() || "Untitled";
  const plain = stripMarkdown(notice.content);
  const preview = plain.length > 90 ? plain.slice(0, 90) + "…" : plain;
  const v = notice.visibility;
  const expired = isNoticeExpired(notice);

  const accentClass = isGeneralNotice(notice)
      ? "border-violet-200 hover:border-violet-400"
    : v?.batch
        ? "border-emerald-200 hover:border-emerald-400"
      : v?.class
          ? "border-purple-200 hover:border-purple-400"
        : v?.department
            ? "border-blue-200 hover:border-blue-400"
            : "border-slate-200 hover:border-slate-400";

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
        onClick={onClick}
        className={`w-full text-left bg-white border ${accentClass} rounded-2xl p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 flex flex-col gap-2 h-44`}
      >
        <p className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-violet-700 transition-colors">
          {title}
        </p>
        <p className="text-xs text-slate-600 line-clamp-3 flex-1">{preview}</p>
        {notice.createdAt && (
          <p className="text-xs text-slate-500 mt-auto">{formatDate(notice.createdAt)}</p>
        )}
        {notice.expiryDate && (
          <p className={`text-xs ${expired ? "text-red-600" : "text-amber-700"}`}>
            {expired ? "Expired: " : "Expires: "}{formatDate(notice.expiryDate)}
          </p>
        )}
      </button>
      {canDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-100 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
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
  icon: string;
  notices: Notice[];
  onCardClick: (n: Notice) => void;
  accent?: string;
  user?: { _id?: string; role?: string };
  onDelete?: (id: string) => void;
}

function GroupSection({ label, icon, notices, onCardClick, accent = "text-slate-600", user, onDelete }: GroupSectionProps) {
  if (notices.length === 0) return null;

  return (
    <section className="mb-10">
      <h3 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 ${accent}`}>
        <Icon name={icon} /> {label}
        <span className="ml-1 text-xs font-normal text-slate-500 normal-case tracking-normal">({notices.length})</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {notices.map(n => (
          <NoticeCard key={n._id} notice={n} onClick={() => onCardClick(n)} user={user} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

// ─── Expired Notices collapsible section ─────────────────────────────────────

function ExpiredSection({
  notices,
  open,
  onToggle,
  onCardClick,
  user,
  onDelete,
}: {
  notices: Notice[];
  open: boolean;
  onToggle: () => void;
  onCardClick: (n: Notice) => void;
  user?: { _id?: string; role?: string };
  onDelete?: (id: string) => void;
}) {
  if (notices.length === 0) return null;
  return (
    <section className="mt-10 border-t border-slate-200 pt-6">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left text-sm font-semibold uppercase tracking-widest text-slate-600 hover:text-slate-800 transition"
        aria-expanded={open}
      >
        <Icon name={open ? "expand_less" : "expand_more"} />
        <Icon name="history" />
        Expired Notices
        <span className="ml-1 text-xs font-normal text-slate-500 normal-case tracking-normal">({notices.length})</span>
      </button>
      {open && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {notices.map(n => (
            <NoticeCard key={n._id} notice={n} onClick={() => onCardClick(n)} user={user} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1 min-w-56">
      <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none">
        search
      </span>
      <input
        type="text"
        placeholder="Search by title or content…"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
      />
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

function StudentDashboard({
  notices,
  user,
  onDelete,
}: {
  notices: Notice[];
  user?: { _id?: string; role?: string };
  onDelete?: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Notice | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "expiry-soonest" | "expiry-latest">("newest");
  const [showExpired, setShowExpired] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return notices;
    const q = search.toLowerCase();
    return notices.filter(n =>
      (n.title || "").toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );
  }, [notices, search]);

  const activeNotices = useMemo(() => {
    const active = filtered.filter(n => !isNoticeExpired(n));
    return [...active].sort((a, b) => {
      if (sortBy === "expiry-soonest") return getExpiryTime(a, "asc") - getExpiryTime(b, "asc");
      if (sortBy === "expiry-latest") return getExpiryTime(b, "desc") - getExpiryTime(a, "desc");
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return sortBy === "newest" ? tb - ta : ta - tb;
    });
  }, [filtered, sortBy]);

  const expiredNotices = useMemo(
    () => filtered
      .filter(n => isNoticeExpired(n))
      .sort((a, b) => new Date(b.expiryDate ?? 0).getTime() - new Date(a.expiryDate ?? 0).getTime()),
    [filtered]
  );

  const groups = groupNotices(activeNotices);

  return (
    <>
      {/* Search + Sort */}
      <div className="flex flex-wrap gap-3 mb-8">
        <SearchBar value={search} onChange={setSearch} />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="expiry-soonest">Expiry: soonest first</option>
          <option value="expiry-latest">Expiry: latest first</option>
        </select>
      </div>

      {search && (
        <p className="text-xs text-slate-500 mb-4">
          {activeNotices.length + expiredNotices.length} notice{activeNotices.length + expiredNotices.length !== 1 ? "s" : ""} found
        </p>
      )}

      {activeNotices.length === 0 && expiredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Icon name={search ? "search_off" : "inbox"} className="text-6xl mb-4" />
          <p className="text-lg font-medium">
            {search ? "No notices match your search." : "No notices for you yet."}
          </p>
        </div>
      ) : (
        <>
          <GroupSection label="General" icon="public" notices={groups.general} onCardClick={setSelected} accent="text-violet-400" user={user} onDelete={onDelete} />
          <GroupSection label="Department" icon="business" notices={groups.department} onCardClick={setSelected} accent="text-blue-400" user={user} onDelete={onDelete} />
          <GroupSection label="Class" icon="school" notices={groups.class} onCardClick={setSelected} accent="text-purple-400" user={user} onDelete={onDelete} />
          <GroupSection label="Batch" icon="groups" notices={groups.batch} onCardClick={setSelected} accent="text-emerald-400" user={user} onDelete={onDelete} />
          <ExpiredSection notices={expiredNotices} open={showExpired} onToggle={() => setShowExpired(o => !o)} onCardClick={setSelected} user={user} onDelete={onDelete} />
        </>
      )}
      {selected && <NoticeModal notice={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ─── Teacher / Admin Dashboard ────────────────────────────────────────────────

function TeacherDashboard({
  notices,
  user,
  onDelete,
}: {
  notices: Notice[];
  user?: { _id?: string; role?: string };
  onDelete?: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Notice | null>(null);
  const [search, setSearch] = useState("");
  const [filterSort, setFilterSort] = useState<"newest" | "oldest" | "expiry-soonest" | "expiry-latest">("newest");
  const [filterClass, setFilterClass] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [showExpired, setShowExpired] = useState(false);

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

    return result;
  }, [notices, search, filterClass, filterBranch, filterBatch]);

  const activeNotices = useMemo(() => {
    const active = filtered.filter(n => !isNoticeExpired(n));
    return [...active].sort((a, b) => {
      if (filterSort === "expiry-soonest") return getExpiryTime(a, "asc") - getExpiryTime(b, "asc");
      if (filterSort === "expiry-latest") return getExpiryTime(b, "desc") - getExpiryTime(a, "desc");
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return filterSort === "newest" ? tb - ta : ta - tb;
    });
  }, [filtered, filterSort]);

  const expiredNotices = useMemo(
    () => filtered
      .filter(n => isNoticeExpired(n))
      .sort((a, b) => new Date(b.expiryDate ?? 0).getTime() - new Date(a.expiryDate ?? 0).getTime()),
    [filtered]
  );

  const groups = groupNoticesForTeacher(activeNotices);
  const classKeys = Object.keys(groups.byClass).sort();

  const batchOptions = filterBranch ? BATCH_MAP[filterBranch] ?? [] : [];
  const selectClass = "px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm";

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} />

        <select
          value={filterSort}
          onChange={e => setFilterSort(e.target.value as typeof filterSort)}
          className={selectClass}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="expiry-soonest">Expiry: soonest first</option>
          <option value="expiry-latest">Expiry: latest first</option>
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
        <p className="text-xs text-slate-500 mb-4">
          {activeNotices.length + expiredNotices.length} notice{activeNotices.length + expiredNotices.length !== 1 ? "s" : ""} found
        </p>
      )}

      {activeNotices.length === 0 && expiredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Icon name="search_off" className="text-6xl mb-4" />
          <p className="text-lg font-medium">No notices match your filters.</p>
        </div>
      ) : (
        <>
          <GroupSection label="General" icon="public" notices={groups.general} onCardClick={setSelected} accent="text-violet-400" user={user} onDelete={onDelete} />

          {classKeys.map(cls => (
            <GroupSection
              key={cls}
              label={`Class ${cls}`}
              icon="school"
              notices={groups.byClass[cls]}
              onCardClick={setSelected}
              accent="text-purple-400"
              user={user}
              onDelete={onDelete}
            />
          ))}

          <GroupSection label="Batch Notices" icon="groups" notices={groups.batch} onCardClick={setSelected} accent="text-emerald-400" user={user} onDelete={onDelete} />
          <GroupSection label="Department" icon="business" notices={groups.department} onCardClick={setSelected} accent="text-blue-400" user={user} onDelete={onDelete} />
          <GroupSection label="Other" icon="article" notices={groups.other} onCardClick={setSelected} accent="text-slate-600" user={user} onDelete={onDelete} />
          <ExpiredSection notices={expiredNotices} open={showExpired} onToggle={() => setShowExpired(o => !o)} onCardClick={setSelected} user={user} onDelete={onDelete} />
        </>
      )}

      {selected && <NoticeModal notice={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { toggleTheme } = useTheme();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user") || "{}";
  const user = (() => { try { return JSON.parse(userStr); } catch { return {}; } })();
  const isTeacher = user?.role === "faculty";
  const isAdmin = user?.role === "admin";

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

  const handleDeleteNotice = async (id: string) => {
    try {
      await deleteNotice(id, token || "");
      setNotices(prev => prev.filter(n => n._id !== id));
    } catch {
      alert("Failed to delete notice. Please try again.");
    }
  };

  const roleLabel = isAdmin ? "Admin" : isTeacher ? "Faculty" : "Student";

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
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <AppNavbar
        onToggleTheme={toggleTheme}
        pageLabel={user?.name ? `${roleLabel} • ${user.name}` : roleLabel}
      />

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{dashboardTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{dashboardSubtitle}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500">
            <Icon name="refresh" className="text-4xl animate-spin mr-3" />
            <span className="text-lg">Loading notices…</span>
          </div>
        ) : (isTeacher || isAdmin) ? (
          <TeacherDashboard notices={notices} user={user} onDelete={handleDeleteNotice} />
        ) : (
          <StudentDashboard notices={notices} user={user} onDelete={handleDeleteNotice} />
        )}
      </main>
    </div>
  );
}
