import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import HorseSelector from "../pages/HorseSelector";
import CreateAccount from "../pages/CreateAccount";
import Login from "../pages/Login";
import UserProfile from "../pages/UserProfile";
import TrainHorse from "../pages/TrainHorse";
import RaceTrackSelection from "../pages/RaceTrackSelection";
import RaceRun from "../pages/RaceRun";
import HorsesCatalogPage from "../pages/HorsesCatalogPage";
import SkillsCatalogPage from "../pages/SkillsCatalogPage";
import GuidePage from "../pages/GuidePage";
import NotFound from "../pages/NotFound";
import PageTransition from "../components/PageTransition/PageTransition";

const AppRoutes = () => {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Horses" element={<HorsesCatalogPage/>} />
        <Route path="/Skills" element={<SkillsCatalogPage/>} />
        <Route path="/Guide" element={<GuidePage/>} />
        <Route path="/HorseSelector" element={<HorseSelector/>} />
        <Route path="/CreateAccount" element={<CreateAccount/>} />
        <Route path="/Login" element={<Login/>} />
        <Route path="/UserProfile" element={<UserProfile/>} />
        <Route path="/HorseSelector/Career/:horseId" element={<TrainHorse/>} />
        <Route path="/Race/:horseId" element={<RaceTrackSelection/>} />
        <Route path="/Race/:horseId/:trackSlug" element={<RaceRun/>} />
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </PageTransition>
  )
}

export default AppRoutes
