import { useState } from "react";
import { usePlayer } from "../../contexts/PlayerContext";
import { AlertCircle, Upload } from "lucide-react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const FileUpload = () => {
  const [isuploading, setisuploading] = useState(false);
  const [uploaderror, setuploaderorror] = useState(null);
  const { setSongs, currentUser } = usePlayer();

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

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      setSongs(response.data.songs);
    } catch (error) {
      setuploaderorror(error.message);
    } finally {
      setisuploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h4 className="text-md font-medium mb-4 text-gray-700">
        Upload Local Files
      </h4>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 transition-colors hover:border-blue-500">
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
          className="cursor-pointer flex flex-col items-center justify-center space-y-4"
        >
          <Upload className="w-12 h-12 text-gray-400" />
          <div className="text-center">
            <p className="text-gray-600 mb-2">Drag and drop files here or</p>
            <button
              type="button"
              disabled={isuploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isuploading ? "Uploading..." : "Browse Files"}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: MP3, WAV, FLAC, M4A
          </p>
        </label>
      </div>
      {uploaderror && (
        <p className="text-red-600 text-sm mt-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Error: {uploaderror}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
