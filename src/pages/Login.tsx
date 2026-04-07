// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
  try {
    const res = await fetch("http://localhost:5000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.msg || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    navigate("/dashboard");
  } catch (err: any) {
    console.error(err.message);
    alert(err.message);
  }
};

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input
        placeholder="Password"
        type="password"
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={login}>Login</button>
    </div>
  );
}