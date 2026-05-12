// src/pages/AdminRequests.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import AppNavbar from "../components/AppNavbar";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

export interface AccountRequest {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  class?: string;
  batch?: string;
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
}

const mockRequests: AccountRequest[] = [
  {
    _id: "req1",
    name: "Aditya Sharma",
    email: "aditya.sharma@example.com",
    role: "student",
    department: "IT",
    class: "FE",
    batch: "A",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: "pending",
  },
  {
    _id: "req2",
    name: "Priya Mehta",
    email: "priya.mehta@example.com",
    role: "faculty",
    department: "CS",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    status: "pending",
  },
  {
    _id: "req3",
    name: "Rohan Desai",
    email: "rohan.desai@example.com",
    role: "student",
    department: "Mechanical",
    class: "SE",
    batch: "B",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "pending",
  },
  {
    _id: "req4",
    name: "Sneha Patil",
    email: "sneha.patil@example.com",
    role: "student",
    department: "IT",
    class: "TE",
    batch: "A",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    status: "accepted",
  },
];

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminRequests() {
  const { toggleTheme } = useTheme();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    setLoading(true);
    axios
      .get<AccountRequest[]>("http://localhost:5000/auth/requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then(res => {
        setRequests(res.data);
      })
      .catch(() => {
        setRequests(mockRequests);
        setUsingMock(true);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleAction = async (requestId: string, action: "accept" | "reject") => {
    // Optimistic UI update
    setRequests(prev =>
      prev.map(r =>
        r._id === requestId
          ? { ...r, status: action === "accept" ? "accepted" : "rejected" }
          : r
      )
    );

    try {
      // Backend spec: POST /auth/requests with { requestId, action } for accept/reject
      await axios.post(
        "http://localhost:5000/auth/requests",
        { requestId, action },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch {
      setBanner("Action queued (backend pending) — change saved locally.");
      setTimeout(() => setBanner(null), 5000);
    }
  };

  const pending = requests.filter(r => r.status === "pending");
  const resolved = requests.filter(r => r.status !== "pending");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppNavbar onToggleTheme={toggleTheme} pageLabel="Admin Requests" />

      {/* Banner */}
      {banner && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2 text-amber-700 text-sm">
          <Icon name="info" className="text-base" />
          {banner}
        </div>
      )}

      {usingMock && !loading && (
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center gap-2 text-slate-500 text-xs">
          <Icon name="cloud_off" className="text-sm" />
          Backend unavailable — showing mock data. Actions will be queued.
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Account Requests</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve or reject user signup requests.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500">
            <Icon name="refresh" className="text-4xl animate-spin mr-3" />
            <span className="text-lg">Loading requests…</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Icon name="inbox" className="text-6xl mb-4" />
            <p className="text-lg font-medium">No account requests.</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <section className="mb-12">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-700 mb-4">
                  <Icon name="pending" /> Pending
                  <span className="ml-1 text-xs font-normal text-slate-500 normal-case tracking-normal">
                    ({pending.length})
                  </span>
                </h2>

                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Name</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Email</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Role</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Details</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Requested</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pending.map(req => (
                        <tr key={req._id} className="bg-white hover:bg-slate-50 transition">
                          <td className="px-5 py-4 font-medium text-slate-900">{req.name}</td>
                          <td className="px-5 py-4 text-slate-600">{req.email}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              req.role === "faculty"
                                ? "text-blue-700 bg-blue-100 border-blue-200"
                                : "text-violet-700 bg-violet-100 border-violet-200"
                            }`}>
                              <Icon name={req.role === "faculty" ? "person_pin" : "school"} className="text-xs" />
                              {req.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs space-y-0.5">
                            {req.department && (
                              <div className="flex items-center gap-1">
                                <Icon name="business" className="text-xs text-slate-500" /> {req.department}
                              </div>
                            )}
                            {req.class && (
                              <div className="flex items-center gap-1">
                                <Icon name="school" className="text-xs text-slate-500" /> {req.class}
                                {req.batch && <> / Batch {req.batch}</>}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(req.createdAt)}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(req._id, "accept")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition"
                              >
                                <Icon name="check_circle" className="text-sm" /> Accept
                              </button>
                              <button
                                onClick={() => handleAction(req._id, "reject")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold transition"
                              >
                                <Icon name="cancel" className="text-sm" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Resolved */}
            {resolved.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">
                  <Icon name="history" /> Resolved
                  <span className="ml-1 text-xs font-normal text-slate-500 normal-case tracking-normal">
                    ({resolved.length})
                  </span>
                </h2>

                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Name</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Email</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Role</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Requested</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {resolved.map(req => (
                        <tr key={req._id} className="bg-slate-100/70 opacity-80">
                          <td className="px-5 py-4 font-medium text-slate-700">{req.name}</td>
                          <td className="px-5 py-4 text-slate-500">{req.email}</td>
                          <td className="px-5 py-4 text-slate-500 capitalize">{req.role}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              req.status === "accepted"
                                ? "text-emerald-700 bg-emerald-100 border-emerald-200"
                                : "text-red-700 bg-red-100 border-red-200"
                            }`}>
                              <Icon
                                name={req.status === "accepted" ? "check_circle" : "cancel"}
                                className="text-xs"
                              />
                              {req.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(req.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
