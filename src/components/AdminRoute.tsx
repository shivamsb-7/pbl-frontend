// src/components/AdminRoute.tsx
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }: any) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user || user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}