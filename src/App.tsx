import { Route, Routes, Link } from "react-router";
import { SignIn, SignUp } from "@clerk/react-router";
import { AppLayout } from "./layouts/AppLayout";
import { Home } from "./pages/Home";
import { Matches } from "./pages/Matches";
import { Journal } from "./pages/Journal";
import { Stats } from "./pages/Stats";
import { Profile } from "./pages/Profile";
import { Activity } from "./pages/Activity";
import { Decouverte } from "./pages/Decouverte";
import { PublicProfile } from "./pages/PublicProfile";
import { MentionsLegales } from "./pages/legal/MentionsLegales";
import { CGU } from "./pages/legal/CGU";
import { PolitiqueConfidentialite } from "./pages/legal/PolitiqueConfidentialite";
import { NotFound } from "./pages/NotFound";
import { Admin } from "./pages/Admin";

function AuthLegalLinks() {
  return (
    <p className="text-gris-fonce text-[11.5px] text-center max-w-[320px]">
      En continuant, tu acceptes les{" "}
      <Link to="/cgu" className="text-projecteur">
        CGU
      </Link>{" "}
      et la{" "}
      <Link to="/confidentialite" className="text-projecteur">
        politique de confidentialité
      </Link>{" "}
      d'Eleven Logs.
    </p>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/matchs" element={<Matches />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/stats" element={<Stats />} />
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
          <div className="min-h-screen flex flex-col items-center justify-center bg-noir px-5 gap-5">
            <SignIn routing="path" path="/connexion" signUpUrl="/inscription" />
            <AuthLegalLinks />
          </div>
        }
      />
      <Route
        path="/inscription/*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-noir px-5 gap-5">
            <SignUp routing="path" path="/inscription" signInUrl="/connexion" />
            <AuthLegalLinks />
          </div>
        }
      />
    </Routes>
  );
}
