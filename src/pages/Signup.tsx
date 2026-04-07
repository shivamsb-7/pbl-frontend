// src/pages/Signup.tsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState<any>({});
  const navigate = useNavigate();

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const signup = async () => {
    const res = await axios.post("http://localhost:5000/auth/signup", form);

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    navigate("/dashboard");
  };

  return (
    <div>
      <h2>Signup</h2>

      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="password" type="password" onChange={handleChange} />

      <select name="role" onChange={handleChange}>
        <option value="">Select Role</option>
        <option value="student">Student</option>
        <option value="faculty">Faculty</option>
      </select>

      <input name="department" placeholder="Department" onChange={handleChange} />

      {/* Only for students */}
      <input name="class" placeholder="Class" onChange={handleChange} />
      <input name="batch" placeholder="Batch" onChange={handleChange} />

      <button onClick={signup}>Signup</button>
    </div>
  );
}