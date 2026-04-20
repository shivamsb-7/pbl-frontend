// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
        aria-label="Toggle theme"
      >
        <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
      </button>

      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-700 mb-4">
            <Icon name="campaign" className="text-3xl text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5 shadow-2xl">

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") login(); }}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") login(); }}
              className={inputClass}
            />
          </div>

          <button
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-semibold transition duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/40"
          >
            <Icon name={loading ? "refresh" : "login"} className={loading ? "animate-spin" : ""} />
            {loading ? "Signing in…" : "Sign in"}
          </button>

        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-violet-400 hover:text-violet-300 font-medium transition"
          >
            Sign up
          </button>
        </p>

        <p className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-gray-600 hover:text-gray-400 transition flex items-center gap-1 mx-auto"
          >
            <Icon name="arrow_back" className="text-sm" /> Back to notices
          </button>
        </p>
      </div>
    </div>
  );
}
