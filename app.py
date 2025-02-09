import os
from flask import Flask, request, jsonify,send_file
from flask_cors import CORS
import mutagen
from  werkzeug.utils import secure_filename



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














if __name__ == '__main__':
    app.run(debug=True)



