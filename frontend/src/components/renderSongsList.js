// import React from "react";
// export function RenderSongsList({
//   song,
//   currentSong,
//   filename,
//   playSong,
//   e,
//   setcontextMenu,
//   contextMenu,
//   menuRef,
//   Delete_song,
//   playlists,
//   playlistName,
//   addToPlaylist,
// }) {
//   return (
//     <div className="bg-gray-100 rounded-lg shadow-md">
//       {songs.map((song) => (
//         <div
//           className={`p-4 hover:bg-gray-500 cursor-pointer group flex justify-between items-center ${
//             currentSong?.filename === song.filename
//               ? "bg-blue-500 font-semibold text-gray"
//               : ""
//           }`}
//           key={song.filename}
//           onClick={() => playSong(song)}
//         >
//           <div className="flex-grow truncate">
//             {song.title} - {song.artist}
//           </div>

//           <div className="relative flex-shrink-0">
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setcontextMenu(
//                   contextMenu === song.filename ? null : song.filename
//                 );
//               }}
//               className="p-1 rounded-full hover:bg-gray-400/30 transition-colors"
//             >
//               <MoreVertical className="w-5 h-5" />
//             </button>

//             {contextMenu === song.filename && (
//               <div
//                 ref={menuRef}
//                 className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10"
//               >
//                 <div className="py-1">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       Delete_song(song.filename);
//                       setcontextMenu(null);
//                     }}
//                     className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center"
//                   >
//                     <Trash2 className="w-4 h-4 mr-2 text-red-500" />
//                     Delete
//                   </button>
//                   {playlists &&
//                     Object.keys(playlists).map((playlistName) => (
//                       <button
//                         className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           console.log(
//                             "user has clicked to add songs to ",
//                             playlistName
//                           );
//                           addToPlaylist(playlistName, song);
//                           setcontextMenu(null);
//                         }}
//                       >
//                         <PlusCircle className="w-4 h-4 mr-2 text-blue-500" />
//                         Add to {playlistName}
//                       </button>
//                     ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }
