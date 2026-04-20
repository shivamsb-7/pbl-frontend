// src/pages/Home.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getNotices } from "../api/notices";
import { type Notice, formatDate, dummyNotices, isGeneralNotice } from "../utils/noticeUtils";

// Icon helper
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

// Modal for notice detail
function NoticeModal({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const title = notice.title?.trim() || "Untitled";

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
      aria-labelledby="modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1"
          aria-label="Close"
        >
          <Icon name="close" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400 flex items-center gap-1">
            <Icon name="public" className="text-sm" /> General
          </span>
        </div>

        <h2 id="modal-title" className="text-xl font-bold text-white mb-1 pr-8">{title}</h2>

        {notice.createdAt && (
          <p className="text-xs text-gray-500 mb-4">{formatDate(notice.createdAt)}</p>
        )}

        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{notice.content}</p>
      </div>
    </div>
  );
}

// TV Mode — fullscreen cycling view
function TvMode({ notices, onExit }: { notices: Notice[]; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setIdx(i => (i + 1) % Math.max(notices.length, 1)), [notices.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + Math.max(notices.length, 1)) % Math.max(notices.length, 1)), [notices.length]);

  // Auto-advance every 8 seconds when not paused
  useEffect(() => {
    if (paused || notices.length <= 1) return;
    intervalRef.current = setInterval(next, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, next, notices.length]);

  // Request fullscreen on mount
  useEffect(() => {
    const el = containerRef.current;
    if (el && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Exit on ESC (browser fullscreen already handles this; also exit TV mode)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") { e.preventDefault(); setPaused(p => !p); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev, onExit]);

  const notice = notices[idx];
  const title = notice?.title?.trim() || "Notice";
  const progress = notices.length > 0 ? ((idx + 1) / notices.length) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-800">
        <div
          className="h-full bg-violet-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Icon name="public" className="text-lg text-violet-500" />
          <span className="text-sm font-semibold tracking-widest uppercase text-gray-400">General Notices</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <span className="text-sm tabular-nums">{idx + 1} / {notices.length}</span>
          <button
            onClick={onExit}
            className="p-2 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white flex items-center gap-1 text-sm"
            aria-label="Exit TV mode"
          >
            <Icon name="fullscreen_exit" /> Exit
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 md:px-24 lg:px-40">
        {notice ? (
          <>
            <div className="mb-6 flex items-center gap-2 text-violet-400">
              <Icon name="campaign" className="text-3xl" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center leading-tight mb-8 max-w-5xl">
              {title}
            </h1>
            <p className="text-lg md:text-2xl text-gray-300 text-center leading-relaxed max-w-4xl">
              {notice.content}
            </p>
            {notice.createdAt && (
              <p className="mt-8 text-sm text-gray-600">{formatDate(notice.createdAt)}</p>
            )}
          </>
        ) : (
          <p className="text-2xl text-gray-500">No general notices available</p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex justify-center items-center gap-6 px-8 py-6">
        <button
          onClick={prev}
          disabled={notices.length <= 1}
          className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition text-gray-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
          aria-label="Previous notice"
        >
          <Icon name="arrow_back" className="text-2xl" />
        </button>

        <button
          onClick={() => setPaused(p => !p)}
          className="p-4 rounded-full bg-violet-600 hover:bg-violet-500 transition text-white flex items-center justify-center shadow-lg shadow-violet-900/50"
          aria-label={paused ? "Play" : "Pause"}
        >
          <Icon name={paused ? "play_arrow" : "pause"} className="text-3xl" />
        </button>

        <button
          onClick={next}
          disabled={notices.length <= 1}
          className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition text-gray-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
          aria-label="Next notice"
        >
          <Icon name="arrow_forward" className="text-2xl" />
        </button>
      </div>

      {/* Dot indicators */}
      {notices.length > 1 && (
        <div className="flex justify-center gap-2 pb-6">
          {notices.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-violet-400 w-6" : "bg-gray-700 hover:bg-gray-500"}`}
              aria-label={`Go to notice ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Notice card for home page grid
function NoticeCard({ notice, onClick }: { notice: Notice; onClick: () => void }) {
  const title = notice.title?.trim() || "Untitled";
  const preview = notice.content.length > 100 ? notice.content.slice(0, 100) + "…" : notice.content;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-gray-900 dark:bg-gray-900 border border-gray-800 dark:border-gray-700 rounded-2xl p-5 hover:border-violet-600 hover:bg-gray-800 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 flex flex-col gap-3 h-48"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-violet-400 flex items-center gap-1">
          <Icon name="public" className="text-sm" /> General
        </span>
        {notice.createdAt && (
          <span className="text-xs text-gray-600">{formatDate(notice.createdAt)}</span>
        )}
      </div>
      <p className="text-base font-semibold text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
        {title}
      </p>
      <p className="text-sm text-gray-400 line-clamp-3 flex-1">{preview}</p>
    </button>
  );
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selected, setSelected] = useState<Notice | null>(null);
  const [tvMode, setTvMode] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const canCreateNotice = ["admin", "faculty"].includes(user?.role);

  useEffect(() => {
    getNotices(token || undefined)
      .then(res => {
        const all: Notice[] = res.data.length === 0 ? dummyNotices : res.data;
        // Only show general notices on home page (role === "general")
        console.log(all)
        setNotices(all.filter(n => n.visibility?.role === "general"));
      })
      .catch(() => {
        setNotices(dummyNotices.filter(n => isGeneralNotice(n)));
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-950 dark:bg-gray-950 text-white transition-colors duration-300">

      {/* Navbar */}
      <header className="bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Icon name="campaign" className="text-2xl text-violet-400" />
          <span className="text-lg font-bold tracking-tight text-white">Notices</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            aria-label="Toggle theme"
          >
            <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
          </button>

          {/* TV Mode */}
          {notices.length > 0 && (
            <button
              onClick={() => setTvMode(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition shadow-lg shadow-violet-900/40"
            >
              <Icon name="tv" /> TV Mode
            </button>
          )}

          {!token && (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition"
              >
                Register
              </button>
            </>
          )}

          {token && (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition"
              >
                <Icon name="dashboard" /> Dashboard
              </button>
              {canCreateNotice && (
                <button
                  onClick={() => navigate("/add-notice")}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition"
                >
                  <Icon name="add" /> Add Notice
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-900/30 border border-violet-800 text-violet-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
          <Icon name="public" className="text-sm" /> General Announcements
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
          Stay Informed
        </h1>
        <p className="text-gray-400 text-lg">
          All general notices and announcements in one place.
          {token && " Visit your dashboard for personalized notices."}
        </p>
      </section>

      {/* Notices grid */}
      <main className="max-w-6xl mx-auto px-6 pb-16">
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <Icon name="inbox" className="text-6xl mb-4" />
            <p className="text-lg font-medium">No general notices yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notices.map(n => (
              <NoticeCard key={n._id} notice={n} onClick={() => setSelected(n)} />
            ))}
          </div>
        )}
      </main>

      {/* Notice modal */}
      {selected && <NoticeModal notice={selected} onClose={() => setSelected(null)} />}

      {/* TV Mode overlay */}
      {tvMode && <TvMode notices={notices} onExit={() => setTvMode(false)} />}
    </div>
  );
}
