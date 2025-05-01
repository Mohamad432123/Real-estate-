import React from "react";
import { useNavigate } from "react-router-dom";
import SplineBackground from "../components/SplineBackground";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate("/search");
  };

  const handleMarketStats = () => {
    navigate("/market-statistics");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleLogout = () => {
    // Clear user session/localStorage
    localStorage.removeItem("user");
    // Redirect to landing page
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-taskbar">
        <button onClick={handleSearch}>Search</button>
        <button onClick={handleMarketStats}>Market Statistics</button>
        <button onClick={handleProfile}>Profile</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="dashboard-content">
        <SplineBackground 
          sceneUrl="https://prod.spline.design/fGBql0rKC4FbKSAq/scene.splinecode"
          className="dashboard-spline"
        />
        <div className="saved-properties-container">
          <h2>Saved Properties</h2>
          <p>Your saved properties will appear here.</p>
          {/* Container for saved properties that will be loaded later */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
