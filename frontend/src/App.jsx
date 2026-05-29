import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://resume-screening-backend-basz.onrender.com";

function App() {
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jdSkills, setJdSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);

  const jdFileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/candidates`);
      setCandidates(res.data.candidates || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to fetch candidates");
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleResumeChange = (e) => {
    setFiles(e.target.files);
  };

  const handleJdFileChange = (e) => {
    setJdFile(e.target.files[0] || null);
  };

  const clearJdFile = () => {
    setJdFile(null);
    if (jdFileInputRef.current) {
      jdFileInputRef.current.value = "";
    }
  };

  const clearResumeFiles = () => {
    setFiles([]);
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast.error("Please select at least one resume");
      return;
    }

    if (!jdText.trim() && !jdFile) {
      toast.error("Please paste a job description or upload a JD file");
      return;
    }

    const formData = new FormData();
    formData.append("jdText", jdText);

    if (jdFile) {
      formData.append("jdFile", jdFile);
    }

    for (let i = 0; i < files.length; i++) {
      formData.append("resumes", files[i]);
    }

    const loadingToast = toast.loading("Uploading and ranking candidates...");

    try {
      setIsLoading(true);
      setUploadSummary(null);

      const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.dismiss(loadingToast);

      const inserted = Number(res.data.inserted || 0);
      const skipped = Number(res.data.skipped || 0);

      if (inserted > 0) {
        toast.success(
          inserted === 1
            ? "1 resume uploaded successfully"
            : `${inserted} resumes uploaded successfully`
        );
      } else if (skipped > 0) {
        toast("No new resumes were added");
      } else {
        toast.success("Upload completed successfully");
      }

      setUploadSummary({
        inserted,
        skipped,
      });

      setJdSkills(res.data.jd_skills || []);
      await fetchCandidates();

      clearResumeFiles();
      setJdFile(null);
      if (jdFileInputRef.current) {
        jdFileInputRef.current.value = "";
      }
      setJdText("");
    } catch (error) {
      console.error("Upload error:", error);
      toast.dismiss(loadingToast);
      toast.error("Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    const loadingToast = toast.loading("Clearing candidate records...");

    try {
      setIsLoading(true);
      await axios.delete(`${API_BASE_URL}/candidates`);

      toast.dismiss(loadingToast);
      toast.success("All candidates deleted");

      setCandidates([]);
      setJdSkills([]);
      setSearchTerm("");
      setUploadSummary(null);
      clearResumeFiles();
      setJdFile(null);

      if (jdFileInputRef.current) {
        jdFileInputRef.current.value = "";
      }

      setJdText("");
    } catch (error) {
      console.error("Delete error:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to clear candidates");
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchLabel = (score) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    return "Low";
  };

  const getScoreClass = (score) => {
    if (score >= 85) return "score-pill excellent";
    if (score >= 70) return "score-pill good";
    if (score >= 50) return "score-pill average";
    return "score-pill low";
  };

  const getVisibleSkills = (skillsText) => {
    if (!skillsText) {
      return [];
    }

    return skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 5);
  };

  const filteredAndSortedCandidates = useMemo(() => {
    const filtered = candidates.filter((candidate) => {
      const search = searchTerm.toLowerCase();

      return (
        candidate.name?.toLowerCase().includes(search) ||
        candidate.email?.toLowerCase().includes(search) ||
        candidate.education?.toLowerCase().includes(search) ||
        candidate.skills?.toLowerCase().includes(search) ||
        candidate.matched_skills?.join(", ").toLowerCase().includes(search) ||
        candidate.missing_skills?.join(", ").toLowerCase().includes(search)
      );
    });

    return [...filtered].sort((a, b) => {
      return sortOrder === "desc"
        ? b.match_score - a.match_score
        : a.match_score - b.match_score;
    });
  }, [candidates, searchTerm, sortOrder]);

  const exportToCSV = () => {
    if (filteredAndSortedCandidates.length === 0) {
      toast.error("No candidates available to export");
      return;
    }

    const headers = [
      "Rank",
      "Name",
      "Email",
      "Education",
      "Experience",
      "Resume Preview",
      "Skills",
      "Matched Skills",
      "Missing Skills",
      "Match Score",
      "Status",
    ];

    const rows = filteredAndSortedCandidates.map((candidate, index) => [
      index + 1,
      candidate.name || "",
      candidate.email || "",
      candidate.education || "",
      `${candidate.experience || 0} yrs`,
      candidate.resume_file
        ? `${API_BASE_URL}/uploads/${candidate.resume_file}`
        : "",
      candidate.skills || "",
      candidate.matched_skills?.join(", ") || "",
      candidate.missing_skills?.join(", ") || "",
      `${candidate.match_score || 0}%`,
      getMatchLabel(candidate.match_score || 0),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "ranked_candidates.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  };

  const totalCandidates = filteredAndSortedCandidates.length;

  const topCandidate =
    filteredAndSortedCandidates.length > 0
      ? filteredAndSortedCandidates[0].name
      : "N/A";

  const averageScore =
    filteredAndSortedCandidates.length > 0
      ? Math.round(
          filteredAndSortedCandidates.reduce(
            (sum, candidate) => sum + (candidate.match_score || 0),
            0
          ) / filteredAndSortedCandidates.length
        )
      : 0;

  const strongMatches = filteredAndSortedCandidates.filter(
    (candidate) => candidate.match_score >= 70
  ).length;

  return (
    <div className="app-shell">
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fbfbf9",
            color: "#28251d",
            border: "1px solid rgba(40, 37, 29, 0.12)",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(20, 18, 15, 0.08)",
            fontSize: "14px",
            fontWeight: 600,
            padding: "12px 14px",
          },
          success: {
            iconTheme: {
              primary: "#01696f",
              secondary: "#fbfbf9",
            },
          },
          error: {
            iconTheme: {
              primary: "#a13544",
              secondary: "#fbfbf9",
            },
          },
          loading: {
            iconTheme: {
              primary: "#01696f",
              secondary: "#fbfbf9",
            },
          },
        }}
      />

      <div className="app-bg-orb app-bg-orb-1"></div>
      <div className="app-bg-orb app-bg-orb-2"></div>

      <main className="container">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Recruiter Dashboard</span>
            <h1>Resume Screening & Candidate Ranking</h1>
            <p className="hero-text">
              Upload a job description, screen multiple resumes, compare skill
              match quality, preview files, and export ranked candidates in one
              clean workflow.
            </p>
          </div>

          <div className="hero-stats">
            <div className="mini-stat">
              <span className="mini-stat-label">Candidates</span>
              <strong>{totalCandidates}</strong>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-label">Strong Matches</span>
              <strong>{strongMatches}</strong>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-label">Average Score</span>
              <strong>{averageScore}%</strong>
            </div>
          </div>
        </section>

        <section className="panel-grid">
          <article className="panel card">
            <div className="section-head">
              <div>
                <h2>Job Description</h2>
                <p className="section-subtext">
                  Paste the JD text directly or upload a JD file for parsing.
                </p>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Job description text</label>
              <textarea
                placeholder="Paste job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">
                Upload JD file (.txt, .pdf, .docx)
              </label>
              <input
                ref={jdFileInputRef}
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleJdFileChange}
              />
            </div>

            {jdFile && (
              <div className="file-card">
                <div>
                  <p className="file-card-title">Selected JD File</p>
                  <p className="file-card-name">{jdFile.name}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={clearJdFile}
                >
                  Clear
                </button>
              </div>
            )}

            {jdSkills.length > 0 && (
              <div className="field-group">
                <label className="field-label">Detected JD Skills</label>
                <div className="chip-wrap">
                  {jdSkills.map((skill, index) => (
                    <span key={index} className="chip chip-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          <article className="panel card">
            <div className="section-head">
              <div>
                <h2>Resume Upload</h2>
                <p className="section-subtext">
                  Upload one or more resumes and rank them against the selected
                  JD.
                </p>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Upload resumes</label>
              <input
                ref={resumeInputRef}
                type="file"
                multiple
                onChange={handleResumeChange}
              />
            </div>

            <div className="upload-summary">
              <div className="upload-stat">
                <span className="upload-stat-label">Selected files</span>
                <strong>{files.length}</strong>
              </div>
              <div className="upload-stat">
                <span className="upload-stat-label">Status</span>
                <strong>{isLoading ? "Processing" : "Ready"}</strong>
              </div>
            </div>

            {uploadSummary && (
              <div className="upload-inline-note">
                <span>
                  Added: <strong>{uploadSummary.inserted}</strong>
                </span>
                <span>
                  Duplicates skipped: <strong>{uploadSummary.skipped}</strong>
                </span>
              </div>
            )}

            {files.length > 0 && (
              <div className="selected-files">
                {Array.from(files).map((file, index) => (
                  <div className="selected-file-item" key={`${file.name}-${index}`}>
                    <span className="selected-file-dot"></span>
                    <span className="selected-file-name">{file.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="action-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Upload and Rank"}
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear Candidates
              </button>
            </div>
          </article>
        </section>

        <section className="summary-grid">
          <article className="summary-card card">
            <span className="summary-label">Total Candidates</span>
            <strong className="summary-value">{totalCandidates}</strong>
            <p className="summary-note">Visible after filters and search.</p>
          </article>

          <article className="summary-card card">
            <span className="summary-label">Top Candidate</span>
            <strong className="summary-value summary-name">{topCandidate}</strong>
            <p className="summary-note">
              Highest ranked candidate in current view.
            </p>
          </article>

          <article className="summary-card card">
            <span className="summary-label">Average Score</span>
            <strong className="summary-value">{averageScore}%</strong>
            <p className="summary-note">Average of all visible candidate scores.</p>
          </article>

          <article className="summary-card card">
            <span className="summary-label">Strong Matches</span>
            <strong className="summary-value">{strongMatches}</strong>
            <p className="summary-note">Candidates scoring 70% and above.</p>
          </article>
        </section>

        <section className="card controls-card">
          <div className="section-head">
            <div>
              <h2>Dashboard Controls</h2>
              <p className="section-subtext">
                Search candidates, reorder ranking, and export the current view.
              </p>
            </div>
          </div>

          <div className="controls-grid">
            <div className="control-block control-search">
              <label className="field-label">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, skills, education..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="control-block control-sort">
              <label className="field-label">Sort by score</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>

            <div className="control-block control-action">
              <label className="field-label">Export</label>
              <button
                type="button"
                className="btn btn-primary"
                onClick={exportToCSV}
              >
                Export CSV
              </button>
            </div>
          </div>
        </section>

        <section className="card results-section">
          <div className="section-head results-head">
            <div>
              <h2>Candidate Rankings</h2>
              <p className="section-subtext">
                Ranked candidate results with preview links, skill matching, and
                score status.
              </p>
            </div>
            <div className="results-count">
              <span>{filteredAndSortedCandidates.length} result(s)</span>
            </div>
          </div>

          {filteredAndSortedCandidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <h3>No candidates found</h3>
              <p>
                Upload resumes or adjust your current search and sorting filters.
              </p>
            </div>
          ) : (
            <div className="results-grid">
              {filteredAndSortedCandidates.map((candidate, index) => {
                const visibleSkills = getVisibleSkills(candidate.skills);

                return (
                  <article className="candidate-card" key={candidate.id}>
                    <div className="candidate-card-header">
                      <span className="candidate-rank-badge">Rank #{index + 1}</span>

                      <div className="candidate-title-block">
                        <h3 className="candidate-name">{candidate.name || "-"}</h3>
                        <p className="candidate-email">{candidate.email || "-"}</p>
                      </div>

                      <span className={getScoreClass(candidate.match_score)}>
                        {candidate.match_score || 0}%
                      </span>
                    </div>

                    <div className="candidate-meta-grid">
                      <div className="candidate-meta-item">
                        <span className="meta-label">Education</span>
                        <p>{candidate.education || "-"}</p>
                      </div>
                      <div className="candidate-meta-item">
                        <span className="meta-label">Experience</span>
                        <p>{candidate.experience || 0} yrs</p>
                      </div>
                      <div className="candidate-meta-item">
                        <span className="meta-label">Status</span>
                        <p>{getMatchLabel(candidate.match_score || 0)}</p>
                      </div>
                      <div className="candidate-meta-item">
                        <span className="meta-label">Resume</span>
                        <p>
                          {candidate.resume_file ? (
                            <a
                              href={`${API_BASE_URL}/uploads/${candidate.resume_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Resume
                            </a>
                          ) : (
                            "-"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="candidate-section">
                      <span className="meta-label">Top Skills</span>
                      {visibleSkills.length > 0 ? (
                        <div className="chip-wrap">
                          {visibleSkills.map((skill, i) => (
                            <span key={i} className="chip chip-neutral">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    <div className="candidate-section">
                      <span className="meta-label">Matched Skills</span>
                      {candidate.matched_skills?.length ? (
                        <div className="chip-wrap">
                          {candidate.matched_skills.map((skill, i) => (
                            <span key={i} className="chip chip-primary">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    <div className="candidate-section">
                      <span className="meta-label">Missing Skills</span>
                      {candidate.missing_skills?.length ? (
                        <div className="chip-wrap">
                          {candidate.missing_skills.map((skill, i) => (
                            <span key={i} className="chip chip-danger">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;