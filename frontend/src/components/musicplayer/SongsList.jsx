import { MoreVertical, Trash2, PlusCircle } from "lucide-react";
import { usePlayer } from "../../contexts/PlayerContext";
import SongItem from "./SongItem";
import { useState } from "react";
import useSongs from "../../hooks/UseSongs";

const SongList = () => {
  const { loading, error, FetchSongs } = useSongs();
  const { songs, playlists, setplaylists, activeTab } = usePlayer();
  const [contextMenu, setcontextMenu] = useState(null);

  const GetplaylistSongs = () => {
    // console.log("hi there", playlists, activeTab, songs);

    if (playlists && playlists[activeTab]) {
      // console.log("checking", playlists, playlists[activeTab]);
      return playlists[activeTab];
    }
    // If activeTab is 'all', return all songs
    return songs;
  };
  const songToDisplay = GetplaylistSongs();

  const addToPlaylist = (playlistName, song) => {
    setplaylists((prevPlaylists) => {
      // Ensure the playlist exists and is an array

      const currentPlaylist = Array.isArray(prevPlaylists[playlistName])
        ? prevPlaylists[playlistName]
        : [];

      // Check if the song already exists in the playlist
      const isSongInPlaylist = currentPlaylist.some(
        (s) => s.filename === song.filename
      );

      if (isSongInPlaylist) {
        alert("Song already exists in the playlist!");
        return prevPlaylists; // Return unchanged state
      }

      // Update the playlist
      return {
        ...prevPlaylists,
        [playlistName]: [...currentPlaylist, song],
      };
    });
  };

  return (
    <div className="bg-gray-100 rounded-lg shadow-md">
      {songToDisplay?.map((song) => (
        <SongItem
          key={song.filename}
          song={song}
          // onDelete={onDelete}
          onAddToPlaylist={addToPlaylist}
          playlists={playlists}
          songList={songToDisplay}
        ></SongItem>
      ))}
    </div>
  );
};

export default SongList;
