# 👯 FRENS — Social Planning App

FRENS is a premium, mobile-first social planning app designed for small circles to coordinate hangouts effortlessly. It features real-time availability, AI-assisted scheduling, and shared photo albums.

## 🚀 Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Zustand, Framer Motion
- **Backend**: Node.js, Express, Supabase (Admin SDK)
- **AI**: Anthropic Claude 3.5 Sonnet
- **Database**: PostgreSQL (via Supabase)

## 🛠️ Setup Instructions

### 1. Database Setup (Supabase)
Run the following SQL in your Supabase SQL Editor:

```sql
-- Users Table
create table users (
  id uuid references auth.users not null primary key,
  phone text unique,
  name text,
  emoji text,
  status text default 'free',
  lat float,
  lng float,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Friendships Table
create table friendships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  fren_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, fren_id)
);

-- Hangouts Table
create table hangouts (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references users(id) on delete cascade,
  title text not null,
  emoji text,
  location text,
  datetime timestamp with time zone,
  notes text,
  status text default 'planning',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RSVPs Table
create table rsvps (
  id uuid primary key default uuid_generate_v4(),
  hangout_id uuid references hangouts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  response text check (response in ('going', 'interested', 'skipped')),
  unique(hangout_id, user_id)
);

-- Availability Table
create table availability (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  status text check (status in ('free', 'maybe', 'busy')),
  unique(user_id, date)
);

-- Vibe Options Table
create table vibe_options (
  id uuid primary key default uuid_generate_v4(),
  hangout_id uuid references hangouts(id) on delete cascade,
  created_by uuid references users(id),
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Vibe Votes Table
create table vibe_votes (
  id uuid primary key default uuid_generate_v4(),
  option_id uuid references vibe_options(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  unique(option_id, user_id)
);

-- Photos Table
create table photos (
  id uuid primary key default uuid_generate_v4(),
  hangout_id uuid references hangouts(id) on delete cascade,
  uploaded_by uuid references users(id),
  photo_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### 2. Storage Setup
1. Create a public bucket in Supabase named `hangout_photos`.
2. Set up a RLS policy to allow authenticated uploads.

### 3. Environment Variables
Create `.env` in both `frontend` and `backend` folders.

**Backend (.env):**
```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_claude_api_key
```

**Frontend (.env):**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3000/api
```

### 4. Running the App
```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev
```

## ✨ Key Features
- **Phone OTP Auth**: Secure and social-first login.
- **AI Scheduler**: Claude-powered best-time suggestions based on crew availability.
- **Vibe Voting**: Let the group decide what to do.
- **Nearby Radar**: See which frens are close by for spontaneous plans.
- **Shared Albums**: High-quality photo sharing for every hangout.
