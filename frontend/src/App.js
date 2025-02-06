import logo from './logo.svg';
import './App.css';
import Appbar from './components/appbar';
import MusicPlayer from './components/music_player';
import TailwindTest from './components/tailwind';
function App() {
  return (
    
    <div className="App">
      <Appbar/>
      <p>
      welcome to the music player
      </p>
      <MusicPlayer/>
    </div>
  );
}

export default App;
