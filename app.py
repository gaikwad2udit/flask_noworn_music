import os
from flask import Flask, request, jsonify,send_file
from flask_cors import CORS
import mutagen

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': "http://localhost:3000"}})

MUSIC_FOLDER = 'music'

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



if __name__ == '__main__':
    app.run(debug=True)



