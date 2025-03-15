import { Trash2, PlusCircle } from "lucide-react";
import { usePlayer } from "../../contexts/PlayerContext";
import { useState } from "react";

const SideBar = () => {
  const {
    playlists,
    setplaylists,
    activeTab,
    setActiveTab,
    nowPlaying,
    setNowPlaying,
  } = usePlayer();
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  //deleting a playlist
  const Delete_playlist = (playlistName) => {
    if (
      !window.confirm(
        `Are you sure want to delete the "${playlistName}" playlist?`
      )
    )
      return;

    setplaylists((prev) => {
      const newPlaylists = Object.fromEntries(
        Object.entries(prev).filter(([key]) => key !== playlistName)
      );

      return newPlaylists;
    });

    if (activeTab === playlistName) setActiveTab("all");
  };

  // creating a new playlist
  const createNewPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    setplaylists((prevPlaylists) => ({
      ...prevPlaylists,
      [newPlaylistName]: [],
    }));
    setNewPlaylistName("");
    setShowAddPlaylist(false);
  };

  return (
    <div className="w-64 bg-gray-100 p-4 border-r border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Music Library</h2>

      <nav className="space-y-2">
        {/* Existing buttons */}
        {nowPlaying && (
          <button
            onClick={() => setActiveTab("nowPlaying")}
            className={`w-full text-left p-2 rounded transition-colors ${
              activeTab === "nowPlaying"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            Now Playing
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab("all");
            // setNowPlaying(false);
          }}
          className={`w-full text-left p-2 rounded transition-colors ${
            activeTab === "all" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
          }`}
        >
          All Songs
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`w-full text-left p-2 rounded transition-colors ${
            activeTab === "add" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
          }`}
        >
          Add Songs
        </button>

        {/* Dynamic Playlist Buttons */}
        {[...new Set(Object.keys(playlists))].map((playlistName, index) => (
          <div
            key={`${playlistName}-${index}`}
            className="group flex items-center justify-between hover:bg-gray-200 rounded"
          >
            <button
              key={`${playlistName}-${index}`}
              onClick={() => setActiveTab(playlistName)}
              className={`w-full text-left p-2 rounded transition-colors ${
                activeTab === playlistName
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-200"
              }`}
            >
              {playlistName}
            </button>
            <button
              key={playlistName}
              className="p-2 mr-2 rounded-full hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                Delete_playlist(playlistName);
              }}
            >
              <Trash2 className="w-4 h-4"></Trash2>
            </button>
          </div>
        ))}

        {/* Add Playlist Button */}
        {showAddPlaylist ? (
          <div className="mt-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full p-2 border rounded"
              onKeyDown={(e) => e.key === "Enter" && createNewPlaylist()}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={createNewPlaylist}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddPlaylist(false)}
                className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddPlaylist(true)}
            className="w-full text-left p-2 rounded hover:bg-gray-200 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Create New Playlist
          </button>
        )}
      </nav>
    </div>
  );
};

export default SideBar;
