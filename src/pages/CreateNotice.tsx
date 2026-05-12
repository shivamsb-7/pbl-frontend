// src/pages/CreateNotice.tsx
import { useState } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import ReactMarkdown from "react-markdown";
import AppNavbar from "../components/AppNavbar";

const DEPARTMENTS = ["CE", "ENTC", "IT", "AI/DS", "ECE"];
const CLASSES = ["FE", "SE", "TE", "BE"];
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

export default function CreateNotice() {
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const { toggleTheme } = useTheme();

  const isAdmin = user.role === "admin";
  const isFaculty = user.role === "faculty";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [department, setDepartment] = useState(isFaculty ? (user.department || "") : "");
  const [cls, setCls] = useState("");
  const [batch, setBatch] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isGeneral, setIsGeneral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contentTab, setContentTab] = useState<"write" | "preview">("write");

  const batchOptions = department ? BATCH_MAP[department] ?? [] : [];

  const toggleGeneral = () => {
    setIsGeneral(v => {
      if (!v) {
        // Turning ON — clear all targeting fields
        setDepartment("");
        setCls("");
        setBatch("");
      }
      return !v;
    });
  };

  const create = async () => {
    if (!content.trim()) {
      alert("Please enter notice content.");
      return;
    }
    if (isAdmin && isGeneral && !expiryDate) {
      alert("Please select an expiry date for a general notice.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let visibility: Record<string, string | boolean> = {};
      const parsedExpiryDate = expiryDate ? new Date(expiryDate) : undefined;
      if (parsedExpiryDate && Number.isNaN(parsedExpiryDate.getTime())) {
        alert("Please provide a valid expiry date.");
        return;
      }
      const expiryDateIso = parsedExpiryDate?.toISOString();

      if (isAdmin && isGeneral) {
        // General notice for everyone — visibility: { general: true }
        visibility = { role: "general" };
      } else if (isFaculty) {
        visibility.role = "student";
        visibility.department = user.department;
        if (cls) visibility.class = cls;
        if (batch) visibility.batch = batch;
      } else if (isAdmin) {
        if (department) {
          visibility.role = "student";
          visibility.department = department;
          if (cls) visibility.class = cls;
          if (batch) visibility.batch = batch;
        }
        // If no department selected, leave visibility empty (targets all)
      }

      await axios.post(
        "http://localhost:5000/notices",
        { title, content, visibility, expiryDate: expiryDateIso },
        { headers: { Authorization: token } }
      );

      setSuccess(true);
      setTitle("");
      setContent("");
      setCls("");
      setBatch("");
      setExpiryDate("");
      setIsGeneral(false);
      if (isAdmin) setDepartment("");

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.msg || "Error creating notice"
        : "Error creating notice";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppNavbar onToggleTheme={toggleTheme} pageLabel="Create Notice" />

      {/* Form */}
      <div className="flex justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-8 space-y-6">

          {/* Success Banner */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium">
              <Icon name="check_circle" className="text-lg" />
              Notice published successfully!
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Icon name="campaign" className="text-violet-400" /> New Notice
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Fill in the details below to publish a notice.
            </p>
          </div>

          {/* Admin: General Notice Toggle */}
          {isAdmin && (
            <button
              type="button"
              className={`flex items-center gap-4 w-full p-4 rounded-xl border cursor-pointer transition text-left ${
                isGeneral
                  ? "bg-violet-100 border-violet-300"
                  : "bg-slate-50 border-slate-300 hover:border-slate-400"
              }`}
              onClick={toggleGeneral}
              role="switch"
              aria-checked={isGeneral}
            >
              {/* Toggle switch */}
              <div
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  isGeneral ? "bg-violet-600" : "bg-slate-400"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    isGeneral ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  <Icon name="public" className="text-violet-400 text-base" />
                  General Notice
                  <span className="ml-1 text-xs font-normal text-slate-500">(for everyone)</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin only. When enabled, all targeting fields are disabled. Payload: visibility &#123; general: true &#125;
                </p>
              </div>
            </button>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Notice title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Content <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setContentTab("write")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${contentTab === "write" ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900"}`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab("preview")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${contentTab === "preview" ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900"}`}
                >
                  Preview
                </button>
              </div>
            </div>
            {contentTab === "write" ? (
              <textarea
                rows={6}
                placeholder="Write your notice here… (supports **bold**, *italic*, # headings, - lists)"
                value={content}
                onChange={e => setContent(e.target.value)}
                className={`${inputClass} resize-none font-mono`}
              />
            ) : (
              <div className="min-h-36 w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 leading-relaxed text-sm [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-violet-700 [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-slate-100 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_a]:text-violet-700 [&_a]:underline [&_strong]:font-bold [&_em]:italic [&_p]:mb-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic">
                {content.trim() ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-slate-500 italic">Nothing to preview yet.</p>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Supports **bold**, *italic*, # headings, - lists, [links](url), and more.</p>
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Expiry Date {isAdmin && isGeneral ? <span className="text-red-600">*</span> : <span className="text-slate-500 font-normal">(optional)</span>}
            </label>
            <input
              type="datetime-local"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-slate-500 mt-1">After this date, the notice is marked as expired.</p>
          </div>

          {/* Targeting Fields */}
          <div className={`space-y-4 border-t border-slate-200 pt-4 transition-opacity duration-200 ${isGeneral ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1">
              <Icon name="filter_alt" className="text-sm" /> Audience Targeting
            </p>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Department
                {isFaculty && (
                  <span className="ml-2 text-xs text-slate-500">(auto-filled)</span>
                )}
              </label>
              <select
                value={isFaculty ? user.department : department}
                onChange={e => {
                  const dept = e.target.value;
                  setDepartment(dept);
                  const valid = dept ? BATCH_MAP[dept] ?? [] : [];
                  if (batch && !valid.includes(batch)) setBatch("");
                }}
                disabled={isFaculty || isGeneral}
                className={inputClass}
              >
                {isAdmin && <option value="">All Departments</option>}
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Class + Batch */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Class <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <select
                  value={cls}
                  onChange={e => setCls(e.target.value)}
                  disabled={isGeneral}
                  className={inputClass}
                >
                  <option value="">All Classes</option>
                  {CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Batch <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <select
                  value={batch}
                  onChange={e => setBatch(e.target.value)}
                  disabled={isGeneral || !department}
                  className={inputClass}
                >
                  <option value="">All Batches</option>
                  {batchOptions.map(b => (
                    <option key={b} value={b}>Batch {b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={create}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-400/40"
          >
            <Icon name={loading ? "refresh" : "send"} className={loading ? "animate-spin" : ""} />
            {loading ? "Publishing…" : "Publish Notice"}
          </button>

        </div>
      </div>
    </div>
  );
}
