import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
} from "lucide-react";

import { useEffect, useState } from "react";
import { usePlayer } from "../../contexts/PlayerContext";
import useAudio from "../../hooks/UseAudio";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PlayerControls = () => {
  const {
    audioRef,
    currentSong,
    songs,
    setCurrentSong,
    loopmode,
    setLoopmode,
    currentUser,
  } = usePlayer();

  const {
    isPlaying,
    currentTime,
    setCurrentTime,
    duration,
    togglePlay,
    volume,
    setVolume,
  } = useAudio();
  const [previousVolume, setPreviousVolume] = useState(1);

  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    const fetchAudio = async () => {
      try {
        console.log("Fetching audio for:", currentSong);
        const response = await axios.get(`${API_URL}/play/${currentSong.id}`, {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });
        console.log("Audio response:", response);
        console.log(response.data);

        // const audioblob = new Blob([response.data], { type: "audio/mpeg" });
        // const audioURL = URL.createObjectURL(audioblob);
        // console.log("Audio URL:", audioURL);

        audioRef.current.src = currentSong.audio_url;
        audioRef.current.load();
        audioRef.current.play().catch((error) => {
          console.error("Error playing song:", error);
        });
      } catch (error) {
        console.log("Error fetching audio:", error);
      }
    };
    fetchAudio();
  }, [currentSong, audioRef]);

  //volume slider handler
  const handleVolumeChange = (e) => {
    const newvolume = parseFloat(e.target.value);
    setVolume(newvolume);
    if (newvolume > 0 && volume === 0) {
      setPreviousVolume(newvolume);
    }
  };
  // mute toggle handler
  const toggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
    } else {
      setVolume(previousVolume);
    }
  };
  //toggle for loop mode

  const toggleLoop = () => {
    setLoopmode((prev) => {
      if (prev === "off") return "playlist";
      if (prev === "playlist") return "single";
      return "off";
    });
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;

    // Calculate the new seek time based on the progress bar click
    let seekTime = (e.nativeEvent.offsetX / e.target.clientWidth) * duration;

    // Ensure seekTime is within valid bounds (0 to duration)
    seekTime = Math.max(0, Math.min(seekTime, duration));

    // Update audio playback position
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);

    // console.log(`🎯 Seeking to: ${seekTime}s`);
  };

  const playSong = (song) => {
    console.log("Playing song:", song);
    setCurrentSong(song);
  };

  const playPreviousSong = () => {
    if (!songs.length || !currentSong) return;

    const currentIndex = songs.findIndex(
      (song) => song.filename === currentSong.filename
    );
    const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong(songs[previousIndex]);
  };

  const playNextSong = () => {
    if (!songs.length || !currentSong) return;

    const currentIndex = songs.findIndex(
      (song) => song.filename === currentSong.filename
    );
    const nextIndex = (currentIndex + 1) % songs.length;
    playSong(songs[nextIndex]);
  };

  const formatTime = (time) => {
    // console.log("Formatting time:", time);
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    // console.log(
    //   "CurrentTime in PlayerControls:",
    //   currentTime,
    //   "Duration:",
    //   duration
    // );
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white">
      <div className="mx-auto max-w-2xl">
        <div className="bg-gray-200 rounded-xl p-4 shadow-lg relative">
          {/* Now Playing Info */}
          <div className="text-center mb-2 text-black font-medium">
            {currentSong.title} - {currentSong.artist}
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-2 bg-gray-500 rounded-full cursor-pointer relative group"
            onClick={handleSeek}
          >
            {/* Background track */}
            <div className="absolute top-0 left-0 h-full rounded-full bg-gray-300 w-full"></div>

            {/* Progress fill with thumb */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-700 rounded-full transition-all duration-200"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md border border-blue-200"></div>
            </div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-sm text-black mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              <button
                onClick={toggleLoop}
                className={`p-1.5 rounded-full transition-colors ${
                  loopmode !== "off"
                    ? "text-blue-600 bg-blue-100 hover:bg-blue-200"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                {loopmode === "single" ? (
                  <Repeat1 size={20} className="align-middle" />
                ) : (
                  <Repeat
                    size={20}
                    className={`align-middle ${
                      loopmode === "playlist" ? "fill-current" : ""
                    }`}
                  />
                )}
              </button>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-4">
                <button
                  className="bg-blue-700 p-2 rounded-full transition-all duration-200 hover:bg-blue-700 active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform text-white"
                  onClick={playPreviousSong}
                >
                  <SkipBack />
                </button>
                <button
                  onClick={togglePlay}
                  className="bg-blue-700 p-3 rounded-full transition-all duration-200 hover:bg-blue-700 active:scale-90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform text-white"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                  className="bg-blue-700 p-2 rounded-full transition-all duration-200 hover:bg-blue-700 active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform text-white"
                  onClick={playNextSong}
                >
                  <SkipForward />
                </button>
              </div>
            </div>
            {/* right aligned volume controls */}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 appearance-none cursor-pointer bg-gray-400 rounded-lg relative"
                style={{
                  background: `linear-gradient(to right, #064ab8 ${
                    volume * 100
                  }%, #6b7280 ${volume * 100}%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
