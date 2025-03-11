import { useState, useEffect, useCallback, useRef } from "react";
import { usePlayer } from "../contexts/PlayerContext";

const useSongs = () => {
  const { setSongs, setCurrentSong, currentSong, audioRef, songs } =
    usePlayer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const HassongsFetched = useRef(null);

  const FetchSongs = useCallback(async () => {
    if (HassongsFetched.current) return;

    HassongsFetched.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/songs");
      const data = await response.json();
      console.log("TOTAL NO OF SONGS:", data.length); // Debugging
      setSongs(data);
    } catch (error) {
      console.log("Error fetching songs", error);
    } finally {
      setLoading(false);
    }
  }, [setSongs]);

  const DeleteSong = useCallback(
    async (filename) => {
      if (!window.confirm("Are you sure you want to delete this song?")) {
        return;
      }

      // setisDeleting(true);

      try {
        const response = await fetch(
          `http://localhost:5000/delete/${filename}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          if (currentSong?.filename === filename) {
            audioRef.current.pause();
            // setIsPlaying(false);
            setCurrentSong(null);
          }
          setSongs(songs.filter((song) => song.filename !== filename));
          console.log("Deleted successfully");
        } else {
          alert("Error deleting song");
        }
      } catch (error) {
        console.log("Error deleting song:", error);
      } finally {
        // setisDeleting(false);
        console.log("Song deleted successfully");
      }
    },
    [setSongs]
  );

  useEffect(() => {
    FetchSongs();
  }, []);

  return {
    loading,
    error,
    FetchSongs,
    DeleteSong,
  };
};

export default useSongs;
