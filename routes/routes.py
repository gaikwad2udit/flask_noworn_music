from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, current_user, login_required
from models.models import User, Song
from app import db 
import jwt 
from date import datetime, timedelta
from app.email import send_confirmation_email

auth = Blueprint('auth', __name__)

@auth.route('register',methods=['POST'])
def register():
    data = request.get_json()
    if user.query.filter_by(email = data['email']).first():
        return jsonify({'error':'Email already exists'}), 400
    if user.query.filter_by(username = data['username']).first():
        return jsonify({'error':'Username already exists'}), 400
    
    user = User(username = data['username'], email = data['email'])

    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    token = generate_confirmation_token(user.email)
    send_confirmation_email(user.email, token)

    return jsonify({'message':"user Registered please confirm your email"}),201



@auth.route('login', methods = ['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email = data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error':'Invalid Email or Password'}), 401
   
    if not user.confirmed:
        return jsonify({'error':'Please confirm your email'}), 403
    
    login_user(user,remember=data.get('remember',False))

    #generating jwt token

    token = jwt.encode({
         'user_id' : user.id,
         'exp' : datetime.utcnow() + timedelta(days=1)
    },current_app.config['SECRET_KEY'],algorithm='HS256')

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user_id': user.id,
        'username': user.username
    }),200


@auth.route('logout',methods=['POST']) 
@login_required
def logout():
    logout_user()
    return jsonify({    'message': 'Logged out successfully'}),200