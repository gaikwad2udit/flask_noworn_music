import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  use,
} from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [songs, setSongs] = useState([]);
  // const [currentTime, setcurrentTime] = useState(0);
  const [playlists, setplaylists] = useState({
    Favourites: [],
    Recently_Played: [],
    My_Playlist: [],
  });

  useEffect(() => {
    // Check for existing user on app load

    const userData = localStorage.getItem("user");
    console.log("from client side", userData);
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const loginUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    console.log("from login user function", JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const logoutUser = () => {
    console.log("logged out");
    localStorage.removeItem("user");

    setCurrentUser(null);
  };
  //checking auth status evertime the app-appbar is loaded
  const checkAuth = async () => {
    const token = localStorage.getItem("user");
    console.log("from check auth", token);
    if (!token) {
      console.log("no token -> returning");
      setCurrentUser(null);
      return;
    }
    try {
      const userString = localStorage.getItem("user");
      const userObject = JSON.parse(userString);
      const token = userObject?.token;
      console.log(token);
      const response = await axios.get(`${API_URL}/checkauth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.log("remoing user cookies");
      localStorage.removeItem("user");
      setCurrentUser(null);
    }
  };

  const [currentUser, setCurrentUser] = useState(null);
  // all music player states
  const [currentSong, setCurrentSong] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [loopmode, setLoopmode] = useState("off");
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(false);
  const [isSongSelected, setIsSongSelected] = useState(false);

  const ContentValue = useMemo(
    () => ({
      audioRef,
      songs,
      setSongs,
      playlists,
      setplaylists,
      currentSong,
      setCurrentSong,
      activeTab,
      setActiveTab,
      currentSongIndex,
      setCurrentSongIndex,
      loopmode,
      setLoopmode,
      currentPlaylist,
      setCurrentPlaylist,
      currentUser,
      loginUser,
      logoutUser,
      checkAuth,
      nowPlaying,
      setNowPlaying,
      isSongSelected,
      setIsSongSelected,
    }),
    [songs, playlists, currentSong, activeTab, loopmode, currentUser]
  );
  return (
    <PlayerContext.Provider value={ContentValue}>
      {children}
      <audio ref={audioRef} />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
