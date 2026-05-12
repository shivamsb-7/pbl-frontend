// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateNotice from "./pages/CreateNotice";
import Signup from "./pages/Signup";
import AdminRequests from "./pages/AdminRequests";
import CreateNoticeRoute from "./components/CreateNoticeRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Logged-in users */}
        <Route
          path="/dashboard"
          element={
            /*<ProtectedRoute>*/
              <Dashboard />
           /* </ProtectedRoute>*/
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
        <Route
          path="/add-notice"
          element={
            <CreateNoticeRoute>
              <CreateNotice />
            </CreateNoticeRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin/requests"
          element={
            <AdminRoute>
              <AdminRequests />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;