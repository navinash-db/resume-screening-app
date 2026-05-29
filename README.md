# Resume Screening & Candidate Ranking System

Final-year full-stack project for automated resume screening and candidate ranking.

A full-stack web application that helps recruiters upload a job description and multiple resumes, automatically rank candidates based on skill matching, view uploaded resume files, and export ranked results as CSV. The application is built with a React + Vite frontend and a Node.js + Express backend with MySQL-compatible database integration, and it is deployed with environment-based configuration for production use.

## Live Demo

- Frontend: https://resume-screening-frontend-omega.vercel.app/
- Backend: https://resume-screening-backend-basz.onrender.com
- GitHub Repository: https://github.com/navinash-db/resume-screening-app

## Features

- Upload a job description as text or file
- Upload single or multiple resumes
- Support resume uploads in PDF, DOC, and DOCX formats
- Extract and analyze resume content
- Detect JD-related skills
- Generate candidate match scores from 0 to 100
- Rank candidates from highest to lowest fit
- Show matched skills and missing skills
- View uploaded resume files
- Search and sort candidate results
- Export ranked candidates as CSV (Excel-compatible)
- Responsive UI for desktop and mobile

## Tech Stack

### Frontend

- React
- Vite
- Axios
- React Hot Toast
- CSS

### Backend

- Node.js
- Express.js
- Multer
- Resume text parsing utilities
- MySQL-compatible database

### Deployment

- Frontend: Vercel
- Backend: Render

## Project Structure

```bash
resume-screening-app/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── uploads/
│   ├── server.js
│   ├── db.js
│   ├── parser.js
│   └── package.json
```

## Workflow

1. Upload one or more resumes.
2. Enter a Job Description manually or upload a JD file.
3. The backend extracts resume and JD text.
4. Candidate resumes are compared against the JD.
5. A match score is generated for each candidate.
6. Candidates are ranked from highest to lowest score.
7. Results are shown in a searchable and sortable dashboard.
8. Ranked results can be exported as CSV.

## Architecture Overview

The application follows a simple full-stack architecture:

- **Frontend:** React + Vite application hosted on Vercel
- **Backend:** Node.js + Express API hosted on Render
- **Database:** MySQL-compatible database used to store candidate records
- **File Handling:** Multer is used for uploading resumes and JD files, and uploaded files are stored on the backend
- **Processing Flow:** The frontend sends JD and resume files to the backend, the backend extracts text, performs skill-based matching and scoring, stores candidate results in the database, and returns ranked results to the frontend

## Scoring Approach

The scoring logic uses a keyword and skill-based comparison approach between the job description and resume text.

Main scoring factors:

- Skill match between JD and resume
- Presence of relevant technical keywords
- Project and internship indicators
- Experience-related keywords
- Education and general role relevance

A weighted score is calculated and normalized into a 0–100 style ranking range, then candidates are sorted from highest to lowest match score.

## Assumptions

- Candidate name is derived from the uploaded resume filename when an exact name is not parsed
- Placeholder email may be generated when an email is not extracted from the resume
- Education and experience are currently simplified/defaulted in some cases
- Scoring is heuristic and keyword-based, not LLM-based semantic ranking
- CSV export is provided for ranked result download and can be opened in Excel

## API Endpoints

| Method | Endpoint      | Description             |
| ------ | ------------- | ----------------------- |
| GET    | `/`           | Health check            |
| GET    | `/candidates` | Fetch ranked candidates |
| POST   | `/upload`     | Upload JD and resumes   |
| DELETE | `/candidates` | Clear all candidates    |

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/navinash-db/resume-screening-app.git
cd resume-screening-app
```

### 2. Setup frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Setup backend

```bash
cd backend
npm install
node server.js
```

## Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=https://resume-screening-backend-basz.onrender.com
```

### Backend (set in Render or local environment)

```env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=
DB_SSL=
FRONTEND_URL=https://resume-screening-frontend-omega.vercel.app
PORT=5000
```

## Key Improvements

- Removed horizontal scrolling issue in candidate results
- Replaced wide table-based results layout with responsive cards
- Improved mobile alignment for name, email, rank, and score
- Reduced noisy upload toast behavior
- Added environment-based frontend API configuration
- Improved backend deployment readiness with CORS and uploads handling

## Future Enhancements

- Better resume parsing for real email, education, and experience extraction
- Improved duplicate detection using file or content hash
- Pagination for larger candidate datasets
- Smarter scoring logic with weighted semantic matching
- Recruiter authentication and saved sessions
- Native Excel (`.xlsx`) export support

## Author

**Navinash D.B.**
B.Tech IT Graduate, Meenakshi College of Engineering, Chennai
GitHub: https://github.com/navinash-db
Email: db.navinash@gmail.com

## License

This project is for educational and project submission purposes.
