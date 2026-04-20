// src/pages/CreateNotice.tsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

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
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isAdmin = user.role === "admin";
  const isFaculty = user.role === "faculty";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [department, setDepartment] = useState(isFaculty ? (user.department || "") : "");
  const [cls, setCls] = useState("");
  const [batch, setBatch] = useState("");
  const [isGeneral, setIsGeneral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let visibility: Record<string, string | boolean> = {};

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
        { title, content, visibility },
        { headers: { Authorization: token } }
      );

      setSuccess(true);
      setTitle("");
      setContent("");
      setCls("");
      setBatch("");
      setIsGeneral(false);
      if (isAdmin) setDepartment("");

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.msg || "Error creating notice");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            aria-label="Go back"
          >
            <Icon name="arrow_back" />
          </button>
          <div className="flex items-center gap-2">
            <Icon name="edit_note" className="text-xl text-violet-400" />
            <span className="text-lg font-bold text-white">Create Notice</span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          aria-label="Toggle theme"
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
        </button>
      </header>

      {/* Form */}
      <div className="flex justify-center p-6">
        <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">

          {/* Success Banner */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-700 text-emerald-300 rounded-xl px-4 py-3 text-sm font-medium">
              <Icon name="check_circle" className="text-lg" />
              Notice published successfully!
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Icon name="campaign" className="text-violet-400" /> New Notice
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Fill in the details below to publish a notice.
            </p>
          </div>

          {/* Admin: General Notice Toggle */}
          {isAdmin && (
            <button
              type="button"
              className={`flex items-center gap-4 w-full p-4 rounded-xl border cursor-pointer transition text-left ${
                isGeneral
                  ? "bg-violet-900/30 border-violet-700"
                  : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
              }`}
              onClick={toggleGeneral}
              role="switch"
              aria-checked={isGeneral}
            >
              {/* Toggle switch */}
              <div
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  isGeneral ? "bg-violet-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    isGeneral ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1">
                  <Icon name="public" className="text-violet-400 text-base" />
                  General Notice
                  <span className="ml-1 text-xs font-normal text-gray-400">(for everyone)</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Admin only. When enabled, all targeting fields are disabled. Payload: visibility &#123; general: true &#125;
                </p>
              </div>
            </button>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Title <span className="text-gray-600 font-normal">(optional)</span>
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
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Write your notice here…"
              value={content}
              onChange={e => setContent(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Targeting Fields */}
          <div className={`space-y-4 border-t border-gray-800 pt-4 transition-opacity duration-200 ${isGeneral ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-1">
              <Icon name="filter_alt" className="text-sm" /> Audience Targeting
            </p>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Department
                {isFaculty && (
                  <span className="ml-2 text-xs text-gray-500">(auto-filled)</span>
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Class <span className="text-gray-600 font-normal">(optional)</span>
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Batch <span className="text-gray-600 font-normal">(optional)</span>
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
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/40"
          >
            <Icon name={loading ? "refresh" : "send"} className={loading ? "animate-spin" : ""} />
            {loading ? "Publishing…" : "Publish Notice"}
          </button>

        </div>
      </div>
    </div>
  );
}
