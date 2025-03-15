import SideBar from "./musicplayer/SideBar";
import { PlayerProvider } from "../contexts/PlayerContext";
import SongList from "./musicplayer/SongsList";
import AddSongsDashboard from "./musicplayer/addSongsDashboard";
import { use, useState } from "react";
import PlayerControls from "./musicplayer/PlayerControls";
import { usePlayer } from "../contexts/PlayerContext";
import NowPlayingCard from "./musicplayer/nowPlayingCard";

const MusicPlayer = () => {
  return <MusicPlayerContent />;
};

const MusicPlayerContent = () => {
  const { activeTab, nowPlaying, setNowPlaying } = usePlayer();
  console.log("Music Player rendered ", activeTab);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <SideBar />

        <div className="flex-1 overflow-auto p-8 pb-32">
          <div className="container mx-auto max-w-md">
            {activeTab === "all" && <SongList />}
            {activeTab === "add" && <AddSongsDashboard />}
            {/* {activeTab !== "all" && activeTab !== "add" && <SongList />} */}
            {nowPlaying && activeTab === "nowPlaying" && (
              <NowPlayingCard
                song={nowPlaying}
                onClose={() => setNowPlaying(null)}
              />
            )}
          </div>
        </div>
      </div>
      <PlayerControls />
    </div>
  );
};

export default MusicPlayer;
