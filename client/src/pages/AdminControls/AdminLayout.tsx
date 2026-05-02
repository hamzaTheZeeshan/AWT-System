import React, { useState } from "react";
import Sidebar from "./Sidebar";
import "./AdminLayout.css";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
