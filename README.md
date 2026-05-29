# Resume Screening & Candidate Ranking System

A full-stack web application that screens resumes against a job description, ranks candidates by match score, and shows matched and missing skills in a simple recruiter dashboard.

## Features

- Paste a job description or upload a JD file
- Upload multiple resumes
- Parse resume and JD content
- Rank candidates by match score
- Show matched and missing skills
- Search and sort candidates
- Preview uploaded resumes
- Export ranked candidates as CSV

## Tech Stack

**Frontend**
- React
- Vite
- Axios
- CSS

**Backend**
- Node.js
- Express.js
- Multer
- MySQL

---

## Project Structure

```bash
resume-screening-app/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── parser.js
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## Setup Instructions

### 1. Clone the project

```bash
git clone <repo-url>
cd resume-screening-app
```

### 2. Backend setup

```bash
cd backend
npm install
```

Configure your MySQL connection in `db.js`:

```js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "resume_screening"
});

module.exports = db;
```

Run the backend:

```bash
node server.js
```

Backend will run on:

```bash
http://localhost:5000
```

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

Make sure the backend is running before using the frontend.

---

## Brief Documentation

### Architecture Overview

The application is split into a React frontend and a Node/Express backend, with MySQL as the data store.

- **Frontend (React + Vite)**
  - Provides the recruiter dashboard UI
  - Screens:
    - Job Description & Resume upload
    - Summary metrics (total candidates, strong matches, average score)
    - Candidate table and mobile cards
  - Communicates with the backend using Axios
  - Endpoints used:
    - `GET /candidates`
    - `POST /upload`
    - `DELETE /candidates`
    - `GET /uploads/:filename` (for resume preview)

- **Backend (Node.js + Express)**
  - Handles file uploads with Multer
  - Extracts text from job description file and resumes
  - Identifies skills in JD and resumes
  - Calculates a match score per candidate
  - Stores candidate details and scores in MySQL
  - Serves uploaded files from `/uploads`

- **Database (MySQL)**
  - Stores parsed candidate data
  - Example `candidates` table columns:
    - `id`
    - `name`
    - `email`
    - `education`
    - `experience`
    - `skills`
    - `resume_text`
    - `match_score`
    - `matched_skills`
    - `missing_skills`
    - `resume_file`

### Approach Used for Scoring Candidates

The scoring logic is intentionally simple and keyword-based (rule-based), suitable for a prototype:

- Extract text from:
  - Job description (JD)
  - Candidate resume

- Normalize text:
  - Convert to lowercase
  - Basic cleaning

- Identify a set of **important skills/keywords**, for example:
  - `react`, `node`, `javascript`, `java`, `python`
  - `sql`, `mysql`, `postgresql`, `mongodb`
  - `express`, `rest api`, `git`
- For each skill:
  - If the JD contains the skill **and** the resume contains the skill, add weighted points.
  - Some skills have higher weight (e.g., core stack technologies).

- Add extra points if the resume text contains:
  - `project` / `projects`
  - `internship`
  - `experience`
  - role-related words like `full stack`, `backend`, `frontend`, `developer`

- Derive:
  - `matched_skills`: skills present in both JD and resume
  - `missing_skills`: skills present in JD but not found in the resume

- Final score:
  - Sum of all points from matched skills and extra signals
  - Clamp within a reasonable range (e.g., 0–95)
  - Store as `match_score` for sorting and display

This approach is **deterministic** and easy to understand, but it is not an AI/ML model. It focuses only on keyword presence and simple heuristics.

### Assumptions

- The job description and resumes are in English.
- Uploaded resumes are in supported formats (for example `.pdf`, `.docx`, `.txt`) that the parser can extract plain text from.
- If some fields (like name, email, education, or experience) cannot be reliably parsed from the resume, they may be stored as empty or fallback values.
- Duplicate candidates are currently handled only at the application level (no complex duplicate-detection logic in the database).
- This scoring approach is meant for demonstration and learning, not as a production-ready ATS scoring engine.