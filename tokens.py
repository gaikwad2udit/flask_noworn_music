from itsdangerous import URLSafeTimedSerializer
from app import app

def generate_confirmation_token(email):
    serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    return serializer.dumps(email, salt=app.config['SECURITY_PASSWORD_SALT'])

def confirm_token(token , expiration = 3600):
    serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    
    try:
        email = serializer.loads(
            token,
            salt = app.config['SECURITY_PASSWORD_SALT'],
            max_age = expiration
        )
    except:
        return False
    return email


@auth.route('/confirm/<token>')
def confirm_email(token):
    email = confirm_token(token)
    
    if not email:
        return jsonify({'error':'The confirmation link is invalid or has expired'}), 400
    

    user  = User.query.filter_by(email = email).first_or_404()
    if user.confirmed:
        return jsonify({'message':'Account already confirmed'}), 200

    user.confirmed = True
    db.session.commit()
    return jsonify({'message':'You have confirmed your account. Thanks!'}), 200