import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const API = "http://127.0.0.1:8000";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem("user") || "{}");
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.student_id) { navigate("/"); return; }
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const res = await axios.get(`${API}/marks/${student.student_id}`);
      setMarks(res.data.marks);
    } finally { setLoading(false); }
  };

  const total = marks.reduce((a, m) => a + m.marks, 0);
  const avg = marks.length ? (total / marks.length).toFixed(1) : 0;
  const grade = avg >= 90 ? "A+" : avg >= 80 ? "A" : avg >= 70 ? "B" : avg >= 60 ? "C" : "D";

  const logout = () => { localStorage.clear(); navigate("/"); };

  return (
    <div className="dash-root">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">🎓 KamarajPortal</div>
          <div className="teacher-info">
            <div className="avatar" style={{background:"linear-gradient(135deg,#ff6584,#ff8c69)"}}>{student.name?.[0]}</div>
            <div>
              <div className="t-name">{student.name}</div>
              <div className="t-dept">{student.department}</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active"><span>📊</span> My Marks</button>
        </nav>
        <button className="logout-btn" onClick={logout}>🚪 Logout</button>
      </aside>

      <main className="dash-main">
        <div className="section">
          <div className="section-header ">
            <h2>My Academic Report</h2>
            <span className="badge">{student.student_id}</span>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{avg}</div>
              <div className="stat-label">Average Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value grade">{grade}</div>
              <div className="stat-label">Overall Grade</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{marks.length}</div>
              <div className="stat-label">Subjects</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{total}</div>
              <div className="stat-label">Total Marks</div>
            </div>
          </div>

          {loading ? (
            <div style={{textAlign:"center", padding:"48px", color:"#8888aa"}}>Loading...</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Subject</th><th>Marks</th><th>Out of</th><th>Grade</th><th>Performance</th></tr>
                </thead>
                <tbody>
                  {marks.map((m, i) => {
                    const g = m.marks >= 90 ? "A+" : m.marks >= 80 ? "A" : m.marks >= 70 ? "B" : m.marks >= 60 ? "C" : "D";
                    const pct = m.marks;
                    return (
                      <tr key={i}>
                        <td ><strong >{m.subject}</strong></td>
                        <td><span className="score">{m.marks}</span></td>
                        <td style={{color:"#8888aa"}}>100</td>
                        <td><span className={`grade-chip grade-${g.replace("+","plus")}`}>{g}</span></td>
                        <td>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{width:`${pct}%`, background: pct >= 75 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171"}} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {marks.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign:"center", color:"#8888aa", padding:"32px"}}>No marks added yet by your teacher.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}