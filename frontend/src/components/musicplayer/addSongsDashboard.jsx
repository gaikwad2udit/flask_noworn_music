import YouTubeDownload from "./Youtubedownload";
import FileUpload from "./FileUpload";
import { ReceiptPoundSterling } from "lucide-react";

const AddSongsDashboard = () => {
  return (
    <div className="bg-gray-100 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6 text-gray-800">Add Songs</h3>

      <div className="space-y-8">
        {/* YouTube Download Section */}
        <YouTubeDownload />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-gray-100 text-sm text-gray-500">OR</span>
          </div>
        </div>

        {/* File Upload Section */}
        <FileUpload />
      </div>
    </div>
  );
};

export default AddSongsDashboard;
