import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import FileUpload from "./components/FileUpload";
import AdminPortal from "./components/AdminPortal";
import Login from "./components/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAdminAuthenticated") === "true"
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(
        localStorage.getItem("isAdminAuthenticated") === "true"
      );
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Router>
      <div className="container py-3">
        <Routes>
          <Route path="/upload" element={<FileUpload />} />
          <Route
            path="/admin"
            element={
              isAuthenticated ? <AdminPortal /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="*" element={<FileUpload />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
