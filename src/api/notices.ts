// src/api/notices.ts
import axios from "axios";

const API = "http://localhost:5000";

export const getNotices = (token?: string) =>
  axios.get(`${API}/notices`, {
    headers: { Authorization: token || "" }
  });