// src/pages/CreateNotice.tsx
import { useState } from "react";
import axios from "axios";

export default function CreateNotice() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isAdmin = user.role === "admin";
  const isFaculty = user.role === "faculty";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [department, setDepartment] = useState(user.department || "");
  const [cls, setCls] = useState("");
  const [batch, setBatch] = useState("");

const create = async () => {
  try {
    const token = localStorage.getItem("token");

    const visibility: any = {};

    if (isFaculty) {
      visibility.role = "student";
      visibility.department = user.department;

      if (cls !== "") visibility.class = cls;
      if (batch !== "") visibility.batch = batch;
    }

    if (isAdmin) {
      if (!department) {
        // 🌍 Public notice
        visibility.role = "public";
      } else {
        visibility.role = "student";
        visibility.department = department;

        if (cls !== "") visibility.class = cls;
        if (batch !== "") visibility.batch = batch;
      }
    }

    await axios.post(
      "http://localhost:5000/notices",
      { title, content, visibility },
      { headers: { Authorization: token } }
    );

    alert("Notice created!");

    // Reset
    setTitle("");
    setContent("");
    setCls("");
    setBatch("");
    if (isAdmin) setDepartment("");

  } catch (err: any) {
    alert(err.response?.data?.msg || "Error creating notice");
  }
};

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Notice</h2>

      {/* Title */}
      <input
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      {/* Content */}
      <textarea
        placeholder="Content"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      {/* Department */}
      <h4>Department</h4>
      <select
        value={isFaculty ? user.department : department}
        onChange={e => setDepartment(e.target.value)}
        disabled={isFaculty}
      >
        <option value="">Select Department</option>
        <option value="CS">CS</option>
        <option value="IT">IT</option>
        <option value="ENTC">ENTC</option>
      </select>

      {/* Class */}
      <h4>Class (Optional)</h4>
      <select value={cls} onChange={e => setCls(e.target.value)}>
        <option value="">All Classes</option>
        <option value="FE">FE</option>
        <option value="SE">SE</option>
        <option value="TE">TE</option>
        <option value="BE">BE</option>
      </select>

      {/* Batch */}
      <h4>Batch (Optional)</h4>
      <select value={batch} onChange={e => setBatch(e.target.value)}>
        <option value="">All Batches</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>

      <br /><br />
      <button onClick={create}>Create</button>
    </div>
  );
}