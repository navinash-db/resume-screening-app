const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./db");
const { extractTextFromFile } = require("./parser");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://resume-screening-frontend-omega.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowedExact = allowedOrigins.includes(origin);
      const isAllowedVercel =
        /^https:\/\/resume-screening-frontend.*\.vercel\.app$/.test(origin);

      if (isAllowedExact || isAllowedVercel) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.use("/uploads", express.static(uploadPath));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const allowedExtensions = [".pdf", ".doc", ".docx", ".txt"];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, and TXT files are allowed"));
    }
  },
});

const SKILL_KEYWORDS = [
  "react",
  "node",
  "node.js",
  "sql",
  "git",
  "html",
  "css",
  "javascript",
  "java",
  "python",
  "mongodb",
  "postgresql",
  "mysql",
  "express",
  "rest api",
  "api",
  "full stack",
  "frontend",
  "backend",
];

function normalizeSkillName(skill) {
  const map = {
    node: "Node.js",
    "node.js": "Node.js",
    react: "React",
    sql: "SQL",
    git: "Git",
    html: "HTML",
    css: "CSS",
    javascript: "JavaScript",
    java: "Java",
    python: "Python",
    mongodb: "MongoDB",
    postgresql: "PostgreSQL",
    mysql: "MySQL",
    express: "Express.js",
    "rest api": "REST API",
    api: "API",
    "full stack": "Full Stack",
    frontend: "Frontend",
    backend: "Backend",
  };

  return map[skill.toLowerCase()] || skill;
}

function extractSkillsFromText(text) {
  const lower = (text || "").toLowerCase();
  const skills = [];

  for (const keyword of SKILL_KEYWORDS) {
    if (lower.includes(keyword)) {
      skills.push(normalizeSkillName(keyword));
    }
  }

  return [...new Set(skills)];
}

function calculateScore(jdText, resumeText, skills) {
  const jd = (jdText || "").toLowerCase();
  const resume = (resumeText || "").toLowerCase();

  let score = 0;

  const requiredSkills = [
    { key: "react", points: 15 },
    { key: "node", points: 15 },
    { key: "sql", points: 12 },
    { key: "git", points: 8 },
    { key: "html", points: 6 },
    { key: "css", points: 6 },
    { key: "javascript", points: 10 },
    { key: "java", points: 10 },
    { key: "python", points: 10 },
    { key: "mongodb", points: 8 },
    { key: "mysql", points: 8 },
    { key: "postgresql", points: 8 },
    { key: "express", points: 8 },
    { key: "rest api", points: 10 },
  ];

  for (const item of requiredSkills) {
    if (jd.includes(item.key) && resume.includes(item.key)) {
      score += item.points;
    }
  }

  if (resume.includes("project")) score += 8;
  if (resume.includes("projects")) score += 4;
  if (resume.includes("internship")) score += 8;
  if (resume.includes("experience")) score += 6;
  if (resume.includes("developer")) score += 4;
  if (resume.includes("full stack")) score += 8;
  if (resume.includes("backend")) score += 4;
  if (resume.includes("frontend")) score += 4;

  if (skills.includes("React")) score += 3;
  if (skills.includes("Node.js")) score += 3;
  if (skills.includes("SQL")) score += 3;
  if (skills.includes("Git")) score += 2;

  if (score < 35) score += 20;
  if (score > 95) score = 95;

  return score;
}

function getMatchedAndMissingSkills(jdText, resumeText) {
  const jdSkills = extractSkillsFromText(jdText);
  const resumeSkills = extractSkillsFromText(resumeText);

  const matchedSkills = jdSkills.filter((skill) => resumeSkills.includes(skill));
  const missingSkills = jdSkills.filter((skill) => !resumeSkills.includes(skill));

  return {
    jdSkills,
    resumeSkills,
    matchedSkills,
    missingSkills,
  };
}

function buildCandidateEmail(displayName) {
  const slug = (displayName || "candidate")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "candidate"}@example.com`;
}

app.get("/", (req, res) => {
  res.send("Resume Screening Backend is running");
});

app.get("/candidates", (req, res) => {
  const sql = "SELECT * FROM candidates ORDER BY match_score DESC, id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching candidates",
        error: err.message,
      });
    }

    const formattedCandidates = result.map((candidate) => ({
      ...candidate,
      matched_skills: candidate.matched_skills
        ? candidate.matched_skills.split(", ").filter(Boolean)
        : [],
      missing_skills: candidate.missing_skills
        ? candidate.missing_skills.split(", ").filter(Boolean)
        : [],
    }));

    res.json({
      success: true,
      candidates: formattedCandidates,
    });
  });
});

app.delete("/candidates", (req, res) => {
  const sql = "DELETE FROM candidates";

  db.query(sql, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error deleting candidates",
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "All candidates deleted successfully",
    });
  });
});

app.post(
  "/upload",
  upload.fields([
    { name: "resumes", maxCount: 20 },
    { name: "jdFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let { jdText } = req.body;
      const files = req.files?.resumes || [];
      const jdUploadedFile = req.files?.jdFile ? req.files.jdFile[0] : null;

      if (jdUploadedFile) {
        const parsedJdText = await extractTextFromFile(jdUploadedFile.path);
        if (parsedJdText && parsedJdText.trim()) {
          jdText = parsedJdText;
        }
      }

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      let inserted = 0;
      let skipped = 0;

      for (const file of files) {
        const resumeBaseName = path.parse(file.originalname).name.trim();
        const candidateName = resumeBaseName || "Unknown Candidate";
        const email = buildCandidateEmail(candidateName);

        let resumeText = await extractTextFromFile(file.path);

        if (!resumeText || !resumeText.trim()) {
          resumeText = `Resume content from ${file.originalname}`;
        }

        const skillsArray = extractSkillsFromText(resumeText);
        const skills = skillsArray.join(", ");
        const score = calculateScore(jdText, resumeText, skillsArray);
        const analysis = getMatchedAndMissingSkills(jdText, resumeText);

        const checkSql = "SELECT id FROM candidates WHERE name = ?";

        const existing = await new Promise((resolve, reject) => {
          db.query(checkSql, [candidateName], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        const insertSql = `
          INSERT INTO candidates
          (name, email, education, experience, skills, resume_text, match_score, matched_skills, missing_skills, resume_file)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await new Promise((resolve, reject) => {
          db.query(
            insertSql,
            [
              candidateName,
              email,
              "B.Tech IT",
              1.0,
              skills || "General Skills",
              resumeText,
              score,
              analysis.matchedSkills.join(", "),
              analysis.missingSkills.join(", "),
              file.filename,
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        inserted++;
      }

      res.json({
        success: true,
        message: "Upload completed successfully",
        inserted,
        skipped,
        jd_skills: extractSkillsFromText(jdText || ""),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});