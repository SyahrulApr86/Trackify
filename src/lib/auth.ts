import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  displayName: string;
}

export async function signUp(username: string, displayName: string, password: string): Promise<User> {
  // Check if username already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  if (existingUser) {
    throw new Error('Username already taken');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user with all required fields
  const { data: user, error } = await supabase
    .from('users')
    .insert([
      {
        username,
        display_name: displayName,
        password_hash: passwordHash,
        email: null // explicitly set to null since it's optional
      }
    ])
    .select()
    .single();

  if (error) throw error;
  if (!user) throw new Error('Failed to create user');

  // Set user context for RLS
  await setUserContext(user.id);

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name
  };
}

export async function signIn(username: string, password: string): Promise<User> {
  // Get user with all required fields
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, display_name, password_hash')
    .eq('username', username)
    .single();

  if (error || !user) {
    throw new Error('Invalid username or password');
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Invalid username or password');
  }

  // Set user context for RLS
  await setUserContext(user.id);

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name
  };
}

export async function signOut(): Promise<void> {
  await supabase.rpc('clear_user_context');
}

async function setUserContext(userId: string): Promise<void> {
  try {
    await supabase.rpc('set_user_context', { user_id: userId });
    
    // Verify the context was set correctly
    const { error: verifyError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (verifyError) {
      throw new Error('Failed to verify user context');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(errorMessage);
  }
}

// Add a function to restore the user context with retries
export async function restoreUserContext(userId: string, maxRetries = 3): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await setUserContext(userId);
      
      // Verify the context was set by making a test query
      const { error: verifyError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (!verifyError) {
        return; // Context was successfully set and verified
      }
      
      lastError = new Error('Failed to verify user context');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      lastError = new Error(errorMessage);
      console.error(`Failed to restore user context (attempt ${attempt}):`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying, with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  // If we get here, all attempts failed
  throw new Error(`Failed to restore user context after ${maxRetries} attempts: ${lastError?.message}`);
}