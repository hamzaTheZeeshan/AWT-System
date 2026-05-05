import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import UsersTable from "./UsersTable";
import DonationsTable from "./DonationsTable";
import Placeholder from "./Placeholder";
import "./global.css";
import ReceiversTable from "./ReceiversTable";
import Campaigns from "./Campaigns";
import OrphanagesTable from "./OrphanagesTable";
import InternManager from "../InternshipManager/InternManager";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("users");

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UsersTable />;
      case "donations":
        return <DonationsTable />;
      case "receivers":
        return <ReceiversTable />
      case "campaigns":
        return <Campaigns />
      case "orphanages":
        return <OrphanagesTable />
      case "internships":
        return <InternManager />
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
