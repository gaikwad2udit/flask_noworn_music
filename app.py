import os
from flask import Flask, request, jsonify,send_file
from flask_cors import CORS
import mutagen
from  werkzeug.utils import secure_filename
import yt_dlp
import imageio_ffmpeg
from werkzeug.security import generate_password_hash, check_password_hash
from uuid import uuid4
import shutil
import jwt
# from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime ,timedelta
from functools import wraps
import pytz
import requests
app = Flask(__name__)

app.config['SECRET_KEY'] = 'd75b89e3b8d6b4a0c96f1b45e7c8a92d'
app.config['SECURITY_PASSWORD_SALT'] = 'a3f8c1e7b9d2e5f4a9c6b7d8e1f2c3a4'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, resources={r'/*': {
    'origins': "http://localhost:3000",
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization',],
    'supports_credentials': True
}})
# CORS(app, resources={r"/*": {"origins": "*"}})
# @app.after_request
# def after_request(response):
#     response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
#     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
#     response.headers.add('Access-Control-Allow-Credentials', 'true')
#     return response

db = SQLAlchemy(app)
# login_manager = LoginManager(app)
# login_manager.login_view = 'login'

#database models 
class User( db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed = db.Column(db.Boolean, default=False)
    playlists = db.relationship('Playlist', backref='user', lazy='dynamic')
    songs = db.relationship('Song', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    songs = db.relationship('Song', secondary='playlist_song', backref='playlists')

class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140))
    artist = db.Column(db.String(140))
    uploader = db.Column(db.String(140))
    upload_date = db.Column(db.String(140))
    thumbnail = db.Column(db.String(140))
    filename = db.Column(db.String(140), unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'artist': self.artist,
            'filename': self.filename,
            'created_at': self.created_at.isoformat(),
            'uploader': self.uploader,
            'upload_date': self.upload_date,
            'thumbnail': self.thumbnail,

        }

playlist_song = db.Table('playlist_song',
    db.Column('playlist_id', db.Integer, db.ForeignKey('playlist.id')),
    db.Column('song_id', db.Integer, db.ForeignKey('song.id'))
)
# models ended 

serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

# @login_manager.user_loader
# def load_user(user_id):
#     return User.query.get(int(user_id))

