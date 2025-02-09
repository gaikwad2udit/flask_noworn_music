import { RenderSongsList } from "./renderSongsList";
import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Trash2,
  PlusCircle,
  MoreVertical,
} from "lucide-react";
import useClickOutside from "../hooks/contextmenu";

const MusicPlayer = () => {
  const menuRef = useRef(null);
  const audioRef = useRef(null);
  const [songs, setSongs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [duration, setduration] = useState(0);
  const [currentTime, setcurrentTime] = useState(0);

  //for layout navigation bar
  const [activeTab, setActiveTab] = useState("all");
  //adding state for upload status
  const [isuploading, setisuploading] = useState(false);
  const [uploaderror, setuploaderorror] = useState(null);
  const [isDeleting, setisDeleting] = useState(false);
  //Playlist state
  const [playlists, setplaylists] = useState({
    Favourites: [],
    Recently_Played: [],
    My_Playlist: [],
  });

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);

  //context menu state
  const [contextMenu, setcontextMenu] = useState(null);

  // menu context handler
  useClickOutside(menuRef, () => {
    setcontextMenu(null);
  });

  //Deleting a playlist
  const Delete_playlist = (playlistName) => {
    if (
      !window.confirm(
        `Are you sure want to delete the "${playlistName}" playlist?`
      )
    )
      return;

    setplaylists((prev) => {
      const newplaylist = { ...prev };
      delete newplaylist[playlistName];
      return newplaylist;
    });
    if (activeTab === playlistName) setActiveTab("all");
  };

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

  const createNewPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    setplaylists((prevPlaylists) => ({
      ...prevPlaylists,
      [newPlaylistName]: [],
    }));
    setNewPlaylistName("");
    setShowAddPlaylist(false);
  };

  const Delete_song = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this song?")) {
      return;
    }

    setisDeleting(true);

    try {
      const response = await fetch(`http://localhost:5000/delete/${filename}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (currentSong?.filename === filename) {
          audioRef.current.pause();
          setIsPlaying(false);
          setCurrentSong(null);
        }
        setSongs(songs.filter((song) => song.filename !== filename));
      } else {
        alert("Error deleting song");
      }
    } catch (error) {
      console.log("Error deleting song:", error);
    } finally {
      setisDeleting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files) {
      console.log("error selecting file");
      return;
    }

    setisuploading(true);
    setuploaderorror(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error uploading files");
      }

      const result = await response.json();
      setSongs(result.songs);
    } catch (error) {
      setuploaderorror(error.message);
    } finally {
      setisuploading(false);
    }
  };

  useEffect(() => {
    console.log("fetching songs");
    const fetchsongs = async () => {
      try {
        const response = await fetch("http://localhost:5000/songs");
        const data = await response.json();
        console.log("TOTAL NO OF SONGS:", data.length); // Debugging
        setSongs(data);
      } catch (error) {
        console.log("Error fetching songs", error);
      }
    };
    fetchsongs();
  }, []);

  useEffect(() => {
    if (currentSong) {
      try {
        const audioSrc = `http://localhost:5000/play/${currentSong.filename}`;
        console.log("Setting audio source:", audioSrc); // Debugging
        audioRef.current.src = audioSrc;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Error playing song:", error);
          });
      } catch (error) {
        console.error("Error in playSong:", error);
      }
    }
  }, [currentSong]);

  //UDPATE THE DUARATION AND CURRENT TIME
  useEffect(() => {
    const audio = audioRef.current;
    const updateDuration = () => {
      setduration(audio.duration);
    };

    const updateTime = () => {
      setcurrentTime(audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("timeupdate", updateTime);

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("timeupdate", updateTime);
    };
  }, []);

  const handleSeek = (e) => {
    const seektime = (e.nativeEvent.offsetX / e.target.clientWidth) * duration;
    audioRef.current.currentTime = seektime;
    setcurrentTime(seektime);
  };

  const playSong = (song) => {
    console.log("Playing song:", song); // Debugging
    setCurrentSong(song);
  };

  const togglePlay = () => {
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Error in togglePlay:", error);
    }
  };

  const playNextSong = () => {
    try {
      console.log("Next button clicked"); // Debugging
      if (songs.length === 0) return;

      const currentIndex = songs.findIndex(
        (song) => song.filename === currentSong.filename
      );
      const nextIndex = (currentIndex + 1) % songs.length;
      const nextSong = songs[nextIndex];
      console.log("Next Song:", nextSong); // Debugging
      playSong(nextSong);
    } catch (error) {
      console.error("Error in playNextSong:", error);
    }
  };

  const playPreviousSong = () => {
    try {
      console.log("Previous button clicked"); // Debugging
      if (songs.length === 0) return;

      const currentIndex = songs.findIndex(
        (song) => song.filename === currentSong.filename
      );
      const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
      const previousSong = songs[previousIndex];
      console.log("Previous Song:", previousSong); // Debugging
      playSong(previousSong);
    } catch (error) {
      console.error("Error in playPreviousSong:", error);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const removeFromPlaylist = (playlistName, filename) => {
    setplaylists((prev) => ({
      ...prev,
      [playlistName]: prev[playlistName].filter(
        (song) => song.filename !== filename
      ),
    }));
  };
  const renderSongsList = (songs, Delete_song, tab) => {
    return (
      <div className="bg-gray-100 rounded-lg shadow-md">
        {songs.map((song) => (
          <div
            className={`p-4 hover:bg-gray-500 cursor-pointer group flex justify-between items-center ${
              currentSong?.filename === song.filename
                ? "bg-blue-500 font-semibold text-gray"
                : ""
            }`}
            key={song.filename}
            onClick={() => playSong(song)}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        Delete_song(song.filename);
                        setcontextMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                      Delete
                    </button>
                    {playlists &&
                      Object.keys(playlists).map((playlistName) => (
                        <button
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
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation Drawer */}
        <div className="w-64 bg-gray-100 p-4 border-r border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-700">
            Music Library
          </h2>

          <nav className="space-y-2">
            {/* Existing buttons */}
            <button
              onClick={() => setActiveTab("all")}
              className={`w-full text-left p-2 rounded transition-colors ${
                activeTab === "all"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
            >
              All Songs
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`w-full text-left p-2 rounded transition-colors ${
                activeTab === "add"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
            >
              Add Songs
            </button>

            {/* Dynamic Playlist Buttons */}
            {Object.keys(playlists).map((playlistName) => (
              <div
                key={playlistName}
                className="group flex items-center justify-between hover:bg-gray-200 rounded"
              >
                <button
                  key={playlistName}
                  onClick={() => setActiveTab(playlistName)}
                  className={`w-full text-left p-2 rounded transition-colors ${
                    activeTab === playlistName
                      ? "bg-blue-500 text-white"
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-8 pb-32">
          <div className="container mx-auto max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Music Player
            </h2>
            <audio ref={audioRef}></audio>
            {/* ALL songs tab  */}
            {activeTab === "all" && renderSongsList(songs, Delete_song, "all")}

            {/* Add songs main content */}

            {activeTab === "add" && (
              <div className="bg-gray-100 rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-4">Add Songs</h3>
                <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".mp3, .wav, .flac, .m4a"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-block"
                  >
                    <div className="text-gray-600">
                      {isuploading ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className=" animate-spin h-5 w-5 mr-3 ..."
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V4a10 10 0 00-10 10h2zm2 0a6 6 0 016-6V4a8 8 0 00-8 8"
                            ></path>
                            {/* Loading spinner SVG */}
                          </svg>
                          Uploading....
                        </div>
                      ) : (
                        <>
                          <p>Drag and drop files here or</p>
                          <div
                            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            disabled={isuploading}
                          >
                            Browse Files
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                  {uploaderror && (
                    <p className="text-red-500 mt-2"> Error : {uploaderror}</p>
                  )}
                </div>
              </div>
            )}

            {Object.keys(playlists).map(
              (playlistName) =>
                activeTab === playlistName &&
                renderSongsList(
                  playlists[playlistName],
                  (filename) => removeFromPlaylist(playlistName, filename),
                  playlistName
                )
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Control Bar - Updated to be centered */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white">
          <div className="mx-auto max-w-2xl">
            <div className="bg-gray-200 rounded-xl p-4 shadow-lg">
              {/* Now Playing Info */}
              <div className="text-center mb-2 text-black font-medium">
                {currentSong.title} - {currentSong.artist}
              </div>

              {/* Progress Bar */}
              <div
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>

              {/* Time Display */}
              <div className="flex justify-between text-sm text-black mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4 mt-2">
                <button
                  className="bg-blue-600 p-2 rounded-full transition-all duration-200 hover:bg-blue-700 active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform text-white"
                  onClick={playPreviousSong}
                >
                  <SkipBack />
                </button>
                <button
                  onClick={togglePlay}
                  className="bg-blue-600 p-2 rounded-full transition-all duration-200 hover:bg-blue-700 active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform text-white"
                >
                  {isPlaying ? <Pause /> : <Play />}
                </button>
                <button
                  className="bg-blue-600 p-2 rounded-full transition-all duration-200 hover:bg-blue-700 active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform text-white"
                  onClick={playNextSong}
                >
                  <SkipForward />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
