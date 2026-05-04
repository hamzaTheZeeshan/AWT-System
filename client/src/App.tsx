import Login from "./pages/Login/Login";
import Register from "./pages/Login/Register";
import CreateDonation from "./pages/Donation/CreateDonation";
import HomePage from "./pages/Home/HomePage";
import { Route, Routes } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import AdminControl from "./pages/AdminControls/AdminControl";
import AboutPage from "./pages/AboutUs/AboutPage";
import ContactPage from "./pages/ContactUs/ContactPage";
import InternshipPage from "./pages/InternshipPage/InternshipPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create-donation" element={<CreateDonation />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/admin" element={<AdminControl />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/interns" element={<InternshipPage />} />
      <Route path="/contact" element={<ContactPage />} />
    </Routes>
  );
};

export default App;