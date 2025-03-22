import { useState, useEffect, useCallback, useRef } from "react";
import { usePlayer } from "../contexts/PlayerContext";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const useSongs = () => {
  const {
    setSongs,
    setCurrentSong,
    currentSong,
    audioRef,
    songs,
    currentUser,
    setNowPlaying,
    setIsSongSelected,
    setCurrentSongIndex,
    setCurrentPlaylist,
  } = usePlayer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const HassongsFetched = useRef(null);

  const FetchSongs = useCallback(async () => {
    if (HassongsFetched.current) return;

    HassongsFetched.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log(currentUser.token);
      const response = await axios.get(`${API_URL}/songs`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });
      if (response.status >= 300 && response.status < 400) {
        throw new Error("Authentication required");
      }
      const contentType = response.headers["content-type"];
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }
      // const response = await fetch("http://localhost:5000/songs");

      console.log("TOTAL NO OF SONGS:", response.data.length); // Debugging
      setSongs(response.data);
    } catch (error) {
      console.log("Error fetching songs", error);
    } finally {
      setLoading(false);
    }
  }, [setSongs]);

  const DeleteSong = useCallback(
    async (song_id) => {
      if (!window.confirm("Are you sure you want to delete this song?")) {
        return;
      }

      // setisDeleting(true);

      try {
        const response = await axios.delete(
          `http://localhost:5000/delete/${song_id}`,
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
            },
          }
        );

        if (response.status === 200) {
          console.log("Deleted successfully from server");
          if (currentSong?.id === song_id) {
            audioRef.current.pause();
            // setIsPlaying(false);
            setCurrentSong(null);
          }
          setSongs(songs.filter((song) => song.id !== song_id));
          console.log("Deleted successfully");
        } else {
          alert("Error deleting song");
        }
      } catch (error) {
        console.log("Error deleting song:", error);
      }
    },
    [setSongs]
  );

  const PlaySong = (songList, song) => {
    console.log("Playing song:", song); // Debugging
    const songIndex = songList.findIndex((s) => s.filename === song.filename);
    setCurrentPlaylist(songList); // Set current playlist
    setCurrentSongIndex(songIndex);
    setIsSongSelected(true);
    setNowPlaying(true);
    setCurrentSong(song);
  };

  useEffect(() => {
    FetchSongs();
  }, []);

  return {
    loading,
    error,
    FetchSongs,
    DeleteSong,
    PlaySong,
  };
};

export default useSongs;
