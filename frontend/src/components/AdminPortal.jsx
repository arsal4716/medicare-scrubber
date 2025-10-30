import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState("uploads");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/admin/files/${activeTab}`);
      console.log("Fetched files:", res.data);  
      setFiles(res.data.files || []); 
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [activeTab]);

  const handleDownload = (filename) => {
    window.open(`/admin/download/${activeTab}/${filename}`, "_blank");
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await axios.delete(`/admin/delete/${activeTab}/${filename}`);
      fetchFiles();
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Admin File Portal</h2>

      <div className="d-flex justify-content-center mb-4">
        <button
          className={`btn btn-outline-primary me-2 ${activeTab === "uploads" ? "active" : ""}`}
          onClick={() => setActiveTab("uploads")}
        >
          Uploads
        </button>
        <button
          className={`btn btn-outline-success ${activeTab === "results" ? "active" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          Results
        </button>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : files.length === 0 ? (
        <p className="text-center text-muted">No files found in {activeTab}.</p>
      ) : (
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>File Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length > 0 ? (
              files.map((file, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{file}</td>
                  <td>
                    <button
                      onClick={() => handleDownload(file)}
                      className="btn btn-success btn-sm me-2"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  No files found in {activeTab}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPortal;
