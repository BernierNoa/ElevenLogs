import { Route, Routes } from "react-router";
import { AppLayout } from "./layouts/AppLayout";
import { Home } from "./pages/Home";
import { Matches } from "./pages/Matches";
import { Journal } from "./pages/Journal";
import { Stats } from "./pages/Stats";
import { Badges } from "./pages/Badges";
import { Profile } from "./pages/Profile";
import { Activity } from "./pages/Activity";
import { Decouverte } from "./pages/Decouverte";
import { PublicProfile } from "./pages/PublicProfile";
import { MentionsLegales } from "./pages/legal/MentionsLegales";
import { CGU } from "./pages/legal/CGU";
import { PolitiqueConfidentialite } from "./pages/legal/PolitiqueConfidentialite";
import { NotFound } from "./pages/NotFound";
import { Admin } from "./pages/Admin";
import { SignUpPage } from "./pages/SignUp";
import { Connexion } from "./pages/Connexion";
import { QuickLog } from "./pages/QuickLog";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/matchs" element={<Matches />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/profil/*" element={<Profile />} />
        <Route path="/activite" element={<Activity />} />
        <Route path="/decouverte" element={<Decouverte />} />
        <Route path="/u/:userId" element={<PublicProfile />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/connexion/*"
        element={
          <Connexion />
        }
      />
      <Route
        path="/inscription/*"
        element={
          <SignUpPage />
        }
      />

      {/* Hors AppLayout (pas de Sidebar/TabBar/Footer) : conçue pour être
          ouverte dans une petite fenêtre popup depuis l'extension
          navigateur, cf. extension/background.js. */}
      <Route path="/rapide" element={<QuickLog />} />
    </Routes>
  );
}
