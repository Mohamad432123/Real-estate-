import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SplineBackground from "../components/SplineBackground";
import "./Auth.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // "success" or "error"
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");
        setIsLoading(true);
        
        try {
            const response = await fetch("/front_to_back_sender.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "login",
                    email: email,
                    password: password
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === "success") {
                setMessageType("success");
                setMessage("Login successful! Redirecting to search page...");
                
                // Store user data in localStorage
                localStorage.setItem("user", JSON.stringify(data.user));
                
                // Redirect to search page after a short delay
                setTimeout(() => navigate("/search"), 1500);
            } else {
                setMessageType("error");
                
                // Provide specific error messages based on the server response
                if (data.message && data.message.includes("Invalid credentials")) {
                    setMessage("Invalid email or password. Please try again.");
                } else if (data.message && data.message.includes("not found")) {
                    setMessage("Email not registered. Please check your email or sign up for an account.");
                } else {
                    setMessage(data.message || "Login failed. Please try again.");
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            setMessageType("error");
            
            if (error.name === "TypeError" && error.message.includes("NetworkError")) {
                setMessage("Network error. Please check your connection and try again.");
            } else if (error.name === "SyntaxError") {
                setMessage("Server returned invalid data. Please try again later.");
            } else {
                setMessage(`Error: ${error.message || "Something went wrong. Please try again."}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <SplineBackground 
                sceneUrl="https://prod.spline.design/AlMO0fHr7OoFL8Pz/scene.splinecode"
            />
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    disabled={isLoading}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                </button>
            </form>
            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}
            <div className="auth-links">
                <p>
                    Don't have an account? <a href="/signup">Sign Up</a>
                </p>
                <p>
                    <a href="/forgot-password">Forgot Password?</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
