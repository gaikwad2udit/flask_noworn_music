import { useCallback, useEffect, useState } from "react";
import { usePlayer } from "../contexts/PlayerContext";

export default function useAudio() {
  const {
    audioRef,
    setCurrentSong,
    playlists,
    currentSongIndex,
    setCurrentSongIndex,
    loopmode,
    currentSong,
    setLoopmode,
    currentPlaylist,
  } = usePlayer();

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Handle loop modes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = loopmode === "single";
  }, [loopmode, currentSong, audioRef]);

  const playNextSong = useCallback(() => {
    if (!currentPlaylist.length) return;

    const nextIndex = currentSongIndex + 1;

    // Handle playlist loop
    if (nextIndex < currentPlaylist.length) {
      setCurrentSong(currentPlaylist[nextIndex]);
      setCurrentSongIndex(nextIndex);
    } else if (loopmode === "playlist") {
      setCurrentSong(currentPlaylist[0]);
      setCurrentSongIndex(0);
    }
  }, [
    currentPlaylist,
    currentSongIndex,
    loopmode,
    setCurrentSong,
    setCurrentSongIndex,
  ]);

  //handling the end of the song
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (loopmode === "single") {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNextSong();
      }
    };
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, playNextSong, loopmode]);

  useEffect(() => {
    if (!audioRef.current) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audioRef.current.addEventListener("play", handlePlay);
    audioRef.current.addEventListener("pause", handlePause);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("play", handlePlay);
        audioRef.current.removeEventListener("pause", handlePause);
      }
    };
  }, [audioRef, playNextSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  useEffect(() => {
    // console.log("Checking audioRef:", audioRef.current);
    const audio = audioRef.current;

    if (!audio) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    // audio.src = currentSong.url; // Set the new song source
    // audio.load();

    const updateDuration = () => {
      // console.log("loadedmetadata event fired:", audio.duration);
      setDuration(audio.duration || 0);
      // console.log("Duration set to:", audio.duration);
    };

    const updateTime = () => {
      // console.log("timeupdate event fired:", audio.currentTime);
      setCurrentTime(audio.currentTime);
      // console.log("CurrentTime set to:", audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("timeupdate", updateTime);

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("timeupdate", updateTime);
    };
  }, [audioRef.current]);

  return {
    isPlaying,
    currentTime,
    setCurrentTime,
    duration,
    togglePlay,
    volume,
    setVolume,
  };
}
