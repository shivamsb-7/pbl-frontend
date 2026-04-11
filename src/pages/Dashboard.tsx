// src/pages/Dashboard.tsx
import Notices from "./Notices";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-100 to-pink-100">
      
      {/* Navbar */}
      <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">
          Dashboard
        </h1>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6 flex justify-center">
        
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6">
          
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            📢 Latest Notices
          </h2>

          <div className="bg-gray-50 p-4 rounded-xl border">
            <Notices />
          </div>

        </div>

      </div>
    </div>
  );
}