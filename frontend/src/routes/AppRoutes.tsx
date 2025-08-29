import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import HorseSelector from "../pages/HorseSelector";
import CreateAccount from "../pages/CreateAccount";
import Login from "../pages/Login";
import UserProfile from "../pages/UserProfile";

const AppRoutes = () => {
  return (
     <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/HorseSelector" element={<HorseSelector/>} />
      <Route path="/CreateAccount" element={<CreateAccount/>} />
      <Route path="/Login" element={<Login/>} />
      <Route path="/UserProfile/:userId" element={<UserProfile/>} />
    </Routes>
  )
}

export default AppRoutes