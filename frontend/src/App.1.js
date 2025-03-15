import Auth from "./auth/auth";
import Appbar from "./components/appbar";

// import TailwindTest from "./components/tailwind";
// import { Component } from "lucide-react";
export function App() {
  return (
    <div className="App">
      <Appbar />
      <p>welcome to the music player</p>
      <Auth />
    </div>
  );
}
