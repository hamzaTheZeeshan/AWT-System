import Login from "./pages/Login/Login";
import Register from "./pages/Login/Register";
import CreateDonation from "./pages/Donation/CreateDonation";
import HomePage from "./pages/Home/HomePage";
import { Route, Routes } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create-donation" element={<CreateDonation />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/contact" element={<Login />} />
    </Routes>
  );
};

export default App;