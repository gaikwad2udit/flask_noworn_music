// NowPlayingCard.jsx
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { usePlayer } from "../../contexts/PlayerContext";

const NowPlayingCard = ({ song, onClose }) => {
  const { currentSong } = usePlayer();
  return (
    // <motion.div
    //   initial={{ y: 100, opacity: 0 }}
    //   animate={{ y: 0, opacity: 1 }}
    //   exit={{ y: 100, opacity: 0 }}
    //   className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center"
    // >
    <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-2xl w-[400px] max-w-[90vw] relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 z-10"
      >
        {/* <X size={20} /> */}
      </button>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center">Now Playing</h3>
        <img
          src={currentSong?.thumbnail || "/thumbnail.jpg"}
          alt="Album cover"
          className="w-full h-40 object-cover rounded-lg"
        />
        <div className="text-center">
          <h2 className="text-xl font-semibold">{currentSong.title}</h2>
          <p className="text-sm text-gray-400 mt-1">{currentSong.artist}</p>
          <div className="flex justify-center gap-2 text-xs text-gray-500 mt-1">
            <span>{currentSong.uploader}</span>
            <span>•</span>
            <span>{currentSong.upload_date}</span>
          </div>
        </div>
      </div>
    </div>
    // </motion.div>
  );
};

export default NowPlayingCard;
