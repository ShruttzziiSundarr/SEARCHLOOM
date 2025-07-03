import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { FaCopy, FaExternalLinkAlt, FaStar } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = "http://127.0.0.1:5000/api";

const sources = ["Exa", "Google", "YouTube"];

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("default");
  const [showDashboard, setShowDashboard] = useState(false);
  const [analytics, setAnalytics] = useState({ trending: [], most_clicked: [] });

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults({});
    const res = await axios.post(`${API_URL}/search`, { query });
    setResults(res.data.results);
    setRecommendations(res.data.recommendations);
    setTrending(res.data.trending);
    setLoading(false);
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const handleExport = async (format) => {
    const res = await axios.post(
      `${API_URL}/export`,
      { results, format },
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      format === "csv" ? "results.csv" : "results.json"
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(`Exported as ${format.toUpperCase()}!`);
  };

  const handleFavorite = async (item) => {
    await axios.post(`${API_URL}/favorites`, { favorite: item });
    setFavorites([...favorites, item]);
    toast.success("Saved to favorites!");
  };

  const highlight = (text) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-warning">{part}</mark>
      ) : (
        part
      )
    );
  };

  // Filtering and sorting
  const getFilteredSorted = (items) => {
    let arr = [...items];
    if (sort === "az")
      arr.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "za")
      arr.sort((a, b) => b.title.localeCompare(a.title));
    return arr;
  };

  const fetchAnalytics = async () => {
    const res = await axios.get(`${API_URL}/analytics`);
    setAnalytics(res.data);
  };

  const handleView = (url) => {
    axios.post(`${API_URL}/click`, { url });
    window.open(url, "_blank");
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <ToastContainer />
      <header className="bg-white shadow p-4 mb-3">
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between">
          <h1 className="display-5 fw-bold text-primary mb-3 mb-md-0">Smart Unified Search</h1>
          <div className="d-flex gap-2 align-items-center">
            <button className="btn btn-outline-dark" onClick={() => { setShowDashboard(!showDashboard); if (!showDashboard) fetchAnalytics(); }}>
              {showDashboard ? 'Hide' : 'Show'} Analytics Dashboard
            </button>
            <form onSubmit={handleSearch} className="d-flex w-100 w-md-auto gap-2">
              <input
                className="form-control"
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit">
                Search
              </button>
            </form>
          </div>
        </div>
      </header>
      {showDashboard && (
        <main className="container my-4">
          <h2 className="mb-4 text-primary">Trends & Analytics Dashboard</h2>
          <div className="row">
            <div className="col-md-6 mb-4">
              <h5>Trending Searches</h5>
              <Bar
                data={{
                  labels: analytics.trending.map(([q]) => q),
                  datasets: [{ label: "Searches", data: analytics.trending.map(([, count]) => count), backgroundColor: "#6f42c1" }]
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
            <div className="col-md-6 mb-4">
              <h5>Most Clicked Results</h5>
              <Bar
                data={{
                  labels: analytics.most_clicked.map(([url]) => url),
                  datasets: [{ label: "Clicks", data: analytics.most_clicked.map(([, count]) => count), backgroundColor: "#0d6efd" }]
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
          </div>
        </main>
      )}
      <main className="container flex-grow-1">
        <div className="row mb-4 g-2">
          <div className="col-auto">
            <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="All">All Sources</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-auto">
            <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="default">Default</option>
              <option value="az">Title A-Z</option>
              <option value="za">Title Z-A</option>
            </select>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-success" onClick={() => handleExport("csv")}>Export CSV</button>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-info" onClick={() => handleExport("json")}>Export JSON</button>
          </div>
        </div>
        {loading && (
          <div className="d-flex justify-content-center align-items-center" style={{height: '8rem'}}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {!loading && (
          <>
            <div className="mb-4 row g-2">
              <div className="col-auto">
                <span className="fw-semibold">Trending:</span>
                {trending.map((t, i) => (
                  <span key={i} className="ms-2 px-2 py-1 bg-primary bg-opacity-10 rounded">{t}</span>
                ))}
              </div>
              <div className="col-auto">
                <span className="fw-semibold">Recommendations:</span>
                {recommendations.map((r, i) => (
                  <span key={i} className="ms-2 px-2 py-1 bg-info bg-opacity-10 rounded">{r}</span>
                ))}
              </div>
            </div>
            {results['Ranked'] && results['Ranked'].length > 0 && (
              <div className="mb-5">
                <h2 className="h4 text-success mb-3">Top Ranked Results</h2>
                <div className="row g-3">
                  {results['Ranked'].map((r, idx) => (
                    <div key={idx} className="col-md-6">
                      <div className="card shadow-sm h-100">
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex align-items-center mb-2">
                            <span className="badge bg-secondary me-2">{r.source}</span>
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-none text-dark flex-grow-1">{r.title}</a>
                            <button onClick={() => handleCopy(r.url)} className="btn btn-sm btn-outline-secondary ms-2" title="Copy Link"><FaCopy /></button>
                            <button onClick={() => handleView(r.url)} className="btn btn-sm btn-outline-success ms-2" title="View"><FaExternalLinkAlt /></button>
                            <button onClick={() => handleFavorite(r)} className="btn btn-sm btn-outline-warning ms-2" title="Save to Favorites"><FaStar /></button>
                          </div>
                          <div className="text-secondary small">{highlight(r.snippet)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sources.filter(s => filter === "All" || filter === s).map(source => (
              results[source] && results[source].length > 0 && (
                <div key={source} className="mb-5">
                  <h2 className="h4 text-primary mb-3 d-flex align-items-center">
                    {source} Results
                    <span className="ms-2 badge bg-primary bg-opacity-25 text-primary">{results[source].length}</span>
                  </h2>
                  <div className="row g-3">
                    {getFilteredSorted(results[source]).map((r, idx) => (
                      <div key={idx} className="col-md-6">
                        <div className="card shadow-sm h-100">
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex align-items-center mb-2">
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-none text-dark flex-grow-1">{r.title}</a>
                              <button onClick={() => handleCopy(r.url)} className="btn btn-sm btn-outline-secondary ms-2" title="Copy Link"><FaCopy /></button>
                              <button onClick={() => handleView(r.url)} className="btn btn-sm btn-outline-success ms-2" title="View"><FaExternalLinkAlt /></button>
                              <button onClick={() => handleFavorite(r)} className="btn btn-sm btn-outline-warning ms-2" title="Save to Favorites"><FaStar /></button>
                            </div>
                            <div className="text-secondary small">{highlight(r.snippet)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </>
        )}
      </main>
      <footer className="bg-white shadow p-4 text-center text-muted mt-auto">
        Smart Unified Search &copy; {new Date().getFullYear()} | Built with Flask, React, Bootstrap
      </footer>
    </div>
  );
}

export default App;
