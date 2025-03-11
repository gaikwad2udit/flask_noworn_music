import { createContext, useContext, useMemo, useRef, useState } from "react";

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
  const [currentSong, setCurrentSong] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [loopmode, setLoopmode] = useState("off");
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
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
    }),
    [songs, playlists, currentSong, activeTab, loopmode]
  );
  return (
    <PlayerContext.Provider value={ContentValue}>
      {children}
      <audio ref={audioRef} />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
