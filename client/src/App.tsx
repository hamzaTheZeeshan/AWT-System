import Login from "./pages/Login/Login";
import Register from "./pages/Login/Register";
import CreateDonation from "./pages/Donation/CreateDonation";
import MyDonations from "./pages/Donation/MyDonations";
import DonationCharts from "./pages/Donation/DonationCharts";

function App() {
  return (<> <Login />
    < Register />
    < CreateDonation />
    <MyDonations />
    <DonationCharts />
  </>);
}

export default App;