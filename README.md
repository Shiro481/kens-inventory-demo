# Ken's Inventory Management System

A premium inventory and POS management system for Ken's Garage.

## 🚀 Getting Started

### Local Development (Docker)
1. Ensure Docker is running.
2. Run `supabase start` to initialize the database.
3. Run `npm install` and `npm run dev`.

### Sample Login Credentials (Local)
For testing and local development, use the following administrator account:

- **Email**: `admin@example.com`
- **Password**: `password123`

*Note: These credentials are automatically created by the `supabase/seed.sql` script.*

## 🛠 Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: CSS Modules
- **Backend/DB**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## 📂 Project Structure
- `src/pages`: Main application views (Dashboard, Auth, etc.)
- `src/lib`: Core utilities (Supabase client)
- `supabase/migrations`: Database schema and RLS policies
- `supabase/seed.sql`: Sample data and initial admin setup

## 🔐 Security
- Row Level Security (RLS) is enabled on all tables.
- Authentication is handled via Supabase Auth.
- Staff members must be present in the `public.admins` table to process sales.
