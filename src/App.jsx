import React, { useState } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import Campaigns from "./Campaigns";
import SubmitClip from "./SubmitClip";
import AdminPanel from "./AdminPanel";

const SHEETDB_API = "https://sheetdb.io/api/v1/9hy4d2xvwsarl";

function HomeLogo() {
  return (
    <div style={{ position: "fixed", top: 24, left: 24, zIndex: 2000 }}>
      <Link to="/">
        <img src="/file_000000002244622f9df0eb2204648ef9-removebg-preview.png" alt="Home" style={{ height: 90, cursor: "pointer", boxShadow: "none", border: "none", background: "none" }} />
      </Link>
    </div>
  );
}

function AnimatedSidebar() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      width: 100,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      background: "none"
    }}>
      <style>{`
        .animated-logo {
          margin: 28px 0;
          animation: upDown 1.8s ease-in-out infinite alternate;
          transition: transform 0.2s;
        }
        .animated-logo:hover {
          transform: scale(1.15);
        }
        .animated-logo:nth-child(2) { animation-delay: 0.3s; }
        .animated-logo:nth-child(3) { animation-delay: 0.6s; }
        @keyframes upDown {
          0% { transform: translateY(0); }
          100% { transform: translateY(28px); }
        }
      `}</style>
      <a href="https://www.youtube.com/@sakkies" target="_blank" rel="noopener noreferrer">
        <img src="/png-transparent-youtube-logo-youtube-logo-social-media-social-media-logo-communication-3d-icon-thumbnail-removebg-preview.png" alt="YouTube" className="animated-logo" style={{ width: 64, height: 64 }} />
      </a>
      <a href="https://www.tiktok.com/@sakkies_b" target="_blank" rel="noopener noreferrer">
        <img src="/png-transparent-tiktok-logo-tiktok-logo-social-media-social-media-logo-communication-3d-icon-thumbnail-removebg-preview.png" alt="TikTok" className="animated-logo" style={{ width: 64, height: 64 }} />
      </a>
      <a href="https://www.instagram.com/cash.core8/" target="_blank" rel="noopener noreferrer">
        <img src="/png-transparent-instagram-instagram-logo-3d-instagram-logo-social-media-logo-application-3d-icon-thumbnail-removebg-preview.png" alt="Instagram" className="animated-logo" style={{ width: 64, height: 64 }} />
      </a>
    </div>
  );
}

function AuthPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ user: "", password: "" });
  const [status, setStatus] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();

  // Handle input changes for both forms
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  // Sign Up logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const res = await fetch(SHEETDB_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form }),
      });
      if (res.ok) {
        setStatus("Sign up successful!");
        setForm({ username: "", email: "", password: "" });
      } else {
        setStatus("Sign up failed. Try again.");
      }
    } catch {
      setStatus("Network error. Try again.");
    }
  };

  // Login logic
  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("Logging in...");
    try {
      const res = await fetch(SHEETDB_API);
      const users = await res.json();
      const found = users.find(
        (u) =>
          (u.username === loginForm.user || u.email === loginForm.user) &&
          u.password === loginForm.password
      );
      if (found) {
        setStatus("Login successful!");
        setTimeout(() => navigate("/campaigns"), 700);
      } else {
        setStatus("Invalid credentials.");
      }
    } catch {
      setStatus("Network error. Try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "#181b1f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <form
        onSubmit={isLogin ? handleLogin : handleSubmit}
        style={{
          background: "transparent",
          padding: "2rem 2.5rem",
          borderRadius: "16px",
          boxShadow: "0 2px 16px #0006",
          width: "100%",
          maxWidth: "350px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1rem", fontWeight: 700, fontSize: "2rem", letterSpacing: 1 }}>
          {isLogin ? "Login" : "Sign Up"}
        </h2>
        {isLogin ? (
          <>
            <div style={{ marginBottom: "1rem", width: "100%" }}>
              <label>Username or Email</label>
              <input
                name="user"
                value={loginForm.user}
                onChange={handleLoginChange}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#181b1f",
                  color: "#fff",
                  marginTop: "0.25rem"
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem", width: "100%" }}>
              <label>Password</label>
              <input
                name="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#181b1f",
                  color: "#fff",
                  marginTop: "0.25rem"
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#ff3b3b",
                color: "#23272f",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Login
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "1rem", width: "100%" }}>
              <label>Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#181b1f",
                  color: "#fff",
                  marginTop: "0.25rem"
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem", width: "100%" }}>
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#181b1f",
                  color: "#fff",
                  marginTop: "0.25rem"
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem", width: "100%" }}>
              <label>Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#181b1f",
                  color: "#fff",
                  marginTop: "0.25rem"
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#ff3b3b",
                color: "#23272f",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Sign Up
            </button>
          </>
        )}
        <div style={{ marginTop: "1rem", textAlign: "center", color: "#ff3b3b" }}>
          {status}
        </div>
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link to="/admin" style={{ color: "#ff3b3b", textDecoration: "underline", fontWeight: 600 }}>
            If you're admin, login here
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLogin((v) => !v);
            setStatus("");
          }}
          style={{
            marginTop: "1.5rem",
            background: "none",
            color: "#ff3b3b",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AnimatedSidebar />
      <HomeLogo />
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id/submit" element={<SubmitClip />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}
