import React, { useState, useEffect } from "react";

const SHEETDB_API = "https://sheetdb.io/api/v1/uhjtpu974j4te";
const ADMIN_PASSWORD = "admin123"; // Change this to a secure password

const platformsList = ["TikTok", "Instagram", "Twitter"];

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    title: "",
    budget: "",
    platforms: [],
    image: ""
  });
  const [campaigns, setCampaigns] = useState([]);
  const [status, setStatus] = useState("");

  // Fetch campaigns
  useEffect(() => {
    if (loggedIn) fetchCampaigns();
  }, [loggedIn]);

  const fetchCampaigns = async () => {
    const res = await fetch(SHEETDB_API);
    const data = await res.json();
    setCampaigns(data);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setStatus("");
    } else {
      setStatus("Incorrect password");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "platforms") {
      setForm((prev) => ({
        ...prev,
        platforms: checked
          ? [...prev.platforms, value]
          : prev.platforms.filter((p) => p !== value)
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    setStatus("Adding...");
    const res = await fetch(SHEETDB_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          "Campaign title": form.title,
          "Campaign budget": form.budget,
          "Supported platforms": form.platforms.join(", "),
          "Image URL": form.image
        }
      })
    });
    if (res.ok) {
      setStatus("Campaign added!");
      setForm({ title: "", budget: "", platforms: [], image: "" });
      fetchCampaigns();
    } else {
      setStatus("Failed to add campaign");
    }
  };

  const handleDelete = async (rowId) => {
    setStatus("Deleting...");
    await fetch(`${SHEETDB_API}/id/${rowId}`, { method: "DELETE" });
    setStatus("");
    fetchCampaigns();
  };

  if (!loggedIn) {
    return (
      <div style={{ minHeight: "100vh", minWidth: "100vw", width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#181b1f" }}>
        <form onSubmit={handleLogin} style={{ background: "#23272f", padding: 32, borderRadius: 16, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 320 }}>
          <h2 style={{ marginBottom: 16 }}>Admin Login</h2>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #333", width: 200, marginBottom: 16 }}
          />
          <button type="submit" style={{ padding: 10, borderRadius: 6, background: "#a6e22e", color: "#23272f", border: "none", fontWeight: 700, width: 200 }}>Login</button>
          <div style={{ color: "#a6e22e", marginTop: 12 }}>{status}</div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#181b1f", color: "#fff", padding: 32 }}>
      <h2 style={{ textAlign: "center", marginBottom: 32 }}>Admin Panel</h2>
      <form onSubmit={handleAddCampaign} style={{ background: "#23272f", padding: 24, borderRadius: 16, maxWidth: 400, margin: "0 auto 32px auto" }}>
        <h3>Add Campaign</h3>
        <div style={{ marginBottom: 12 }}>
          <label>Campaign title</label>
          <input name="title" value={form.title} onChange={handleChange} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #333", marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Campaign budget</label>
          <input name="budget" type="number" value={form.budget} onChange={handleChange} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #333", marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Supported platforms</label><br />
          {platformsList.map(p => (
            <label key={p} style={{ marginRight: 12 }}>
              <input type="checkbox" name="platforms" value={p} checked={form.platforms.includes(p)} onChange={handleChange} /> {p}
            </label>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Image URL</label>
          <input name="image" value={form.image} onChange={handleChange} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #333", marginTop: 4 }} />
        </div>
        <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 6, background: "#a6e22e", color: "#23272f", border: "none", fontWeight: 700 }}>Add Campaign</button>
        <div style={{ color: "#a6e22e", marginTop: 12 }}>{status}</div>
      </form>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h3>Existing Campaigns</h3>
        {campaigns.length === 0 && <div>No campaigns found.</div>}
        {campaigns.map((c, i) => (
          <div key={i} style={{ background: "#23272f", marginBottom: 12, padding: 16, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div><b>{c["Campaign title"]}</b></div>
              <div>Budget: {c["Campaign budget"]}</div>
              <div>Platforms: {c["Supported platforms"]}</div>
              <div><img src={c["Image URL"]} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, marginTop: 4 }} /></div>
            </div>
            <button onClick={() => handleDelete(c.id)} style={{ background: "#ff5555", color: "#fff", border: "none", borderRadius: 6, padding: 8, fontWeight: 700, cursor: "pointer" }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
} 