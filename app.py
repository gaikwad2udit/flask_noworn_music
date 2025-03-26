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
from dotenv import load_dotenv
from flask_mail import Mail, Message
import smtplib 
import cloudinary
import cloudinary.uploader
import glob
from flask_migrate import Migrate

load_dotenv()

app = Flask(__name__)


app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME') # Your Gmail email
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')  # Your Gmail password or App Password
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')  # Your Gmail email


mail = Mail(app)


app.config['SECRET_KEY'] =  os.getenv('SECRET_KEY') 
app.config['SECURITY_PASSWORD_SALT'] =  os.getenv('SECURITY_PASSWORD_SALT')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///site.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# CORS(app, resources={r'/*': {
#     'origins': "http://localhost:3000",
#     'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
#     'allow_headers': ['Content-Type', 'Authorization',],
#     'supports_credentials': True
# }})
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

CORS(app, resources={r'/*': {
    'origins': CORS_ORIGINS,
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization'],
    'supports_credentials': True,
    'expose_headers': ['Content-Disposition']  # For file downloads
}})



db = SQLAlchemy(app)
migrate = Migrate(app, db)
# login_manager = LoginManager(app)
# login_manager.login_view = 'login'

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret= os.getenv('CLOUDINARY_API_SECRET')
)


#database models 
class User( db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed = db.Column(db.Boolean, default=False)
    playlists = db.relationship('Playlist', backref='user', lazy='dynamic')
    songs = db.relationship('Song', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256:100000')
    
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
    filename = db.Column(db.String(140),)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    audio_url = db.Column(db.String(2048))

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
            'audio_url': self.audio_url

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
        print("token verfication")
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
    print("inside register function")
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
    
    #for production
    app.config['MAIL_DEFAULT_SENDER'] =  'noreply@nowornmusic.com'
    confirmation_url = f"{os.getenv('FRONTEND_URL')}/confirm/{token}"
    msg = Message(
        subject='Confirm your email',
        recipients=[user.email],
        html=f"""
        <h1>Welcome to Noworn Music!</h1>
        <p>Please confirm your email by clicking the link below:</p>
        <a href="{confirmation_url}">Confirm Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
        """
    )
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()  # Upgrade to secure connection
        server.login(os.getenv("MAIL_USERNAME") , os.getenv("MAIL_PASSWORD"))
        print("SMTP connection successful!")
        server.quit()
    except Exception as e:
        
        print(f"SMTP connection failed: {e}")

    try:
     mail.send(msg)
    except Exception as e:
        app.logger.error(f"Error sending email: {str(e)}")
        return jsonify({'error': 'Error sending email'}), 500

    return jsonify({'message': 'User registered. Please confirm your email.'}), 201

#email confirmation handler
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
     print("inside login function")
     data = request.get_json()
     user =  User.query.filter_by(email=data['email']).first()
     if not user or not user.check_password(data['password']):
        print("Invalid email or password")
        return jsonify({'error': 'Invalid email or password'}), 401
     if not user.confirmed:
        print("Please confirm your email first")
        return jsonify({'error': 'Please confirm your email first'}), 403
     
      
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
            'audio_url': song.audio_url
        
    } for song in current_user.songs])


#updated for user auth
@app.route('/play/<int:song_id>')
@jwt_required
def play_song(current_user,song_id):
    # filepath  = os.path.join(MUSIC_FOLDER, filename)
    # return send_file(filepath,mimetype='audio/mpeg')       
    song = Song.query.filter_by(id = song_id, user_id = current_user.id).first_or_404()
    # filepath = os.path.join(get_user_music_folder(current_user.id), song.filename)
    # return send_file(filepath,mimetype='audio/mpeg')
    if not song.audio_url:
        return jsonify({'error': 'No file available for this song'}), 404

    # Return the Cloudinary URL in the response
    return jsonify({
        'message': 'Song URL retrieved successfully',
        'music_url': song.audio_url
    })

