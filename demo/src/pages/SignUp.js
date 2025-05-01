import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SplineBackground from "../components/SplineBackground";
import "./Auth.css";

const SignUp = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // "success" or "error"
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

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
                    action: "signup",
                    name: name,
                    email: email,
                    password: password
                }),
            });

            const data = await response.json();
            
            if (data.status === "success") {
                setMessageType("success");
                setMessage("Registration successful! You can now log in to your account.");
                
                // Clear the form
                setName("");
                setEmail("");
                setPassword("");
                
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setMessageType("error");
                
                // Handle specific error messages
                if (data.message && data.message.includes("already exists")) {
                    setMessage("This email is already registered. Please use a different email or try logging in.");
                } else if (data.message && data.message.includes("Invalid email")) {
                    setMessage("Please enter a valid email address.");
                } else if (data.message && data.message.includes("Password")) {
                    setMessage("Password must be at least 8 characters long and include numbers and letters.");
                } else {
                    setMessage(`Registration failed: ${data.message || "Unknown error"}`);
                }
            }
        } catch (err) {
            console.error("Network error:", err);
            setMessageType("error");
            setMessage("Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <SplineBackground 
                sceneUrl="https://prod.spline.design/KFDZ6CKKnsor93Y6/scene.splinecode"
            />
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength="8"
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Sign Up"}
                </button>
            </form>
            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default SignUp;
