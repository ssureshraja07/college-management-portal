import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("teacher");
  const [id, setId] = useState("");
  const [dob, setDob] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!id || !dob) {
      setMessage("Please fill in all fields");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const endpoint =
        role === "teacher"
          ? "http://127.0.0.1:8000/login"
          : "http://127.0.0.1:8000/student/login";

      const payload =
        role === "teacher"
          ? { teacher_id: id, dob }
          : { student_id: id, dob };

      const res = await axios.post(endpoint, payload);

      if (res.data.success) {
        // Save to localStorage
        localStorage.setItem("role", role);
        localStorage.setItem(
          "user",
          JSON.stringify(role === "teacher" ? res.data.teacher : res.data.student)
        );
        navigate(role === "teacher" ? "/teacher" : "/student");
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || "Invalid ID or Date of Birth");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="college-icon">🎓</div>
          <h1>Kamaraj College</h1>
          <p>Academic Portal</p>
        </div>

        <div className="role-toggle">
          <button
            className={role === "teacher" ? "role-btn active" : "role-btn"}
            onClick={() => { setRole("teacher"); setMessage(""); setId(""); setDob(""); }}
          >
            👨‍🏫 Teacher
          </button>
          <button
            className={role === "student" ? "role-btn active" : "role-btn"}
            onClick={() => { setRole("student"); setMessage(""); setId(""); setDob(""); }}
          >
            👨‍🎓 Student
          </button>
        </div>

        <div className="input-group">
          <label>{role === "teacher" ? "Teacher ID" : "Student ID"}</label>
          <input
            type="text"
            placeholder={role === "teacher" ? "Enter Teacher ID" : "Enter Student ID"}
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        <button className="login-submit" onClick={handleLogin} disabled={loading}>
          {loading ? <span className="spinner" /> : "Login →"}
        </button>

        {message && <p className="login-msg error">{message}</p>}
      </div>
    </div>
  );
}