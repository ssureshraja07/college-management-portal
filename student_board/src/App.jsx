import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";

// Route guard
function PrivateRoute({ children, role }) {
  const storedRole = localStorage.getItem("role");
  const user = localStorage.getItem("user");
  if (!user || storedRole !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/teacher" element={
          <PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>
        } />
        <Route path="/student" element={
          <PrivateRoute role="student"><StudentDashboard /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}