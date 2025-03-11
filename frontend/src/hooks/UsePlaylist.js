import { useCallback } from "react";
import { usePlayer } from "../contexts/PlayerContext";

const UsePlaylist = () => {
  const { playlists, setplaylists } = usePlayer();

  const createNewPlaylist = useCallback(
    (name) => {
      if (!name.trim()) {
        throw new Error("Playlist name cannot be empty");
      }
      if (playlists[name]) {
        throw new Error("Playlist already exists");
      }

      // if (!newPlaylistName.trim()) return;

      setplaylists((prev) => ({
        ...prev,
        [name]: [],
      }));

      // setNewPlaylistName("");
      // setShowAddPlaylist(false);
    },
    [playlists, setplaylists]
  );

  const deletePlaylist = useCallback(
    (name) => {
      if (!playlists[name]) {
        throw new Error("Playlist does not exist");
      }

      setplaylists((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    },
    [playlists, setplaylists]
  );

  const addToPlaylist = useCallback(
    (playlistName, song) => {
      if (!playlists[playlistName]) {
        throw new Error("Playlist does not exist");
      }

      setplaylists((prev) => {
        const isDuplicate = prev[playlistName].some(
          (s) => s.filename === song.filename
        );

        if (isDuplicate) {
          throw new Error("Song already exists in playlist");
        }

        return {
          ...prev,
          [playlistName]: [...prev[playlistName], song],
        };
      });
    },
    [playlists, setplaylists]
  );

  const removeFromPlaylist = useCallback(
    (playlistName, song) => {
      if (!playlists[playlistName]) {
        throw new Error("Playlist does not exist");
      }

      // setplaylists((prev) => ({
      //   ...prev,
      //   [playlistName]: prev[playlistName].filter(
      //     (song) => song.filename !== songId
      //   ),
      // }));
      setplaylists((prevPlaylists) => {
        // Create a new array of songs excluding the deleted song
        const updatedPlaylist = prevPlaylists[playlistName].filter(
          (s) => s.filename !== song.filename
        );

        // Return updated playlists
        return {
          ...prevPlaylists,
          [playlistName]: updatedPlaylist,
        };
      });
    },
    [playlists, setplaylists]
  );

  const getPlaylistNames = useCallback(() => {
    return Object.keys(playlists);
  }, [playlists]);

  return {
    playlists,
    createNewPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylistNames,
  };
};

export default UsePlaylist;
