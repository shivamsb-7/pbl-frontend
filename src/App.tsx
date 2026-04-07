// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Notices from "./pages/Notices";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateNotice from "./pages/CreateNotice";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Signup from "./pages/Signup";
import CreateNoticeRoute from "./components/CreateNoticeRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Notices />} />
        <Route path="/login" element={<Login />} />

        {/* Logged-in users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/create"
          element={
            <CreateNoticeRoute>
              <CreateNotice />
            </CreateNoticeRoute>
          }
        />
        {/* Admin only */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;