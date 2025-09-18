import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import HorseSelector from "../pages/HorseSelector";
import CreateAccount from "../pages/CreateAccount";
import Login from "../pages/Login";
import UserProfile from "../pages/UserProfile";
import TrainHorse from "../pages/TrainHorse";

const AppRoutes = () => {
  return (
     <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/HorseSelector" element={<HorseSelector/>} />
      <Route path="/CreateAccount" element={<CreateAccount/>} />
      <Route path="/Login" element={<Login/>} />
      <Route path="/UserProfile/:userId" element={<UserProfile/>} />
      <Route path="/HorseSelector/Career/:horseId" element={<TrainHorse/>} />
    </Routes>
  )
}

export default AppRoutes