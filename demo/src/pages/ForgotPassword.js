import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");
    
    try {
      const response = await fetch("/front_to_back_sender.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          action: "forgotPassword",
          email 
        })
      });

      const data = await response.json();

      if (response.ok || data.status === "success") {
        setMessageType("success");
        setMessage("Reset link sent! Please check your email and follow the instructions.");
        setEmail(""); // Clear the email field
      } else {
        setMessageType("error");
        
        // Handle specific error cases
        if (data.message && data.message.includes("not found")) {
          setMessage("Email not found. Please check your email or sign up for an account.");
        } else if (data.message && data.message.includes("try again")) {
          setMessage("Too many requests. Please try again later.");
        } else {
          setMessage(`Error: ${data.message || "Could not send reset link"}`);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessageType("error");
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Forgot Password</h2>
      <p>Enter your email to receive a password reset link.</p>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          name="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
      
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: "20px" }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;