# Lookbook - Social Network Platform

A modern social networking platform built with Django REST Framework and React.

## Features

- 🔐 User authentication with JWT
- 📝 Create, read, update, and delete posts
- ❤️ Like and unlike posts
- 💬 Comment on posts
- 👥 Friend system (send, accept, reject friend requests)
- 👤 User profiles with customizable information
- 📱 Responsive design with TailwindCSS
- 🎨 Modern UI with Lucide icons

## Tech Stack

### Backend
- Django 5.2.7
- Django REST Framework 3.15.2
- Simple JWT for authentication
- SQLite database
- Pillow for image handling

### Frontend
- React 18.2
- Vite
- TailwindCSS
- Axios for API calls
- React Router for navigation
- Lucide React for icons
- date-fns for date formatting

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```
- Linux/Mac:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create a superuser:
```bash
python manage.py createsuperuser
```

7. Run the development server:
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token

### Users
- `POST /api/users/register/` - Register new user
- `GET /api/users/profile/` - Get current user profile
- `PATCH /api/users/profile/` - Update current user profile
- `GET /api/users/{id}/` - Get user by ID

### Posts
- `GET /api/posts/` - List all posts
- `POST /api/posts/` - Create new post
- `GET /api/posts/{id}/` - Get post by ID
- `PATCH /api/posts/{id}/` - Update post
- `DELETE /api/posts/{id}/` - Delete post
- `POST /api/posts/{id}/like/` - Toggle like on post

### Comments
- `GET /api/comments/post/{post_id}/` - List comments for a post
- `POST /api/comments/post/{post_id}/` - Create comment
- `PATCH /api/comments/{id}/` - Update comment
- `DELETE /api/comments/{id}/` - Delete comment

### Friends
- `GET /api/friends/` - List friends
- `POST /api/friends/request/{user_id}/` - Send friend request
- `POST /api/friends/accept/{friendship_id}/` - Accept friend request
- `POST /api/friends/reject/{friendship_id}/` - Reject friend request

## Project Structure

```
Lookbook/
├── backend/
│   ├── lookbook/          # Project settings
│   ├── users/             # User app
│   ├── posts/             # Posts app
│   ├── comments/          # Comments app
│   ├── friends/           # Friends app
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   ├── context/       # React context
    │   ├── utils/         # Utility functions
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Usage

1. Start both backend and frontend servers
2. Open `http://localhost:5173` in your browser
3. Register a new account or login
4. Start creating posts, connecting with friends, and engaging with content!

## Admin Panel

Access the Django admin panel at `http://localhost:8000/admin/` with your superuser credentials.

## License

MIT License
