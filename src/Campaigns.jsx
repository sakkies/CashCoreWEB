import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const campaigns = [
  {
    id: 1,
    title: "Zeus Shortform Campaign",
    creator: "PromoteFun",
    rate: 1.5,
    pool: 10000,
    platforms: ["tiktok", "instagram", "twitter"],
    image: "https://i.imgur.com/1Q9Z1Zm.png", // Placeholder image
  },
  {
    id: 2,
    title: "Central Cee 'Guilt Trippin' Audio...",
    creator: "PromoteFun",
    rate: 0.2,
    pool: 2500,
    platforms: ["tiktok", "instagram"],
    image: "https://i.imgur.com/2yaf2wb.png", // Placeholder image
  },
];

const platformIcons = {
  tiktok: "🎵",
  instagram: "📸",
  twitter: "🐦",
};

export default function Campaigns() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100vh",
      background: "#181b1f",
      padding: "2rem",
      display: "flex",
      flexWrap: "wrap",
      gap: "2rem",
      justifyContent: "center",
      alignItems: "center",
      width: "100vw",
      boxSizing: "border-box"
    }}>
      {campaigns.map((c) => (
        <div
          key={c.id}
          onClick={() => {
            setSelected(c.id);
            navigate(`/campaigns/${c.id}/submit`);
          }}
          style={{
            background: "#23272f",
            borderRadius: "18px",
            boxShadow: selected === c.id ? "0 0 0 3px #a6e22e" : "0 2px 16px #0006",
            width: 320,
            cursor: "pointer",
            border: selected === c.id ? "2px solid #a6e22e" : "2px solid transparent",
            overflow: "hidden",
            transition: "box-shadow 0.2s, border 0.2s"
          }}
        >
          <img src={c.image} alt={c.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
          <div style={{ padding: "1.2rem" }}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Created by <span style={{ fontWeight: 600, color: "#fff" }}> <span role="img" aria-label="promo">🎉</span> {c.creator}</span>
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Rate per 1000 Views <span style={{ color: "#a6e22e", fontWeight: 600 }}><span role="img" aria-label="coin">🪙</span> {c.rate}</span>
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Accepted Platforms <span>{c.platforms.map(p => <span key={p} style={{ marginLeft: 6 }}>{platformIcons[p]}</span>)}</span>
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Pool <span style={{ color: "#a6e22e", fontWeight: 600 }}><span role="img" aria-label="coin">🪙</span> {c.pool}</span>
              <div style={{ background: "#333", borderRadius: 6, height: 8, marginTop: 4 }}>
                <div style={{ width: "60%", background: "#a6e22e", height: 8, borderRadius: 6 }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginTop: 2 }}>
                <span>0%</span><span>100%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 