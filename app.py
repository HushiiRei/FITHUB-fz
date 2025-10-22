from flask import Flask, request, jsonify, g, render_template, send_file
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime
import uuid
import json

app = Flask(__name__)
CORS(app)

# ==================== PAGE ROUTES ====================

@app.route('/')
def home_page():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard_page():
    return render_template('dashboard.html')

@app.route('/videos')
def video_library_page():
    return render_template('video-library.html')

@app.route('/planner')
def workout_planner_page():
    return render_template('workout-planner.html')

@app.route('/profile')
def profile_page():
    return render_template('profile.html')

# Serve static files (CSS, JS, images)
@app.route('/<path:filename>')
def serve_static(filename):
    if filename.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg')):
        return send_file(filename)
    return "Not found", 404

# ==================== DATABASE HELPERS ====================

def get_db_connection():
    """Get database connection for current request"""
    if 'db_connection' not in g:
        try:
            g.db_connection = mysql.connector.connect(
                host=os.getenv("MYSQL_HOST", "localhost"),
                user=os.getenv("MYSQL_USER", "root"),
                password=os.getenv("MYSQL_PASSWORD", ""),
                database=os.getenv("MYSQL_DATABASE", "fithub"),
                autocommit=True
            )
        except Error as e:
            print(f"Database connection error: {e}")
            g.db_connection = None
    
    return g.db_connection

def get_cursor():
    """Get database cursor"""
    conn = get_db_connection()
    return conn.cursor(dictionary=True) if conn else None

@app.teardown_appcontext
def close_db(error=None):
    """Close database connection at end of request"""
    connection = g.pop('db_connection', None)
    if connection and connection.is_connected():
        connection.close()

