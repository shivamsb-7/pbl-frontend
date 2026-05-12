import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

interface AppNavbarProps {
  onToggleTheme: () => void;
  pageLabel?: string;
  extraActions?: ReactNode;
}

export default function AppNavbar({ onToggleTheme, pageLabel, extraActions }: AppNavbarProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();

  const isLoggedIn = Boolean(token);
  const isAdmin = user?.role === "admin";
  const canCreateNotice = ["admin", "faculty"].includes(user?.role);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const navBtn = "flex items-center gap-1 px-3 py-2 rounded-xl  hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <header className="backdrop-blur border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Icon name="campaign" className="text-2xl text-violet-600" />
        <span className="text-lg font-bold tracking-tight text-slate-900">Notices</span>
        {pageLabel && (
          <span className="hidden sm:inline text-sm text-slate-500">— {pageLabel}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-200 transition focus:outline-none focus:ring-2 focus:ring-violet-500"
          aria-label="Toggle theme"
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
        </button>

        {extraActions}

        <button onClick={() => navigate("/")} className={navBtn}>
          <Icon name="home" /> Home
        </button>

        {isLoggedIn ? (
          <>
            <button onClick={() => navigate("/dashboard")} className={navBtn}>
              <Icon name="dashboard" /> Dashboard
            </button>

            {canCreateNotice && (
              <button onClick={() => navigate("/add-notice")} className={navBtn}>
                <Icon name="add" /> Create Notice
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => navigate("/admin/requests")}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <Icon name="manage_accounts" /> Requests
              </button>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <Icon name="logout" /> Logout
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/login")} className={navBtn}>
              <Icon name="login" /> Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <Icon name="person_add" /> Register
            </button>
          </>
        )}
      </div>
    </header>
  );
}
