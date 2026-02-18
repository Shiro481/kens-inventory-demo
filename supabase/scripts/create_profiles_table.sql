-- Create a public profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create Policy: Public profiles are viewable by everyone
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);

-- Create Policy: Users can insert their own profile
create policy "Users can insert their own profile" 
on public.profiles for insert 
with check (auto.uid() = id);

-- Create Policy: Users can update their own profile
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- Function to handle new user signup automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'staff' -- Default role
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created in auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
