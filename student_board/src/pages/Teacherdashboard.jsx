import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const API = "http://127.0.0.1:8000";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const teacher = JSON.parse(localStorage.getItem("user") || "{}");

  const [tab, setTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Add Student Form
  const [form, setForm] = useState({ student_id: "", name: "", dob: "", department: "" });

  // Edit Student
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", dob: "", department: "" });

  // Marks
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [marks, setMarks] = useState({});
  const [studentMarks, setStudentMarks] = useState([]);

  useEffect(() => {
    if (!teacher?.teacher_id) { navigate("/"); return; }
    fetchStudents();
    fetchSubjects();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStudents = async () => {
    const res = await axios.get(`${API}/students`);
    setStudents(res.data.students);
  };

  const fetchSubjects = async () => {
    const res = await axios.get(`${API}/subjects`);
    setSubjects(res.data.subjects);
  };

  const fetchMarks = async (student_id) => {
    const res = await axios.get(`${API}/marks/${student_id}`);
    setStudentMarks(res.data.marks);
    const m = {};
    res.data.marks.forEach(mk => {
      const sub = subjects.find(s => s.name === mk.subject);
      if (sub) m[sub.id] = mk.marks;
    });
    setMarks(m);
  };

  const handleAddStudent = async () => {
    if (!form.student_id || !form.name || !form.dob || !form.department) {
      showToast("Fill all fields!", "error"); return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/students`, { ...form, teacher_id: teacher.teacher_id });
      showToast("Student added successfully!");
      setForm({ student_id: "", name: "", dob: "", department: "" });
      fetchStudents();
    } catch (e) {
      showToast(e.response?.data?.detail || "Error adding student", "error");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this student?")) return;
    await axios.delete(`${API}/students/${id}`);
    showToast("Student deleted!");
    fetchStudents();
  };

  const handleUpdate = async (id) => {
    await axios.put(`${API}/students/${id}`, editForm);
    showToast("Student updated!");
    setEditId(null);
    fetchStudents();
  };

  const handleSaveMarks = async () => {
    for (const [subject_id, mark] of Object.entries(marks)) {
      await axios.post(`${API}/marks`, {
        student_id: selectedStudent.student_id,
        subject_id: parseInt(subject_id),
        marks: parseInt(mark)
      });
    }
    showToast("Marks saved successfully!");
    setSelectedStudent(null);
  };

  const openMarks = (student) => {
    setSelectedStudent(student);
    setMarks({});
    fetchMarks(student.student_id);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">🎓 KamarajPortal</div>
          <div className="teacher-info">
            <div className="avatar">{teacher.name?.[0]}</div>
            <div>
              <div className="t-name">{teacher.name}</div>
              <div className="t-dept">{teacher.department}</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={tab === "students" ? "nav-item active" : "nav-item"} onClick={() => setTab("students")}>
            <span>👥</span> Students
          </button>
          <button className={tab === "add" ? "nav-item active" : "nav-item"} onClick={() => setTab("add")}>
            <span>➕</span> Add Student
          </button>
          <button className={tab === "marks" ? "nav-item active" : "nav-item"} onClick={() => setTab("marks")}>
            <span>📊</span> Manage Marks
          </button>
        </nav>
        <button className="logout-btn" onClick={logout}>🚪 Logout</button>
      </aside>

      {/* Main */}
      <main className="dash-main">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        {/* STUDENTS LIST */}
        {tab === "students" && (
          <div className="section">
            <div className="section-header">
              <h2 className="1">All Students</h2>
              <span className="badge">{students.length} total</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th><th>Name</th><th>Department</th><th>DOB</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.student_id}>
                      {editId === s.student_id ? (
                        <>
                          <td>{s.student_id}</td>
                          <td><input className="inline-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                          <td><input className="inline-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} /></td>
                          <td><input className="inline-input" type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} /></td>
                          <td>
                            <button className="btn-save" onClick={() => handleUpdate(s.student_id)}>Save</button>
                            <button className="btn-cancel" onClick={() => setEditId(null)}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td><span className="id-chip">{s.student_id}</span></td>
                          <td>{s.name}</td>
                          <td>{s.department}</td>
                          <td>{s.dob}</td>
                          <td>
                            <button className="btn-edit" onClick={() => { setEditId(s.student_id); setEditForm({ name: s.name, dob: s.dob, department: s.department }); }}>✏️ Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(s.student_id)}>🗑️ Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign:"center", color:"#8888aa", padding:"32px"}}>No students yet. Add one!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD STUDENT */}
        {tab === "add" && (
          <div className="section">
            <div className="section-header"><h2>Add New Student</h2></div>
            <div className="form-card">
              <div className="form-grid">
                <div className="form-group">
                  <label>Student ID</label>
                  <input placeholder="e.g. S201" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input placeholder="Student name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    <option value="">Select Department</option>
                    <option>Computer Science</option>
                    <option>Information Technology</option>
                    <option>Electronics</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                  </select>
                </div>
              </div>
              <button className="submit-btn" onClick={handleAddStudent} disabled={loading}>
                {loading ? "Adding..." : "➕ Add Student"}
              </button>
            </div>
          </div>
        )}

        {/* MARKS */}
        {tab === "marks" && (
          <div className="section">
            <div className="section-header"><h2>Manage Marks</h2></div>
            {!selectedStudent ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Student ID</th><th>Name</th><th>Department</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.student_id}>
                        <td><span className="id-chip">{s.student_id}</span></td>
                        <td>{s.name}</td>
                        <td>{s.department}</td>
                        <td><button className="btn-edit" onClick={() => openMarks(s)}>📊 Enter Marks</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="form-card">
                <div className="marks-header">
                  <div>
                    <h3>{selectedStudent.name}</h3>
                    <span className="id-chip">{selectedStudent.student_id}</span>
                  </div>
                  <button className="btn-cancel" onClick={() => setSelectedStudent(null)}>← Back</button>
                </div>
                <div className="marks-grid">
                  {subjects.map(sub => (
                    <div className="mark-item" key={sub.id}>
                      <label>{sub.name}</label>
                      <input
                        type="number"
                        min="0" max="100"
                        placeholder="0 - 100"
                        value={marks[sub.id] || ""}
                        onChange={e => setMarks({...marks, [sub.id]: e.target.value})}
                      />
                    </div>
                  ))}
                </div>
                <button className="submit-btn" onClick={handleSaveMarks}>💾 Save Marks</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}