#updated for user auth
@app.route('/upload',methods= ['POST'])
@jwt_required
def upload_songs(current_user):
    if 'files' not in request.files:
        # print("No file part")
        return jsonify({'error': 'No file part'}),400

    # user_folder = get_user_music_folder(current_user.id)
    # os.makedirs(user_folder, exist_ok=True)

    files  = request.files.getlist('files')
   
    saved_files = []

    for file in files:

        if file and allowed_file(file.filename): 
            filename = secure_filename(file.filename)
            # save_path = os.path.join(user_folder, filename)
            

            if Song.query.filter_by(filename=filename, user_id = current_user.id).first():
            # if os.path.exists(save_path)
                # print('song already exists')
                continue

            
            temp_dir = "temp_uploads"
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, filename)
            file.save(temp_path)
               
            #    saved_files.append(filename)
            try:   
               audio = mutagen.File(temp_path, easy=True)
               title = audio.tags.get('title', [filename])[0] if audio and audio.tags else filename
               artist = audio.tags.get('artist', ['Unknown'])[0] if audio and audio.tags else 'Unknown'

               #uploading to cloudinary

               cloudinary_folder = f"music_files/user_{current_user.id}"
               upload_result = cloudinary.uploader.upload(
                   temp_path,
                   resource_type = "video",
                   folder = cloudinary_folder
               )
               cloudinary_url = upload_result['secure_url']
               print("successfully uploaded the song")
               song = Song(
                filename = filename,
                title = title,
                artist = artist,
                user_id = current_user.id,
                audio_url = cloudinary_url,
               )
               db.session.add(song)
               saved_files.append(filename)
            except Exception as e:
                return jsonify({'error': f'Upload failed: {str(e)}'}), 500  
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)  
    db.session.commit()
  
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
    # cloudinary_url = song.musicfile_cloudinary_url
    # if not cloudinary_url:
    #         return jsonify({'error': 'Cloudinary URL not found'}), 404

    # public_id = cloudinary_url.split("/")[-1].split(".")[0]  # Extracts the unique public ID
    # cloudinary_folder = f"music_files/user_{current_user.id}/{public_id}"
    
    # res = cloudinary.uploader.destroy(cloudinary_folder,resource_type = "video")
    # if res.get('result') == 'ok':  # Check if deletion was successful
            # Remove from database
            db.session.delete(song)
            db.session.commit()
            
            return jsonify({'message': 'File deleted successfully'})
    # else:
    #         return jsonify({'error': 'Failed to delete file from Cloudinary'}), 500
    # # filepath = os.path.join(get_user_music_folder(current_user.id),song.filename)
    
  except Exception as e:
    return jsonify({'error': str(e)}), 500



#downloading and converting a video to mp3 from youtube 
ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

# YDL_OPTIONS = {
#     'format': 'bestaudio/best',
#     'outtmpl': 'downloads/%(title)s.%(ext)s',
#     'postprocessors': [{
#         'key': 'FFmpegExtractAudio',
#         'preferredcodec': 'mp3',
#         'preferredquality': '192',
#     }],
#     'ffmpeg_location': ffmpeg_path
# }
# YDL_OPTIONS = {
#     'format': 'bestaudio/best',
#     'outtmpl': 'downloads/%(title)s.%(ext)s',
#     'postprocessors': [{
#         'key': 'FFmpegExtractAudio',
#         'preferredcodec': 'mp3',
#         'preferredquality': '192',
#     }],
#     'ffmpeg_location': ffmpeg_path,
    
