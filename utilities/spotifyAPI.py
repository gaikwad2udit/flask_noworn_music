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
