from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from datetime import date
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ DB Connection
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="college_db"
    )

@app.on_event("startup")
def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id VARCHAR(50) UNIQUE,
            name VARCHAR(100),
            dob DATE,
            department VARCHAR(100),
            created_by VARCHAR(50)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) UNIQUE
        )
    """)

    # Fixed 4 subjects
    for subject in ["Java", "Python", "FastAPI", "Spring Boot"]:
        cursor.execute("INSERT IGNORE INTO subjects (name) VALUES (%s)", (subject,))

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS marks (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id VARCHAR(50),
            subject_id INT,
            marks INT,
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()


class LoginRequest(BaseModel):
    teacher_id: str
    dob: str

class StudentLoginRequest(BaseModel):
    student_id: str
    dob: str

class StudentCreate(BaseModel):
    student_id: str
    name: str
    dob: str
    department: str
    teacher_id: str  # who is adding

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    department: Optional[str] = None

class MarkEntry(BaseModel):
    student_id: str
    subject_id: int
    marks: int


@app.post("/login")
def teacher_login(data: LoginRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM teachers WHERE teacher_id = %s", (data.teacher_id,))
        teacher = cursor.fetchone()
        cursor.close()
        conn.close()

        if not teacher:
            raise HTTPException(status_code=401, detail="Invalid Teacher ID or Date of Birth")

        db_dob = teacher["dob"].strftime("%Y-%m-%d") if isinstance(teacher["dob"], date) else str(teacher["dob"])

        if db_dob != data.dob:
            raise HTTPException(status_code=401, detail="Invalid Teacher ID or Date of Birth")

        return {
            "success": True,
            "message": "Teacher login successful",
            "role": "teacher",
            "teacher": {
                "teacher_id": teacher["teacher_id"],
                "name": teacher["name"],
                "department": teacher["department"],
                "dob": db_dob
            }
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/student/login")
def student_login(data: StudentLoginRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM students WHERE student_id = %s", (data.student_id,))
        student = cursor.fetchone()
        cursor.close()
        conn.close()

        if not student:
            raise HTTPException(status_code=401, detail="Invalid Student ID or Date of Birth")

        db_dob = student["dob"].strftime("%Y-%m-%d") if isinstance(student["dob"], date) else str(student["dob"])

        if db_dob != data.dob:
            raise HTTPException(status_code=401, detail="Invalid Student ID or Date of Birth")

        return {
            "success": True,
            "message": "Student login successful",
            "role": "student",
            "student": {
                "student_id": student["student_id"],
                "name": student["name"],
                "department": student["department"],
                "dob": db_dob
            }
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/students")
def add_student(data: StudentCreate):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO students (student_id, name, dob, department, created_by)
            VALUES (%s, %s, %s, %s, %s)
        """, (data.student_id, data.name, data.dob, data.department, data.teacher_id))
        conn.commit()
        cursor.close()
        conn.close()
        return {"success": True, "message": "Student added successfully"}
    except mysql.connector.IntegrityError:
        raise HTTPException(status_code=400, detail="Student ID already exists")
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/students")
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM students")
    students = cursor.fetchall()
    for s in students:
        if isinstance(s["dob"], date):
            s["dob"] = s["dob"].strftime("%Y-%m-%d")
    cursor.close()
    conn.close()
    return {"success": True, "students": students}


@app.put("/students/{student_id}")
def update_student(student_id: str, data: StudentUpdate):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        fields = []
        values = []
        if data.name:
            fields.append("name = %s")
            values.append(data.name)
        if data.dob:
            fields.append("dob = %s")
            values.append(data.dob)
        if data.department:
            fields.append("department = %s")
            values.append(data.department)

        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        values.append(student_id)
        cursor.execute(f"UPDATE students SET {', '.join(fields)} WHERE student_id = %s", values)
        conn.commit()
        cursor.close()
        conn.close()
        return {"success": True, "message": "Student updated successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/students/{student_id}")
def delete_student(student_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM students WHERE student_id = %s", (student_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"success": True, "message": "Student deleted successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/subjects")
def get_subjects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM subjects")
    subjects = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"success": True, "subjects": subjects}


@app.post("/marks")
def add_mark(data: MarkEntry):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # If mark exists update, else insert
        cursor.execute("""
            INSERT INTO marks (student_id, subject_id, marks)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE marks = %s
        """, (data.student_id, data.subject_id, data.marks, data.marks))
        conn.commit()
        cursor.close()
        conn.close()
        return {"success": True, "message": "Mark saved successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/marks/{student_id}")
def get_marks(student_id: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.name AS subject, m.marks
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = %s
    """, (student_id,))
    marks = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"success": True, "marks": marks}