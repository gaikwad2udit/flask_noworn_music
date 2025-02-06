import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

const MusicPlayer = () => {
  const audioRef = useRef(null);
  const [songs, setSongs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [duration,setduration] = useState(0);
  const [currentTime,setcurrentTime] = useState(0);

  useEffect(() => {
    console.log('fetching songs');
    const fetchsongs = async () => {
      try {
        const response = await fetch('http://localhost:5000/songs');
        const data = await response.json();
        console.log('TOTAL NO OF SONGS:', data.length); // Debugging
        setSongs(data);
        
      } catch (error) {
        console.log('Error fetching songs', error);
      }
    };
    fetchsongs();
  }, []);
  

 useEffect(() => {
    
     if (currentSong) {
        // try {
        //     console.log('Playing song:', currentSong); // Debugging
        //     audioRef.current.src = `http://localhost:5000/play/${currentSong.filename}`;
        //     audioRef.current.play().then(() => {
        //     setIsPlaying(true);
        //       // setduration(audioRef.current.duration);  
        //   }).catch((error) => {
        //       console.error('Error playing song:', error);
        //     });
        //   } catch (error) {
        //     console.error('Error in playSong:', error);
        //   }

        try {
            const audioSrc = `http://localhost:5000/play/${currentSong.filename}`;
            console.log('Setting audio source:', audioSrc); // Debugging
            audioRef.current.src = audioSrc;
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch((error) => {
              console.error('Error playing song:', error);
            });
          } catch (error) {
            console.error('Error in playSong:', error);
          }
    }
       },[currentSong])

//UDPATE THE DUARATION AND CURRENT TIME

useEffect(() => {
  const audio = audioRef.current;
   const updateDuration = () => {
    setduration(audio.duration);
   }

   const updateTime = () => {
    setcurrentTime(audio.currentTime);
   }

  audio.addEventListener('loadedmetadata', updateDuration);
  audio.addEventListener('timeupdate', updateTime);

   return () => {
    audio.removeEventListener('loadedmetadata', updateDuration);
    audio.removeEventListener('timeupdate', updateTime);    
   }

},[])
 
    const handleSeek = (e) => {
        const  seektime = (e.nativeEvent.offsetX / e.target.clientWidth) * duration;
        audioRef.current.currentTime = seektime;
        setcurrentTime(seektime);
    }

  const playSong = (song) => {
    console.log('Playing song:', song); // Debugging
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
      console.error('Error in togglePlay:', error);
    }
  };

  const playNextSong = () => {
    try {
      console.log('Next button clicked'); // Debugging
      if (songs.length === 0) return;

      const currentIndex = songs.findIndex(song => song.filename === currentSong.filename);
      const nextIndex = (currentIndex + 1) % songs.length;
      const nextSong = songs[nextIndex];
      console.log('Next Song:', nextSong); // Debugging
      playSong(nextSong);
    } catch (error) {
      console.error('Error in playNextSong:', error);
    }
  };

  const playPreviousSong = () => {
    try {
      console.log('Previous button clicked'); // Debugging
      if (songs.length === 0) return;

      const currentIndex = songs.findIndex(song => song.filename === currentSong.filename);
      const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
      const previousSong = songs[previousIndex];
      console.log('Previous Song:', previousSong); // Debugging
      playSong(previousSong);
    } catch (error) {
      console.error('Error in playPreviousSong:', error);
    }
  };

  const formatTime = (time) => {
   const minutes = Math.floor(time / 60);
   const seconds = Math.floor(time % 60);
   return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Music Player</h2>
      <audio ref={audioRef}></audio>

      <div className="bg-gray-100 rounded-lg shadow-md">
        {songs.map((song) => (
          <div
            className={`p-4 hover:bg-gray-500 cursor-pointer ${
              currentSong?.filename === song.filename ? 'bg-blue-500 font-semibold text-white' : ''
            }`}
            key={song.filename}
            onClick={() => {
                playSong(song);               
            }}
          >
            {song.title} - {song.artist}
          </div>
        ))}
      </div>

      {currentSong && (
        <div className="mt-4">
        {/* Progress Bar */}
        <div
          className="w-full h-2 bg-gray-300 rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-2 bg-blue-500 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
        {/* Time Display */}
        <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

        {/* {controls} */}
        <div className="flex justify-center space-x-4 mt-4">
          <button
            // className="bg-gray-200 p-2 rounded-full"
            className="bg-gray-200 p-2 rounded-full transition-all duration-200 hover:bg-gray-300 active:bg-blue-500 active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform"

            onClick={playPreviousSong}
          >
            <SkipBack />

          </button>
          <button
            onClick={togglePlay}
            className="bg-blue-500 p-2 rounded-full transition-all duration-200 hover:bg-gray-300 active:bg-blue-500 active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform"
            // className="bg-blue-500 text-white p-2 rounded-full"
          >
            {isPlaying ? <Pause /> : <Play />}
          </button>

          <button
            // className="bg-gray-200 p-2 rounded-full"
            className="bg-gray-200 p-2 rounded-full transition-all duration-200 hover:bg-gray-300 active:bg-blue-500 active:scale-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform"
            onClick={playNextSong}
          >
            <SkipForward   />
          </button>
        </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;