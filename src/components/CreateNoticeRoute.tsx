import { Navigate } from "react-router-dom";

export default function CreateNoticeRoute({ children }: any) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user || !["admin", "faculty"].includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}