import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import "./LandingPage.css";
import backgroundImage from "../background-island.png";

const LandingPage = () => {
  const navigate = useNavigate();
  
  const containerStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
  
  function onLoad(spline) {
    // Map of object IDs to their corresponding routes
    const objectRoutes = {
      // Signup buttons
      "c1ad8f9e-23b9-4089-b3f7-b3aed354be4e": "/signup", // black
      "0a61c546-a417-44fe-a34d-0b697f559728": "/signup", // white
      
      // Login buttons
      "b3bbb600-8800-4a7f-b22c-ec26ebd7b0af": "/login", // black
      "cff611a9-15ec-4dd7-adfd-b4a927c81a6a": "/login"  // white
    };
    
    // Set up event listeners for all objects
    Object.entries(objectRoutes).forEach(([objectId, route]) => {
      const object = spline.findObjectById(objectId);
      if (object) {
        object.addEventListener("mouseDown", () => {
          navigate(route);
        });
      }
    });
  }

  return (
    <div className="landing-container" style={containerStyle}>
      <Spline 
        scene="https://prod.spline.design/a3s6JFRdqNflq43Y/scene.splinecode"
        onLoad={onLoad}
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