from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime
import uuid
import json

app = Flask(__name__)
CORS(app)

def get_db_connection():
    """Create and return a MySQL database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DATABASE", "fithub")
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# ==================== AUTHENTICATION ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register a new user"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')
        full_name = data.get('full_name', '')

        if not email or not password or not username:
            return jsonify({'error': 'Missing required fields'}), 400

        user_id = str(uuid.uuid4())
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Create profile
        profile_data = (user_id, username, full_name, email)
        cursor.execute(
            "INSERT INTO profiles (id, username, full_name, bio) VALUES (%s, %s, %s, %s)",
            profile_data
        )
        connection.commit()

        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id
        }), 201

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        username = data.get('username')

        if not username:
            return jsonify({'error': 'Missing username'}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

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
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# ==================== VIDEOS ====================

@app.route('/api/videos', methods=['GET'])
def get_videos():
    """Get all videos with optional filtering"""
    try:
        category = request.args.get('category')
        difficulty = request.args.get('difficulty')

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

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
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/videos/<video_id>', methods=['GET'])
def get_video(video_id):
    """Get a specific video"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM videos WHERE id = %s", (video_id,))
        video = cursor.fetchone()

        if video:
            return jsonify(video), 200
        return jsonify({'error': 'Video not found'}), 404

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# ==================== EXERCISES ====================

@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    """Get all exercises"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM exercises")
        exercises = cursor.fetchall()

        for exercise in exercises:
            if exercise['muscle_groups']:
                exercise['muscle_groups'] = json.loads(exercise['muscle_groups'])

        return jsonify(exercises), 200

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# ==================== WORKOUTS ====================

@app.route('/api/workouts', methods=['GET'])
def get_user_workouts():
    """Get workouts for authenticated user"""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM workouts WHERE user_id = %s", (user_id,))
        workouts = cursor.fetchall()

        return jsonify(workouts), 200

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/workouts', methods=['POST'])
def create_workout():
    """Create a new workout"""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        data = request.json
        workout_id = str(uuid.uuid4())

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "INSERT INTO workouts (id, user_id, name, description, difficulty_level, duration_minutes) VALUES (%s, %s, %s, %s, %s, %s)",
            (workout_id, user_id, data.get('name'), data.get('description', ''), data.get('difficulty_level', 'beginner'), data.get('duration_minutes', 30))
        )
        connection.commit()

        cursor.execute("SELECT * FROM workouts WHERE id = %s", (workout_id,))
        workout = cursor.fetchone()

        return jsonify(workout), 201

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/workouts/<workout_id>', methods=['GET'])
def get_workout(workout_id):
    """Get a specific workout with exercises"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

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
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/workouts/<workout_id>/exercises', methods=['POST'])
def add_exercise_to_workout(workout_id):
    """Add an exercise to a workout"""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        data = request.json
        exercise_id = str(uuid.uuid4())

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, rest_seconds, order_index) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (exercise_id, workout_id, data.get('exercise_id'), data.get('sets', 3), data.get('reps', 10), data.get('rest_seconds', 60), data.get('order_index', 0))
        )
        connection.commit()

        cursor.execute("SELECT * FROM workout_exercises WHERE id = %s", (exercise_id,))
        exercise = cursor.fetchone()

        return jsonify(exercise), 201

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/workouts/<workout_id>', methods=['DELETE'])
def delete_workout(workout_id):
    """Delete a workout"""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("DELETE FROM workouts WHERE id = %s AND user_id = %s", (workout_id, user_id))
        connection.commit()

        return jsonify({'message': 'Workout deleted'}), 200

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# ==================== FAVORITES ====================

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    """Get user's favorite videos"""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

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
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    """Add a video to favorites"""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        data = request.json
        favorite_id = str(uuid.uuid4())

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "INSERT INTO video_favorites (id, user_id, video_id) VALUES (%s, %s, %s)",
            (favorite_id, user_id, data.get('video_id'))
        )
        connection.commit()

        cursor.execute("SELECT * FROM video_favorites WHERE id = %s", (favorite_id,))
        favorite = cursor.fetchone()

        return jsonify(favorite), 201

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/favorites/<video_id>', methods=['DELETE'])
def remove_favorite(video_id):
    """Remove a video from favorites"""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("DELETE FROM video_favorites WHERE user_id = %s AND video_id = %s", (user_id, video_id))
        connection.commit()

        return jsonify({'message': 'Favorite removed'}), 200

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# ==================== PROFILES ====================

@app.route('/api/profiles/<user_id>', methods=['GET'])
def get_profile(user_id):
    """Get user profile"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM profiles WHERE id = %s", (user_id,))
        profile = cursor.fetchone()

        if profile:
            return jsonify(profile), 200
        return jsonify({'error': 'Profile not found'}), 404

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/profiles/<user_id>', methods=['PUT'])
def update_profile(user_id):
    """Update user profile"""
    try:
        auth_user_id = request.headers.get('X-User-ID')
        if auth_user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.json
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "UPDATE profiles SET full_name = %s, bio = %s, avatar_url = %s WHERE id = %s",
            (data.get('full_name'), data.get('bio'), data.get('avatar_url'), user_id)
        )
        connection.commit()

        cursor.execute("SELECT * FROM profiles WHERE id = %s", (user_id,))
        profile = cursor.fetchone()

        return jsonify(profile), 200

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
