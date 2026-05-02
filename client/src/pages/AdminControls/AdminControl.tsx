import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import UsersTable from "./UsersTable";
import DonationsTable from "./DonationsTable";
import Placeholder from "./Placeholder";
import "./global.css";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("users");

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UsersTable />;
      case "donations":
        return <DonationsTable />;
      case "campaigns":
        return (
          <Placeholder
            title="Campaigns"
            description="Campaign management coming soon."
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          />
        );
      case "settings":
        return (
          <Placeholder
            title="Settings"
            description="Admin settings coming soon."
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
              </svg>
            }
          />
        );
      default:
        return <UsersTable />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default App;
