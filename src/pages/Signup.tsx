// src/pages/Signup.tsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const BRANCHES = ["CE", "ENTC", "IT", "AI/DS", "ECE"] as const;
const CLASSES = ["FE", "SE", "TE", "BE"] as const;
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

export default function Signup() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const batchOptions = form.department ? BATCH_MAP[form.department] ?? [] : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dept = e.target.value;
    const validBatches = BATCH_MAP[dept] ?? [];
    setForm(prev => {
      const currentBatch = prev.batch ?? "";
      return {
        ...prev,
        department: dept,
        batch: validBatches.includes(currentBatch) ? currentBatch : "",
      };
    });
  };

  const signup = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/auth/signup", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Best-effort: submit an account request so admins can review new signups.
      // Non-blocking — continue regardless of whether this call succeeds.
      try {
        await axios.post("http://localhost:5000/auth/requests", {
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department,
          class: form.class,
          batch: form.batch,
        });
      } catch {
        console.warn("Account request could not be submitted to backend (continuing anyway).");
      }

      navigate("/dashboard");
    } catch (err: any) {
      alert(err.response?.data?.msg || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 py-10">

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
        aria-label="Toggle theme"
      >
        <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
      </button>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-700 mb-4">
            <Icon name="person_add" className="text-3xl text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="text-gray-500 mt-1">Join the notices portal</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4 shadow-2xl">

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input name="name" placeholder="John Doe" className={inputClass} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input name="email" type="email" placeholder="you@example.com" className={inputClass} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input name="password" type="password" placeholder="••••••••" className={inputClass} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <select name="role" className={inputClass} onChange={handleChange}>
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
            <select name="department" className={inputClass} value={form.department ?? ""} onChange={handleDepartmentChange}>
              <option value="">Select department</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Class <span className="text-gray-600 font-normal">(student)</span>
              </label>
              <select name="class" className={inputClass} value={form.class ?? ""} onChange={handleChange}>
                <option value="">Select class</option>
                {CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Batch <span className="text-gray-600 font-normal">(student)</span>
              </label>
              <select name="batch" className={inputClass} value={form.batch ?? ""} onChange={handleChange} disabled={!form.department}>
                <option value="">Select batch</option>
                {batchOptions.map(b => (
                  <option key={b} value={b}>Batch {b}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={signup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-semibold transition duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/40 mt-2"
          >
            <Icon name={loading ? "refresh" : "how_to_reg"} className={loading ? "animate-spin" : ""} />
            {loading ? "Creating account…" : "Create account"}
          </button>

        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-violet-400 hover:text-violet-300 font-medium transition"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
