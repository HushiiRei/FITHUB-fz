-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  duration_minutes INT,
  difficulty_level ENUM('beginner', 'intermediate', 'advanced'),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  instructor_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_videos_category (category)
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  gif_url TEXT,
  muscle_groups JSON,
  difficulty_level ENUM('beginner', 'intermediate', 'advanced'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty_level ENUM('beginner', 'intermediate', 'advanced'),
  duration_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_workouts_user_id (user_id)
);

-- Create workout_exercises junction table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id VARCHAR(36) PRIMARY KEY,
  workout_id VARCHAR(36) NOT NULL,
  exercise_id VARCHAR(36) NOT NULL,
  sets INT DEFAULT 3,
  reps INT DEFAULT 10,
  rest_seconds INT DEFAULT 60,
  order_index INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  INDEX idx_workout_exercises_workout_id (workout_id)
);

-- Create video_favorites table
CREATE TABLE IF NOT EXISTS video_favorites (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_video (user_id, video_id),
  INDEX idx_video_favorites_user_id (user_id)
);