def require_auth():
    """Helper to get user ID from headers"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return None
    return user_id

# ==================== AUTHENTICATION ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    full_name = data.get('full_name', '')

    if not email or not password or not username:
        return jsonify({'error': 'Missing required fields'}), 400

    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        user_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO profiles (id, username, full_name, bio) VALUES (%s, %s, %s, %s)",
            (user_id, username, full_name, email)
        )
        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id
        }), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({'error': 'Missing username'}), 400

    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute("SELECT id FROM profiles WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if user:
            return jsonify({
                'message': 'Login successful',
                'user_id': user['id']
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Error as e:
        return jsonify({'error': str(e)}), 500

# ==================== VIDEOS ====================

@app.route('/api/videos', methods=['GET'])
def get_videos():
    """Get all videos with optional filtering"""
    category = request.args.get('category')
    difficulty = request.args.get('difficulty')

    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        query = "SELECT * FROM videos WHERE 1=1"
        params = []

        if category:
            query += " AND category = %s"
            params.append(category)
        if difficulty:
            query += " AND difficulty_level = %s"
            params.append(difficulty)

        cursor.execute(query, params)
        videos = cursor.fetchall()
        return jsonify(videos), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/videos/<video_id>', methods=['GET'])
def get_video(video_id):
    """Get a specific video"""
    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute("SELECT * FROM videos WHERE id = %s", (video_id,))
        video = cursor.fetchone()
        
        if video:
            return jsonify(video), 200
        return jsonify({'error': 'Video not found'}), 404
    except Error as e:
        return jsonify({'error': str(e)}), 500

# ==================== EXERCISES ====================

@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    """Get all exercises"""
    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute("SELECT * FROM exercises")
        exercises = cursor.fetchall()

        # Parse JSON fields
        for exercise in exercises:
            if exercise.get('muscle_groups'):
                exercise['muscle_groups'] = json.loads(exercise['muscle_groups'])

        return jsonify(exercises), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500

# ==================== WORKOUTS ====================

@app.route('/api/workouts', methods=['GET'])
def get_user_workouts():
    """Get workouts for authenticated user"""
    user_id = require_auth()
    if not user_id:
        return jsonify({'error': 'User ID required'}), 401

    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute("SELECT * FROM workouts WHERE user_id = %s", (user_id,))
        workouts = cursor.fetchall()
        return jsonify(workouts), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/workouts', methods=['POST'])
def create_workout():
    """Create a new workout"""
    user_id = require_auth()
    if not user_id:
        return jsonify({'error': 'User ID required'}), 401

    data = request.json
    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        workout_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO workouts (id, user_id, name, description, difficulty_level, duration_minutes) VALUES (%s, %s, %s, %s, %s, %s)",
            (workout_id, user_id, data.get('name'), data.get('description', ''), 
             data.get('difficulty_level', 'beginner'), data.get('duration_minutes', 30))
        )
        
        cursor.execute("SELECT * FROM workouts WHERE id = %s", (workout_id,))
        workout = cursor.fetchone()
        return jsonify(workout), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/workouts/<workout_id>', methods=['GET'])
def get_workout(workout_id):
    """Get a specific workout with exercises"""
    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        # Get workout
        cursor.execute("SELECT * FROM workouts WHERE id = %s", (workout_id,))
        workout = cursor.fetchone()

        if not workout:
            return jsonify({'error': 'Workout not found'}), 404

        # Get exercises for this workout
        cursor.execute(
            """SELECT we.*, e.* FROM workout_exercises we 
               JOIN exercises e ON we.exercise_id = e.id 
               WHERE we.workout_id = %s 
               ORDER BY we.order_index""",
            (workout_id,)
        )
        exercises = cursor.fetchall()
        workout['exercises'] = exercises
        
        return jsonify(workout), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/workouts/<workout_id>', methods=['DELETE'])
def delete_workout(workout_id):
    """Delete a workout"""
    user_id = require_auth()
    if not user_id:
        return jsonify({'error': 'User ID required'}), 401

    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute("DELETE FROM workouts WHERE id = %s AND user_id = %s", (workout_id, user_id))
        return jsonify({'message': 'Workout deleted'}), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500

# ==================== FAVORITES ====================

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    """Get user's favorite videos"""
    user_id = require_auth()
    if not user_id:
        return jsonify({'error': 'User ID required'}), 401

    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute(
            """SELECT vf.*, v.* FROM video_favorites vf 
               JOIN videos v ON vf.video_id = v.id 
               WHERE vf.user_id = %s""",
            (user_id,)
        )
        favorites = cursor.fetchall()
        return jsonify(favorites), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    """Add a video to favorites"""
    user_id = require_auth()
    if not user_id:
        return jsonify({'error': 'User ID required'}), 401

    data = request.json
    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        favorite_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO video_favorites (id, user_id, video_id) VALUES (%s, %s, %s)",
            (favorite_id, user_id, data.get('video_id'))
        )
        
        cursor.execute("SELECT * FROM video_favorites WHERE id = %s", (favorite_id,))
        favorite = cursor.fetchone()
        return jsonify(favorite), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites/<video_id>', methods=['DELETE'])
def remove_favorite(video_id):
    """Remove a video from favorites"""
    user_id = require_auth()
    if not user_id:
        return jsonify({'error': 'User ID required'}), 401

    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute("DELETE FROM video_favorites WHERE user_id = %s AND video_id = %s", (user_id, video_id))
        return jsonify({'message': 'Favorite removed'}), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500

# ==================== PROFILES ====================

@app.route('/api/profiles/<user_id>', methods=['GET'])
def get_profile(user_id):
    """Get user profile"""
    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute("SELECT * FROM profiles WHERE id = %s", (user_id,))
        profile = cursor.fetchone()
        
        if profile:
            return jsonify(profile), 200
        return jsonify({'error': 'Profile not found'}), 404
    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profiles/<user_id>', methods=['PUT'])
def update_profile(user_id):
    """Update user profile"""
    auth_user_id = require_auth()
    if auth_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    cursor = get_cursor()
    if not cursor:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor.execute(
            "UPDATE profiles SET full_name = %s, bio = %s, avatar_url = %s WHERE id = %s",
            (data.get('full_name'), data.get('bio'), data.get('avatar_url'), user_id)
        )
        
        cursor.execute("SELECT * FROM profiles WHERE id = %s", (user_id,))
        profile = cursor.fetchone()
        return jsonify(profile), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    cursor = get_cursor()
    if cursor:
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    return jsonify({'status': 'unhealthy', 'database': 'disconnected'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5050)