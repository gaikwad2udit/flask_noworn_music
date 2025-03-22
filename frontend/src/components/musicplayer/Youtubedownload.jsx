import { useState } from "react";
import { Download, AlertCircle, ConciergeBell } from "lucide-react";
import { usePlayer } from "../../contexts/PlayerContext";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const YouTubeDownload = () => {
  const { setSongs, currentUser } = usePlayer();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [downloadStatus, setdownloadstatus] = useState({
    loading: false,
    error: null,
  });

  const handleYoutubeDownload = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) return;

    setdownloadstatus({ loading: true, error: null });

    try {
      const response = await axios.post(
        `${API_URL}/download`,

        { url: youtubeUrl }, // Axios automatically converts this to JSON
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // const result = await response.data;
      console.log("server response code", response.status);

      if (!response.status === 200) throw new Error("Download failed");

      const songsResponse = await axios.get(`${API_URL}/songs`, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      setSongs(songsResponse.data);
      console.log("Downloaded successfully");
      setdownloadstatus({ loading: false, error: null });
      setYoutubeUrl("");
    } catch (error) {
      console.log("downloading error");
      setdownloadstatus({ loading: false, error: error.message });
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 lg:p-8 transition-colors hover:border-blue-500">
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm max-w-lg mx-auto">
        <h4 className="text-lg font-semibold mb-4 text-gray-700 text-center">
          Download from YouTube
        </h4>
        <form onSubmit={handleYoutubeDownload} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={youtubeUrl}
              // key={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL here"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-500 w-full"
            />
            <button
              type="submit"
              disabled={downloadStatus.loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 justify-center"
            >
              {downloadStatus.loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download
                </>
              )}
            </button>
          </div>
          {downloadStatus.error && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {downloadStatus.error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default YouTubeDownload;