#     # Development-specific modifications
#     'http_headers': {
#         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
#     },
#     # Reduced throttling for faster testing
#     'sleep_interval': 1,
#     'max_sleep_interval': 3,
#     # More verbose output for debugging
#     'quiet': False,
#     'no_warnings': False,
#     # Keep these for stability
#     'ignoreerrors': True,
#     'retries': 2
# }
YDL_OPTIONS = {
    # Core Audio Configuration
    'format': 'bestaudio/best',
    'outtmpl': 'downloads/%(title)s.%(ext)s',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'ffmpeg_location': '/usr/bin/ffmpeg',  # Absolute path in production
    
    # Stealth Headers (Critical for Production)
    'http_headers': {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
        'DNT': '1',
        'Connection': 'keep-alive'
    },
    
    # Rate Limit Protection
    'sleep_interval': 8,  # Conservative delay
    'max_sleep_interval': 15,
    'retries': 5,  # Increased retry attempts
    'retry_sleep': 'linear',  # Linear backoff
    
    # Network Configuration
    'force_ipv4': True,
    'geo_bypass': True,
    'proxy': os.getenv('YT_PROXY'),  # Required for production
    'socket_timeout': 30,
    
    # Error Handling
    'ignoreerrors': False,  # Fail fast in production
    'extract_flat': False,
    
    # Logging
    'quiet': True,
    'no_warnings': True,
    
    # Advanced Protection
    'cookiefile': 'cookies.txt',  # If you have auth cookies
    'throttledratelimit': 1048576,  # 1MB/s rate limit
    'extractor_args': {
        'youtube': {
            'skip': ['dash', 'hls']  # Avoid problematic formats
        }
    }
}
YDL_OPTIONS.update({
    'extractor_args': {
        'youtube': {
            'player_skip': ['configs', 'webpage'],  # Skip problematic extractors
            'player_client': ['android', 'web']  # Alternate clients
        }
    },
    'allow_unplayable_formats': True,
    'ignore_no_formats_error': True
})

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
       ydl_opts['keepvideo'] = True
       
       with yt_dlp.YoutubeDL(ydl_opts) as ydl:
         info  = ydl.extract_info(url,download=True)  
        #  temp_path = ydl.prepare_filename(info).replace('.webm', '.mp3').replace('.m4a', '.mp3')
         actual_mp3_path = glob.glob(f"{temp_dir}/*.mp3")[0]
    
       #move to music folder and sanitize filename 
       filename = secure_filename(os.path.basename(actual_mp3_path))  
    
       cloudinary_userfolder = f"music_files/user_{current_user.id}"
       try:
        upload_result = cloudinary.uploader.upload(
                    actual_mp3_path,
                    resource_type = 'auto',
                    folder = cloudinary_userfolder,
        )
       except Exception as e:
            app.logger.error(f"Error uploading to Cloudinary: {str(e)}")
            shutil.rmtree(temp_dir)
            return jsonify({'error': 'Failed to upload file to Cloudinary.'}), 500
       finally:
           print("succesfully uploaded the song")
       cloudinary_url = upload_result['secure_url']
    #for local development
    #    final_path = os.path.join(user_folder,filename)  
       
       if Song.query.filter_by(filename=filename, user_id = current_user.id).first():
           shutil.rmtree(temp_dir)
           return jsonify({'error': 'Song already exists in your library'}), 400
            
    #    shutil.move(temp_path, final_path)
       shutil.rmtree(temp_dir)
       #getting song form spotify api
       
       print("succesfully downloaded the song- here's the available metadata")
       print("title", info.get('title', filename))
       print("artist",info.get('uploader', 'Unknown Artist'))
       print('uploader',info.get('uploader'))
       print('duration',info.get('duration'))
       print('upload_date',info.get('upload_date'))
       print('thumbnail',info.get('thumbnail'))
       
    
       date_str = info.get('upload_date')
       formatted_date = datetime.strptime(date_str, "%Y%m%d").strftime("%d %B %Y") 

       song = Song(
         
         filename = filename,
         title= info.get('title', filename),
         artist= info.get('uploader', 'Unknown Artist'),
         user_id= current_user.id, 
         uploader= info.get('uploader'),
         upload_date= formatted_date,
         thumbnail= info.get('thumbnail'),
         musicfile_cloudinary_url = cloudinary_url,
       )

       db.session.add(song)
       db.session.commit()

        
       return jsonify({
        'message': 'Song downloaded successfully',
        'filename': song.to_dict()
       })
     
     except Exception as e:
        # print(f"Error downloading: {str(e)}")
        import traceback
        traceback.print_exc() 
        return jsonify({'error': str(e)}), 500


@app.route('/get-audio-stream', methods=[ 'POST'])
@jwt_required
def get_audio_stream(current_user):
    
    url = request.json.get('url') 
    print("video URl -->",url)
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'extract_audio': True,
        'forceurl': True,  # Only get URL (no download)
    }
    try:
     with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        audio_url = info['url']  # Direct stream URL (M4A/WebM)
        filename = info['title']
        artist = info['uploader']
        duration = info['duration']
        upload_date = info['upload_date']
        thumbnail = info['thumbnail']
    except Exception as e:
        import traceback
        traceback.print_exc() 
        return jsonify({'failed getting song url': str(e)}), 500


    print("audio_url -->",audio_url)
    print("title", filename)
    print("artist",artist)
    # print('uploader',info.get('uploader'))
    print('duration',duration)
    print('upload_date',upload_date)
    print('thumbnail',thumbnail)

    if Song.query.filter_by(filename=filename, user_id = current_user.id).first():
           
           return jsonify({'error': 'Song already exists in your library'}), 400
    
    date_str = upload_date
    formatted_date = datetime.strptime(date_str, "%Y%m%d").strftime("%d %B %Y") 

    song = Song(
         
         filename = filename,
         title= info.get('title', filename),
         artist= info.get('uploader', 'Unknown Artist'),
         user_id= current_user.id, 
         uploader= info.get('uploader'),
         upload_date= formatted_date,
         thumbnail= info.get('thumbnail'),
         audio_url = audio_url,
       )

    db.session.add(song)
    db.session.commit()

        
    return jsonify({
        'message': 'Song downloaded successfully',
        'filename': song.to_dict()
       })


    # return jsonify({ 'audio_url': audio_url })







with app.app_context():
    db.create_all()



if __name__ == '__main__':
    
    # get_musicdata_spotify('kid laroi WITHOUT YOU','')
    debug  = os.getenv('FLASK_ENV') == 'development'
    print(CORS_ORIGINS)
    app.run(debug=debug)
     


