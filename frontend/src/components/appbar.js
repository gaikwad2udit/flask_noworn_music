import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePlayer } from "../contexts/PlayerContext";
import { Search } from "lucide-react";
import useSongs from "../hooks/UseSongs";
// import { Search } from "lucide-react";
const Appbar = () => {
  const { currentUser, logoutUser, checkAuth, songs } = usePlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const { PlaySong } = useSongs();

  useEffect(() => {
    console.log("from appbar");
    checkAuth();
  }, []);
  //  for search filtering
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = songs.filter((song) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          (song.title?.toLowerCase() || "").includes(searchLower) ||
          (song.artist?.toLowerCase() || "").includes(searchLower) ||
          (song.album?.toLowerCase() || "").includes(searchLower)
        );
      });
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, songs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <nav className="bg-gray-800 p-4 relative">
      <div className="container mx-auto flex items-center justify-between flex-wrap gap-4">
        {/* Branding */}
        <h1 className="text-2xl font-bold min-w-[200px]">
          <span className="text-blue-500">Noworn</span>
          <span className="text-white"> Music</span>
        </h1>

        {/* Search Section */}
        {currentUser && (
          <div className="flex-grow max-w-2xl px-4 search-container relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search songs, artists, albums..."
                className="w-full px-4 py-2 pl-10 rounded-lg bg-gray-700 text-white 
                       placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />

              {/* Search Results Dropdown */}
              {isSearchFocused && searchResults.length > 0 && (
                <div
                  className="absolute top-12 left-0 right-0 z-50 
                            bg-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto"
                >
                  {searchResults.map((song) => (
                    <Link
                      key={song.id}
                      to="#" // Replace with actual song route if needed
                      className="flex items-center p-3 hover:bg-gray-600 transition-colors"
                      onClick={() => {
                        // Handle song selection
                        PlaySong(searchResults, song);
                        setIsSearchFocused(false);
                      }}
                    >
                      <img
                        src={song?.thumbnail || "/thumbnail.jpg"}
                        alt={song.title}
                        className="w-10 h-10 rounded-md mr-3"
                      />
                      <div>
                        <div className="text-white font-medium">
                          {song.title}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {song.artist} • {song.album}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* No Results Found */}
              {isSearchFocused && searchQuery && searchResults.length === 0 && (
                <div
                  className="absolute top-12 left-0 right-0 z-50 
                            bg-gray-700 rounded-lg shadow-xl p-4 text-gray-400"
                >
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Controls */}
        <div className="flex items-center space-x-4 min-w-[200px] justify-end">
          {currentUser ? (
            <>
              <div className="hidden md:block">
                <span className="text-gray-300">
                  Welcome, {currentUser.username}
                </span>
              </div>
              <button
                onClick={logoutUser}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md
                         transition-colors duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md
                           transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md
                           transition-colors duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Appbar;
