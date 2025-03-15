// import logo from "./logo.svg";
import "./App.css";
import Auth from "./auth/auth";
import Appbar from "./components/appbar";
import MusicPlayer from "./components/MusicPlayer";
import EmailConfirmation from "./auth/emailconfirmation";
import ProtectedRoute from "./auth/protectedroute";
import {
  BrowserRouter as Router,
  Route,
  Navigate,
  Routes,
  Switch,
} from "react-router-dom";
import { PlayerProvider } from "./contexts/PlayerContext";
// import TailwindTest from "./components/tailwind";
// import { Component } from "lucide-react";

function App() {
  return (
    <PlayerProvider>
      <Router>
        <Appbar />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Auth isLogin={true} />} />
          <Route path="/register" element={<Auth isLogin={false} />} />
          <Route path="/confirm/:token" element={<EmailConfirmation />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MusicPlayer />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </PlayerProvider>
  );
}

export default App;
