import { UserProfile } from '../types';

const USERS_KEY = 'musify_registered_users_v1';
const CURRENT_USER_KEY = 'musify_current_user_v1';

// Default guest user
const GUEST_USER: UserProfile = {
  id: 'guest_user',
  username: 'Guest Listener',
  email: 'guest@musix.app',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  createdAt: Date.now(),
};

export function getRegisteredUsers(): UserProfile[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function getCurrentUser(): UserProfile {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    // fallback
  }
  return GUEST_USER;
}

export function setCurrentUser(user: UserProfile): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function signupUser(username: string, email: string): UserProfile {
  const users = getRegisteredUsers();
  
  // Check if email or username already exists
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    setCurrentUser(existing);
    return existing;
  }

  const avatarIndex = Math.floor(Math.random() * 5);
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  ];

  const newUser: UserProfile = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username,
    email,
    avatar: avatars[avatarIndex],
    createdAt: Date.now(),
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  setCurrentUser(newUser);
  return newUser;
}

export function loginUser(email: string): UserProfile | null {
  const users = getRegisteredUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) {
    setCurrentUser(found);
    return found;
  }
  return null;
}

export function logoutUser(): UserProfile {
  setCurrentUser(GUEST_USER);
  return GUEST_USER;
}
