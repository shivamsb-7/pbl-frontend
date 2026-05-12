// src/pages/Home.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getNotices } from "../api/notices";
import ReactMarkdown from "react-markdown";
import type { Components as MarkdownComponents } from "react-markdown";
import { type Notice, formatDate, dummyNotices, isGeneralNotice, isNoticeExpired, stripMarkdown } from "../utils/noticeUtils";
import AppNavbar from "../components/AppNavbar";

// Icon helper
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1"
          aria-label="Close"
        >
          <Icon name="close" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-700 flex items-center gap-1">
            <Icon name="public" className="text-sm" /> General
          </span>
        </div>

        <h2 id="modal-title" className="text-xl font-bold text-slate-900 mb-1 pr-8">{title}</h2>

        {notice.createdAt && (
          <p className="text-xs text-slate-500 mb-4">{formatDate(notice.createdAt)}</p>
        )}

        <div className="text-slate-700 leading-relaxed text-sm space-y-1">
          <ReactMarkdown components={mdComponents}>{notice.content}</ReactMarkdown>
        </div>
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
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-slate-200">
        <div
          className="h-full bg-violet-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Icon name="public" className="text-lg text-violet-600" />
          <span className="text-sm font-semibold tracking-widest uppercase text-slate-600">General Notices</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="text-sm tabular-nums">{idx + 1} / {notices.length}</span>
          <button
            onClick={onExit}
            className="p-2 rounded-lg hover:bg-slate-200 transition text-slate-500 hover:text-slate-900 flex items-center gap-1 text-sm"
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
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 text-center leading-tight mb-8 max-w-5xl">
              {title}
            </h1>
            <div className="text-lg md:text-2xl text-slate-700 text-center leading-relaxed max-w-4xl [&_p]:mb-4">
              <ReactMarkdown components={mdComponents}>{notice.summary}</ReactMarkdown>
            </div>
            {notice.createdAt && (
              <p className="mt-8 text-sm text-slate-500">{formatDate(notice.createdAt)}</p>
            )}
          </>
        ) : (
          <p className="text-2xl text-slate-500">No general notices available</p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex justify-center items-center gap-6 px-8 py-6">
        <button
          onClick={prev}
          disabled={notices.length <= 1}
          className="p-3 rounded-full bg-white border border-slate-200 hover:bg-slate-100 transition text-slate-600 hover:text-slate-900 disabled:opacity-30 flex items-center justify-center"
          aria-label="Previous notice"
        >
          <Icon name="arrow_back" className="text-2xl" />
        </button>

        <button
          onClick={() => setPaused(p => !p)}
          className="p-4 rounded-full bg-violet-600 hover:bg-violet-500 transition text-white flex items-center justify-center shadow-lg shadow-violet-400/40"
          aria-label={paused ? "Play" : "Pause"}
        >
          <Icon name={paused ? "play_arrow" : "pause"} className="text-3xl" />
        </button>

        <button
          onClick={next}
          disabled={notices.length <= 1}
          className="p-3 rounded-full bg-white border border-slate-200 hover:bg-slate-100 transition text-slate-600 hover:text-slate-900 disabled:opacity-30 flex items-center justify-center"
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
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-violet-500 w-6" : "bg-slate-300 hover:bg-slate-400"}`}
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
  const plain = stripMarkdown(notice.content);
  const preview = plain.length > 140 ? plain.slice(0, 140) + "…" : plain;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-200/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 flex flex-col gap-3 min-h-52"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">
          <Icon name="public" className="text-sm" /> General
        </span>
        {notice.createdAt && (
          <span className="text-xs text-slate-500">{formatDate(notice.createdAt)}</span>
        )}
      </div>
      <p className="text-lg font-semibold text-slate-900 line-clamp-2 group-hover:text-violet-700 transition-colors leading-snug">
        {title}
      </p>
      <p className="text-sm text-slate-600 line-clamp-4 flex-1 leading-relaxed">{preview}</p>
    </button>
  );
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selected, setSelected] = useState<Notice | null>(null);
  const [tvMode, setTvMode] = useState(false);
  const { toggleTheme } = useTheme();

  const token = localStorage.getItem("token");

  useEffect(() => {
    getNotices(token || undefined)
      .then(res => {
        const all: Notice[] = res.data.length === 0 ? dummyNotices : res.data;
        // Show only active general notices on home page
        setNotices(all.filter(n => isGeneralNotice(n) && !isNoticeExpired(n)));
      })
      .catch(() => {
        setNotices(dummyNotices.filter(n => isGeneralNotice(n) && !isNoticeExpired(n)));
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300">

      <AppNavbar
        onToggleTheme={toggleTheme}
        pageLabel="Home"
        extraActions={notices.length > 0 ? (
          <button
            onClick={() => setTvMode(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition shadow-lg shadow-violet-400/40"
          >
            <Icon name="tv" /> TV Mode
          </button>
        ) : undefined}
      />

      {/* Hero */}
      <section className="px-6 pt-16 pb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
          <Icon name="public" className="text-sm" /> General Announcements
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          Stay Informed
        </h1>
        <p className="text-slate-600 text-lg">
          All general notices and announcements in one place.
          {token && " Visit your dashboard for personalized notices."}
        </p>
      </section>

      {/* Notices grid */}
       <main className="max-w-6xl mx-auto px-6 pb-16">
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Icon name="inbox" className="text-6xl mb-4" />
            <p className="text-lg font-medium">No general notices yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
