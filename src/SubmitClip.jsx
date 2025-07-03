import React, { useState } from "react";
import { useParams } from "react-router-dom";

const SHEETDB_API = "https://sheetdb.io/api/v1/9hy4d2xvwsarl";

const campaigns = [
  {
    id: 1,
    title: "Zeus Shortform Campaign",
  },
  {
    id: 2,
    title: "Central Cee 'Guilt Trippin' Audio...",
  },
];

export default function SubmitClip() {
  const { id } = useParams();
  const campaign = campaigns.find(c => c.id === Number(id));
  const [form, setForm] = useState({ discord: "", video: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const res = await fetch(SHEETDB_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            "Campaign title": campaign ? campaign.title : "",
            "Discord username": form.discord,
            "Video URL": form.video
          }
        })
      });
      if (res.ok) {
        setStatus("Submitted successfully!");
        setForm({ discord: "", video: "" });
      } else {
        setStatus("Submission failed. Try again.");
      }
    } catch {
      setStatus("Network error. Try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      minWidth: "100vw",
      width: "100vw",
      height: "100vh",
      background: "#181b1f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#23272f",
          padding: "2.5rem 2.5rem",
          borderRadius: "24px",
          boxShadow: "0 2px 16px #0006",
          width: "100%",
          maxWidth: "480px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "2rem", fontWeight: 700, fontSize: "2rem", letterSpacing: 1 }}>
          Join the Campaign
        </h2>
        {campaign && (
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24, color: "#a6e22e" }}>{campaign.title}</div>
        )}
        <div style={{ marginBottom: "1.5rem", width: "100%" }}>
          <label>Discord Username <span style={{ color: "#a6e22e" }}>*</span></label>
          <input
            name="discord"
            value={form.discord}
            onChange={handleChange}
            required
            placeholder="@yourdiscord"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #333",
              background: "#181b1f",
              color: "#fff",
              marginTop: "0.25rem"
            }}
          />
        </div>
        <div style={{ marginBottom: "1.5rem", width: "100%" }}>
          <label>Video URL <span style={{ color: "#a6e22e" }}>*</span></label>
          <input
            name="video"
            value={form.video}
            onChange={handleChange}
            required
            placeholder="https://www.instagram.com/reel/..."
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
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
            padding: "0.9rem",
            background: "#181b1f",
            color: "#a6e22e",
            border: "2px solid #a6e22e",
            borderRadius: "16px",
            fontWeight: "bold",
            fontSize: "1.1rem",
            cursor: "pointer",
            marginTop: "1rem"
          }}
        >
          Submit
        </button>
        <div style={{ marginTop: "1.5rem", textAlign: "center", color: "#a6e22e" }}>
          {status}
        </div>
      </form>
    </div>
  );
} 