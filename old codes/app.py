import os
from flask import Flask, request, jsonify,send_file
from flask_cors import CORS
import mutagen
from  werkzeug.utils import secure_filename
import yt_dlp
import imageio_ffmpeg
from uuid import uuid4
import shutil


app = Flask(__name__)
CORS(app, resources={r'/*': {
    'origins': "http://localhost:3000",
    'methods': ['GET' , 'POST' , 'PUT' , 'DELETE','OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization'] 

}})

MUSIC_FOLDER = 'music'



# Add allowed extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/songs')
def list_songs():
    songs = []
    for filename in os.listdir(MUSIC_FOLDER):
        if filename.endswith(('.mp3', '.wav', '.flac')):
            filepath = os.path.join(MUSIC_FOLDER, filename)
            audio = mutagen.File(filepath, easy=True)
            songs.append({
                'title': audio.tags.get('title', filename),
                'artist': audio.tags.get('artist', 'Unknown'),
                'album': audio.tags.get('album', 'Unknown'),
                'duration': audio.info.length,
                'filename': filename
            })
    return jsonify(songs);


@app.route('/play/<filename>')
def play_song(filename):
    filepath  = os.path.join(MUSIC_FOLDER, filename)
    return send_file(filepath,mimetype='audio/mpeg')       



@app.route('/upload',methods= ['POST'])
def upload_songs():
    if 'files' not in request.files:
        return jsonify({'error': 'No file part'}),400

    files  = request.files.getlist('files')
   
    saved_files = []

    for file in files:

        if file and allowed_file(file.filename): 
            filename = secure_filename(file.filename)
            save_path = os.path.join(MUSIC_FOLDER, filename)
            
            if os.path.exists(save_path):
                continue

            file.save(save_path)
            saved_files.append(filename)


    updated_songs = list_songs().json

    return jsonify({
       'message': f'{len(saved_files)} files uploaded successfully',
       'songs': updated_songs
    })

@app.route('/delete/<filename>',methods=['DELETE'])
def delete_song(filename):
  try:
    filepath = os.path.join(MUSIC_FOLDER, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({'message': 'File deleted successfully'})
    else:
        return jsonify({'error': 'File not found'}), 404
  except Exception as e:
    return jsonify({'error': str(e)}), 500


#downloading and converting a video to mp3 from youtube 
ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

YDL_OPTIONS = {
    'format': 'bestaudio/best',
    'outtmpl': 'downloads/%(title)s.%(ext)s',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'ffmpeg_location': ffmpeg_path
}



#downloading youtube videos
@app.route('/download',methods = ['POST'])
def download_song():
     
     data = request.json
     url = data.get('url')
     #  print(url)
    
     if not url: 
        print("NO url provided") 
        return jsonify({'error':'No URL provided'}), 400
     print("here in download function")
     try:
       temp_dir = f"temp_{uuid4().hex}"
       os.makedirs(temp_dir,exist_ok=True)


       #download and convert 
       ydl_opts  = YDL_OPTIONS.copy()
       ydl_opts['outtmpl'] = f'{temp_dir}/%(title)s.%(ext)s'

       with yt_dlp.YoutubeDL(ydl_opts) as ydl:
         info  = ydl.extract_info(url,download=True)  
         temp_path = ydl.prepare_filename(info).replace('.webm', '.mp3').replace('.m4a', '.mp3')


       #move to music folder and sanitize filename 
       filename = secure_filename(os.path.basename(temp_path))  
       final_path = os.path.join(MUSIC_FOLDER,filename)  
       
       if os.path.exists(final_path):
         os.remove(temp_path)
         shutil.rmtree(temp_dir)
         return jsonify({'error': 'Song already exists'}), 400
         print("Song already exists")
       shutil.move(temp_path, final_path)
       shutil.rmtree(temp_dir)
       
       print("succesfully downloaded the song") 
       return jsonify({
        'message': 'Song downloaded successfully',
        'filename': filename
       })
     
     except Exception as e:
        print(f"Error downloading: {str(e)}")
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
   
    app.run(debug=True)
     


