import React from "react";
import { Link } from "react-router-dom";
import SplineBackground from "../components/SplineBackground";
import "./LandingPage.css";
import backgroundImage from "../background-island.png";

const LandingPage = () => {
  const containerStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div className="landing-container" style={containerStyle}>
      <SplineBackground 
        sceneUrl="https://prod.spline.design/a3s6JFRdqNflq43Y/scene.splinecode"
      />
      {/* 
      <header className="landing-header">
        <h1>Investor IQ</h1>
        <p>Find, analyze, and save properties with ease.</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn">Sign Up</Link>
          <Link to="/login" className="btn btn-secondary">Log In</Link>
        </div>
      </header>
      */}
    </div>
  );
};

export default LandingPage;
