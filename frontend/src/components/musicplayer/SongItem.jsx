import { Trash2, PlusCircle, MoreVertical } from "lucide-react";
import { useState, useRef, React, useEffect } from "react";
import { usePlayer } from "../../contexts/PlayerContext";
import UsePlaylist from "../../hooks/UsePlaylist";
import useSongs from "../../hooks/UseSongs";

const SongItem = ({ playlists, song, onDelete, songList }) => {
  const {
    setplaylists,
    currentSong,
    setCurrentSong,
    activeTab,
    setCurrentSongIndex,
    currentPlaylist,
    setCurrentPlaylist,
    setNowPlaying,
    isSongSelected,
    setIsSongSelected,
  } = usePlayer();
  const [contextMenu, setcontextMenu] = useState(null);
  const menuRef = useRef(null);
  const ButtonRef = useRef(null);
  const { addToPlaylist, removeFromPlaylist } = UsePlaylist();
  const { DeleteSong, PlaySong } = useSongs();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setcontextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu]);

  // const playSong = (song) => {
  //   console.log("Playing song:", song); // Debugging
  //   const songIndex = songList.findIndex((s) => s.filename === song.filename);
  //   setCurrentPlaylist(songList); // Set current playlist
  //   setCurrentSongIndex(songIndex);
  //   setIsSongSelected(true);
  //   setNowPlaying(true);
  //   setCurrentSong(song);
  // };

  return (
    <div
      className={`p-4 hover:bg-gray-500 cursor-pointer group flex justify-between items-center ${
        currentSong?.filename === song.filename
          ? "bg-blue-600 font-semibold text-gray"
          : ""
      }`}
      key={song.filename}
      onClick={() => PlaySong(songList, song)}
    >
      <div className="flex-grow truncate">
        {song.title} - {song.artist}
      </div>

      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setcontextMenu(
              contextMenu === song.filename ? null : song.filename
            );
          }}
          className="p-1 rounded-full hover:bg-gray-400/30 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {contextMenu === song.filename && (
          <div
            ref={menuRef}
            className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10"
          >
            <div className="py-1">
              {activeTab === "all" ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      DeleteSong(song.id);
                      setcontextMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                    Delete
                  </button>
                  {playlists &&
                    Object.entries(playlists).map(
                      ([playlistName, songs], index) => (
                        <button
                          key={`${playlistName}-${index}`}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(
                              "user has clicked to add songs to ",
                              playlistName
                            );
                            addToPlaylist(playlistName, song);
                            setcontextMenu(null);
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2 text-blue-500" />
                          Add to {playlistName}
                        </button>
                      )
                    )}
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlaylist(activeTab, song);
                    setcontextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                  Remove from {activeTab}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongItem;
