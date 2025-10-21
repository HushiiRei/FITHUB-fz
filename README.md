# FitHub - Fitness Streaming Platform

A comprehensive fitness streaming platform with video library, workout planner, and user accounts.

## Features

- **Video Library**: Browse and stream professional fitness videos by category and difficulty level
- **Workout Planner**: Create custom workout routines with exercises, sets, reps, and rest times
- **User Accounts**: Register, login, and manage your profile
- **Favorites**: Save your favorite videos for quick access
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Project Structure

\`\`\`
fithub/
├── index.html              # Home page
├── videos.html             # Video library page
├── workout-planner.html    # Workout planner page
├── profile.html            # User profile page
├── styles.css              # Global styles with purple theme
├── script.js               # Main authentication and shared functionality
├── videos.js               # Video library functionality
├── workout-planner.js      # Workout planner functionality
├── profile.js              # Profile page functionality
├── app.py                  # Flask backend
├── requirements.txt        # Python dependencies
└── scripts/
    ├── 01-create-schema.sql    # Database schema
    └── 02-seed-data.sql        # Sample data
\`\`\`

## Setup Instructions

### Backend Setup

1. Install Python dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Set up environment variables:
\`\`\`bash
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
\`\`\`

3. Run the Flask server:
\`\`\`bash
python app.py
\`\`\`

The backend will be available at `http://localhost:5000`

### Database Setup

1. Connect to your Supabase project
2. Run the SQL scripts in order:
   - `scripts/01-create-schema.sql` - Creates tables and RLS policies
   - `scripts/02-seed-data.sql` - Adds sample exercises and videos

### Frontend Setup

1. Open `index.html` in a web browser or serve with a local server
2. Update `API_BASE_URL` in `script.js` if your backend is on a different port

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Videos
- `GET /api/videos` - Get all videos (supports filtering by category and difficulty)
- `GET /api/videos/<id>` - Get specific video

### Exercises
- `GET /api/exercises` - Get all exercises

### Workouts
- `GET /api/workouts` - Get user's workouts
- `POST /api/workouts` - Create new workout
- `GET /api/workouts/<id>` - Get specific workout with exercises
- `POST /api/workouts/<id>/exercises` - Add exercise to workout
- `DELETE /api/workouts/<id>` - Delete workout

### Favorites
- `GET /api/favorites` - Get user's favorite videos
- `POST /api/favorites` - Add video to favorites
- `DELETE /api/favorites/<video_id>` - Remove video from favorites

### Profiles
- `GET /api/profiles/<user_id>` - Get user profile
- `PUT /api/profiles/<user_id>` - Update user profile

## Color Scheme

- Primary Purple: `#7c3aed`
- Dark Purple: `#6d28d9`
- Light Purple: `#a78bfa`
- Neutral Dark: `#1f2937`
- Neutral Light: `#f3f4f6`

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python Flask, Flask-CORS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Future Enhancements

- Video streaming integration
- Social features (follow users, share workouts)
- Progress tracking and statistics
- Mobile app
- Payment integration for premium content
- AI-powered workout recommendations
