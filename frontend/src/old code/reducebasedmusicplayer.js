import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useReducer,
} from "react";

const PlayerContext = createContext();

const playerReducer = (state, action) => {
  switch (action.type) {
    case "SET_SONGS":
      return { ...state, songs: action.payload };
    case "SET_PLAYLISTS":
      return { ...state, playlists: action.payload };
    case "SET_CURRENT_SONG":
      return { ...state, currentSong: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
};

const initialState = {
  songs: [],
  playlists: {
    Favourites: [],
    Recently_Played: [],
    My_Playlist: [],
  },
  currentSong: null,
  activeTab: "all",
};

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [state, dispatch] = useReducer(playerReducer, initialState);
  // const [songs, setSongs] = useState([]);
  // // const [currentTime, setcurrentTime] = useState(0);
  // const [playlists, setplaylists] = useState({
  //   Favourites: [],
  //   Recently_Played: [],
  //   My_Playlist: [],
  // });
  // const [currentSong, setCurrentSong] = useState(null);
  // const [activeTab, setActiveTab] = useState("all");

  const ContentValue = useMemo(
    () => ({
      audioRef,
      songs: state.songs,
      setSongs: (songs) => dispatch({ type: "SET_SONGS", payload: songs }),
      playlists: state.playlists,
      setplaylists: (playlists) =>
        dispatch({ type: "SET_PLAYLISTS", payload: playlists }),
      currentSong: state.currentSong,
      setCurrentSong: (song) =>
        dispatch({ type: "SET_CURRENT_SONG", payload: song }),
      activeTab: state.activeTab,
      setActiveTab: (tab) => dispatch({ type: "SET_ACTIVE_TAB", payload: tab }),
    }),
    [state]
  );
  return (
    <PlayerContext.Provider value={ContentValue}>
      {children}

      <audio ref={audioRef} />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
