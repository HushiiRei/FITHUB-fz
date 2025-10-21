-- Convert PostgreSQL ARRAY syntax to MySQL JSON format
-- Insert sample exercises
INSERT INTO exercises (id, name, description, gif_url, muscle_groups, difficulty_level) VALUES
(UUID(), 'Push-up', 'Classic upper body exercise', 'https://media.giphy.com/media/g9GWusSJPDOIU/giphy.gif', JSON_ARRAY('chest', 'triceps', 'shoulders'), 'beginner'),
(UUID(), 'Squat', 'Lower body strength exercise', 'https://media.giphy.com/media/3o7TKU8RhLWXV8knQE/giphy.gif', JSON_ARRAY('quadriceps', 'glutes', 'hamstrings'), 'beginner'),
(UUID(), 'Plank', 'Core stability exercise', 'https://media.giphy.com/media/l0HlDtKo5lWBP4nDi/giphy.gif', JSON_ARRAY('core', 'shoulders'), 'beginner'),
(UUID(), 'Burpee', 'Full body cardio exercise', 'https://media.giphy.com/media/3o6ZsYq8d0MRs37Hao/giphy.gif', JSON_ARRAY('chest', 'legs', 'core'), 'intermediate'),
(UUID(), 'Mountain Climber', 'Cardio and core exercise', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', JSON_ARRAY('core', 'cardio'), 'intermediate');

-- Convert to MySQL syntax with UUID() function
-- Insert sample videos
INSERT INTO videos (id, title, description, category, duration_minutes, difficulty_level, video_url, thumbnail_url, instructor_name) VALUES
(UUID(), 'Beginner Full Body Workout', 'Perfect for starting your fitness journey', 'Full Body', 20, 'beginner', 'https://example.com/video1', 'https://via.placeholder.com/300x200?text=Full+Body', 'Sarah Johnson'),
(UUID(), 'HIIT Cardio Blast', 'High intensity interval training for maximum burn', 'Cardio', 15, 'intermediate', 'https://example.com/video2', 'https://via.placeholder.com/300x200?text=HIIT', 'Mike Chen'),
(UUID(), 'Yoga for Flexibility', 'Improve your flexibility and reduce stress', 'Yoga', 30, 'beginner', 'https://example.com/video3', 'https://via.placeholder.com/300x200?text=Yoga', 'Emma Wilson'),
(UUID(), 'Advanced Strength Training', 'Build muscle with advanced techniques', 'Strength', 45, 'advanced', 'https://example.com/video4', 'https://via.placeholder.com/300x200?text=Strength', 'James Rodriguez'),
(UUID(), 'Core Crusher', 'Intense core workout for six-pack abs', 'Core', 25, 'intermediate', 'https://example.com/video5', 'https://via.placeholder.com/300x200?text=Core', 'Lisa Park');
