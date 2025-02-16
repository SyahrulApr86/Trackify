# Trackify

A modern task and note management application built with React, TypeScript, and Supabase. Trackify helps you organize your work with a beautiful Kanban board, daily notes, and powerful task management features.

![Trackify Screenshot](https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2829&auto=format&fit=crop)

## ✨ Features

### 📋 Task Management
- **Kanban Board**: Intuitive drag-and-drop interface for managing tasks
- **Multiple Views**: 
  - 📊 Kanban board for visual task management
  - 📑 Table view with sorting and bulk actions
  - 📁 Category view for better organization
  - 🗄️ Archive for completed tasks
- **Rich Task Features**:
  - ⏰ Deadline tracking with reminders
  - 🏷️ Customizable categories
  - 🔖 Flexible tagging system
  - 📝 Detailed task descriptions
  - 📊 Status tracking (To Do, In Progress, Done)
  - 🔄 Automatic archiving of completed tasks after 7 days

### 📓 Daily Notes
- 📝 Create and manage daily notes
- 📅 Date-based organization
- 🔍 Quick view and edit functionality
- 🎯 Focus on daily tasks and thoughts
- 📊 Organized grid layout view

### 👤 User Features
- 🔐 Secure authentication
- 🏠 Personal workspace
- 🔒 Data privacy with row-level security
- 🎨 Clean and intuitive interface

## 🛠️ Tech Stack

### Frontend
- ⚛️ React 18 with TypeScript
- 🚀 Vite for fast development
- 🎨 Tailwind CSS for styling
- 🎯 Lucide Icons for beautiful icons
- 🔄 Hello Pangea DND for drag-and-drop
- 🎛️ Radix UI for accessible components
- 📅 Date-fns for date manipulation
- 🗃️ Zustand for state management

### Backend
- 🔥 Supabase (PostgreSQL)
- 🔒 Row Level Security
- 🔄 Real-time capabilities
- 🔑 Secure authentication system

## 🚀 Getting Started

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- Supabase account

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd trackify
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file
cp .env.example .env

# Add your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

### Docker Deployment

1. Build and run with Docker Compose:
```bash
# Build the containers
docker-compose build

# Start the services
docker-compose up -d

# View logs
docker-compose logs -f
```

2. Access the application at `http://localhost:80`

## 🗄️ Database Setup

1. Create a new Supabase project
2. Run the migration files:
   ```bash
   # Navigate to migrations directory
   cd supabase/migrations
   
   # Apply migrations through Supabase dashboard or CLI
   ```
3. Enable Row Level Security (RLS)
4. Configure authentication settings

## 💡 Usage Guide

### Task Management

#### Creating Tasks
1. Click "Add a task" in any column
2. Fill in:
   - Title (required)
   - Description (optional)
   - Deadline (optional)
   - Category (optional)
   - Tags (optional)
3. Click "Create Task"

#### Managing Tasks
- **Drag & Drop**: Move tasks between columns
- **Edit**: Click on a task to view/edit details
- **Bulk Actions**: Use table view for multiple tasks
- **Filter**: By category, status, or tags
- **Search**: Find tasks by title or description

#### Categories
- Create custom categories
- Organize tasks by category
- Manage category settings

#### Archive
- View archived tasks
- Restore when needed
- Automatic archiving after 7 days

### Daily Notes

#### Creating Notes
1. Click "New Note"
2. Choose:
   - Date
   - Title (optional)
   - Content
3. Save note

#### Managing Notes
- View all notes in grid layout
- Click to view full details
- Edit or delete as needed
- Organize by date

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Lucide Icons](https://lucide.dev/) - Beautiful, consistent icons
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces