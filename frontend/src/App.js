// import logo from "./logo.svg";
import "./App.css";
import Appbar from "./components/appbar";
import MusicPlayer from "./components/MusicPlayer";
// import TailwindTest from "./components/tailwind";
// import { Component } from "lucide-react";

function App() {
  return (
    <div className="App">
      <Appbar />
      <p>welcome to the music player</p>
      <MusicPlayer />
    </div>
  );
}

export default App;