#jwt token required decorator
def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        #just getting time form IST time
        ist = pytz.timezone('Asia/Kolkata')
        # print("token verification",datetime.now(ist))
        # Get token from headers
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split()[1]
            
        if not token:
            return jsonify({'error': 'Missing token'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            # current_user = User.query.get(data['user_id'])
            current_user = db.session.get(User, data['user_id'])

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated_function

#authentication routes 
@app.route('/register',methods = ['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(username=data['username'], email=data['email'])

    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
 
    token = serializer.dumps(user.email, salt=app.config['SECURITY_PASSWORD_SALT'])
    print(f"Confirmation token: {token}")  # For development
    
    return jsonify({'message': 'User registered. Please confirm your email.'}), 201

#email confirmation
@app.route('/confirm/<token>')
def confirm_email(token):
    try:
       email = serializer.loads(
        token ,
        salt=app.config['SECURITY_PASSWORD_SALT'],
        max_age=3600
       )
    except: 
       return jsonify({'error': 'Invalid or expired token'}), 400

    user = User.query.filter_by(email=email).first_or_404()
    if user.confirmed:
        return jsonify({'message': 'Account already confirmed'}), 200  
    user.confirmed = True
    db.session.commit()
    return jsonify({'message': 'You have confirmed your account. Thanks!'}), 200

@app.route('/login',methods=['POST'])  
def login():
     data = request.get_json()
     user =  User.query.filter_by(email=data['email']).first()
     if not user or not user.check_password(data['password']):
        # print("Invalid email or password")
        return jsonify({'error': 'Invalid email or password'}), 401
     if not user.confirmed:
        # print("Please confirm your email first")
        return jsonify({'error': 'Please confirm your email first'}), 403
    #  login_user(user)  # important 
      
     #generating jwt token for api access
     token = jwt.encode({
         'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=24) 
     },app.config['SECRET_KEY'],algorithm='HS256') 
    #  print("Successfully logged in")  # For development
     return jsonify({
        'message': 'Login successful',
        'token': token,
        'user_id': user.id,
        'username': user.username
     }) ,200 

#logout route
@app.route('/logout')
@jwt_required
def logout():
    # logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200



# MUSIC_FOLDER = 'music'
def get_user_music_folder(user_id):
    return os.path.join('music', str(user_id))


# Add allowed extensions
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

#checking for every time front end appbar loads
@app.route('/checkauth', methods=['GET'])
@jwt_required
def check_auth(current_user):
    # print("inside chech-auth route")
    return jsonify({
        'message': 'User authenticated',
        'token': request.headers['Authorization'].split()[1],  # Extract token from header
        'user_id': current_user.id,
        'username': current_user.username
    }), 200

#updated for user auth
@app.route('/songs')
@jwt_required
def list_songs(current_user):
    # print("giving list of songs")
    for song in current_user.songs:
        print(song.title,song.artist)
 
#   return {
#             'id': self.id,
#             'title': self.title,
#             'artist': self.artist,
#             'filename': self.filename,
#             'created_at': self.created_at.isoformat(),
#             'uploader': self.uploader,
#             'upload_date': self.upload_date,
#             'thumbnail': self.thumbnail,

#         }
    return jsonify([{
            'id': song.id,
            'title': song.title,
            'artist': song.artist,
            'filename': song.filename,
            'created_at': song.created_at.isoformat(),
            'uploader': song.uploader,
            'upload_date': song.upload_date,
            'thumbnail': song.thumbnail,
        
    } for song in current_user.songs])


#updated for user auth
@app.route('/play/<int:song_id>')
@jwt_required
def play_song(current_user,song_id):
    # filepath  = os.path.join(MUSIC_FOLDER, filename)
    # return send_file(filepath,mimetype='audio/mpeg')       
    song = Song.query.filter_by(id = song_id, user_id = current_user.id).first_or_404()
    filepath = os.path.join(get_user_music_folder(current_user.id), song.filename)
    return send_file(filepath,mimetype='audio/mpeg')


#updated for user auth
@app.route('/upload',methods= ['POST'])
@jwt_required
def upload_songs(current_user):
    if 'files' not in request.files:
        # print("No file part")
        return jsonify({'error': 'No file part'}),400

    user_folder = get_user_music_folder(current_user.id)
    os.makedirs(user_folder, exist_ok=True)

    files  = request.files.getlist('files')
   
    saved_files = []

    for file in files:

        if file and allowed_file(file.filename): 
            filename = secure_filename(file.filename)
            save_path = os.path.join(user_folder, filename)
            

            if not Song.query.filter_by(filename=filename, user_id = current_user.id).first():
            # if os.path.exists(save_path)
                # continue

               file.save(save_path)
            #    saved_files.append(filename)
               
               audio = mutagen.File(save_path, easy=True)
               title = audio.tags.get('title', [filename])[0] if audio and audio.tags else filename
               artist = audio.tags.get('artist', ['Unknown'])[0] if audio and audio.tags else 'Unknown'

               #getting the song details FROM spotify API
               

               song = Song(
                filename = filename,
                title = title,
                artist = artist,
                user_id = current_user.id
               )
               db.session.add(song)
               saved_files.append(filename)
    db.session.commit()
  
    # updated_songs = list_songs().json

    return jsonify({
       'message': f'{len(saved_files)} files uploaded successfully',
       'songs': [s.to_dict() for s in current_user.songs]
    })




# deleting a song from user song library , updated for user auth 
@app.route('/delete/<int:song_id>',methods=['DELETE'])
@jwt_required
def delete_song(current_user,song_id):
  print('inside delete song -> ',song_id)
  song = Song.query.filter_by(id=song_id, user_id=current_user.id).first_or_404()

  try:
    filepath = os.path.join(get_user_music_folder(current_user.id),song.filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        
        db.session.delete(song)
        db.session.commit()

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


#downloading youtube videos ,updated for user auth
@app.route('/download',methods = ['POST'])
@jwt_required
def download_song(current_user):
     
     data = request.json
     url = data.get('url')
    #   print(url)
     
     if not url: 
        # print("NO url provided") 
        return jsonify({'error':'No URL provided'}), 400
     
     user_folder = get_user_music_folder(current_user.id)
     os.makedirs(user_folder, exist_ok=True)
     
     
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
       final_path = os.path.join(user_folder,filename)  
       
       if Song.query.filter_by(filename=filename, user_id = current_user.id).first():
           shutil.rmtree(temp_dir)
           return jsonify({'error': 'Song already exists in your library'}), 400
            
       shutil.move(temp_path, final_path)
       #    shutil.rmtree(temp_dir)
       #getting song form spotify api
       
       print("succesfully downloaded the song- here's the available metadata")
       print("title", info.get('title', filename))
       print("artist",info.get('uploader', 'Unknown Artist'))
       print('uploader',info.get('uploader'))
       print('duration',info.get('duration'))
       print('upload_date',info.get('upload_date'))
       print('thumbnail',info.get('thumbnail'))
       

  

    #    song_data = get_musicdata_spotify(info.get('title', filename).replace("-",""), info.get('uploader', 'Unknown Artist').replace("-","")) 
    #    print("succesfully got the song metadata")
    #    'id': self.id,
    #         'title': self.title,
    #         'artist': self.artist,
    #         'filename': self.filename,
    #         'created_at': self.created_at.isoformat(),
    #         'uploader': self.uploader,
    #         'upload_date': self.upload_date,
    #         'thumbnail': self.thumbnail,
       date_str = info.get('upload_date')
       formatted_date = datetime.strptime(date_str, "%Y%m%d").strftime("%d %B %Y") 

       song = Song(
         
         filename = filename,
         title= info.get('title', filename),
         artist= info.get('uploader', 'Unknown Artist'),
         user_id= current_user.id, 
         uploader= info.get('uploader'),
         upload_date= formatted_date,
         thumbnail= info.get('thumbnail')
       )

       db.session.add(song)
       db.session.commit()

        
       return jsonify({
        'message': 'Song downloaded successfully',
        'filename': song.to_dict()
       })
     
     except Exception as e:
        # print(f"Error downloading: {str(e)}")
        return jsonify({'error': str(e)}), 500

with app.app_context():
    db.create_all()


def get_musicdata_spotify(track_name,artist_name):
            
        print("inside get_musicdata_spotify")
        # Get access token
        auth_url = 'https://accounts.spotify.com/api/token'
        client_id = '56aa16865ee5427999293f3f08ec12ab'
        client_secret = 'b2c073056e7b41d8a353647aa604b005'
        try:
            auth_response = requests.post(auth_url, {
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret,
            })
            access_token = auth_response.json()['access_token']
        except Exception as e:
            print(f"Error getting access token: {str(e)}")
            return None
        # Search for a track
        headers = {'Authorization': f'Bearer {access_token}'}
        params = {
            'q': f'track:{track_name} artist:{artist_name}',
            'type': 'track'"album",
            'limit': 1
        }
        try:
            response = requests.get('https://api.spotify.com/v1/search', headers=headers, params=params)
            data = response.json()
        except Exception as e:
            print(f"Error searching for track: {str(e)}")
            return None
        # Extract metadata
        track = data['tracks']['items'][0]
        title = track['name']
        artist = track['artists'][0]['name']
        album = track['album']['name']
        release_date = track['album']['release_date']
        album_art = track['album']['images'][0]['url']  # Highest resolution
        
        print( title, artist, album, release_date, album_art)
        # return title, artist, album, release_date, album_art
        return {
        "title": track['name'],
        "artist": track['artists'][0]['name'],
        "album": track['album']['name'],
        "release_date": track['album']['release_date'],
        "album_art": track['album']['images'][0]['url']  # Highest resolution
           }


if __name__ == '__main__':
    
    # get_musicdata_spotify('kid laroi WITHOUT YOU','')

    app.run(debug=True)
     


