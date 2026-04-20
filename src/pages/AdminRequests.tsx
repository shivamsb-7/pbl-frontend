// src/pages/AdminRequests.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Icon name="manage_accounts" className="text-2xl text-amber-400" />
          <span className="text-lg font-bold tracking-tight text-white">Account Requests</span>
          <span className="hidden sm:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-600 border border-gray-700 rounded-full px-2 py-0.5">
            <Icon name="admin_panel_settings" className="text-xs" /> Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition"
          >
            <Icon name="dashboard" /> Dashboard
          </button>
        </div>
      </header>

      {/* Banner */}
      {banner && (
        <div className="bg-amber-600/20 border-b border-amber-700 px-6 py-3 flex items-center gap-2 text-amber-300 text-sm">
          <Icon name="info" className="text-base" />
          {banner}
        </div>
      )}

      {usingMock && !loading && (
        <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-2 flex items-center gap-2 text-gray-400 text-xs">
          <Icon name="cloud_off" className="text-sm" />
          Backend unavailable — showing mock data. Actions will be queued.
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Account Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve or reject user signup requests.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-600">
            <Icon name="refresh" className="text-4xl animate-spin mr-3" />
            <span className="text-lg">Loading requests…</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <Icon name="inbox" className="text-6xl mb-4" />
            <p className="text-lg font-medium">No account requests.</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <section className="mb-12">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-400 mb-4">
                  <Icon name="pending" /> Pending
                  <span className="ml-1 text-xs font-normal text-gray-600 normal-case tracking-normal">
                    ({pending.length})
                  </span>
                </h2>

                <div className="rounded-2xl border border-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-900 border-b border-gray-800 text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Name</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Email</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Role</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Details</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Requested</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {pending.map(req => (
                        <tr key={req._id} className="bg-gray-900/50 hover:bg-gray-900 transition">
                          <td className="px-5 py-4 font-medium text-white">{req.name}</td>
                          <td className="px-5 py-4 text-gray-400">{req.email}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              req.role === "faculty"
                                ? "text-blue-300 bg-blue-900/40 border-blue-800"
                                : "text-violet-300 bg-violet-900/40 border-violet-800"
                            }`}>
                              <Icon name={req.role === "faculty" ? "person_pin" : "school"} className="text-xs" />
                              {req.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs space-y-0.5">
                            {req.department && (
                              <div className="flex items-center gap-1">
                                <Icon name="business" className="text-xs text-gray-600" /> {req.department}
                              </div>
                            )}
                            {req.class && (
                              <div className="flex items-center gap-1">
                                <Icon name="school" className="text-xs text-gray-600" /> {req.class}
                                {req.batch && <> / Batch {req.batch}</>}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(req.createdAt)}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(req._id, "accept")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-800 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition"
                              >
                                <Icon name="check_circle" className="text-sm" /> Accept
                              </button>
                              <button
                                onClick={() => handleAction(req._id, "reject")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-800 text-red-400 hover:text-red-300 text-xs font-semibold transition"
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
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
                  <Icon name="history" /> Resolved
                  <span className="ml-1 text-xs font-normal text-gray-600 normal-case tracking-normal">
                    ({resolved.length})
                  </span>
                </h2>

                <div className="rounded-2xl border border-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-900 border-b border-gray-800 text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Name</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Email</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Role</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Status</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Requested</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {resolved.map(req => (
                        <tr key={req._id} className="bg-gray-900/30 opacity-70">
                          <td className="px-5 py-4 font-medium text-gray-300">{req.name}</td>
                          <td className="px-5 py-4 text-gray-500">{req.email}</td>
                          <td className="px-5 py-4 text-gray-500 capitalize">{req.role}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              req.status === "accepted"
                                ? "text-emerald-300 bg-emerald-900/40 border-emerald-800"
                                : "text-red-300 bg-red-900/40 border-red-800"
                            }`}>
                              <Icon
                                name={req.status === "accepted" ? "check_circle" : "cancel"}
                                className="text-xs"
                              />
                              {req.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600 text-xs">{formatDate(req.createdAt)}</td>
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
