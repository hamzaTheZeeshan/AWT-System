import React from "react";
import "./Placeholder.css";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title, description, icon }) => (
  <div className="placeholder-page">
    <div className="placeholder-icon">{icon}</div>
    <h2 className="placeholder-title">{title}</h2>
    <p className="placeholder-desc">{description}</p>
  </div>
);

export default Placeholder;
