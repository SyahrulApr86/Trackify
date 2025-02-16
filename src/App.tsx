import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { Loader2, LogOut, AlertCircle, X, ArrowLeft, Kanban, BookText, Clock } from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { DailyNotes } from './components/DailyNotes';
import { TimeProgressBar } from './components/TimeProgressBar';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { restoreUserContext } from './lib/auth';

function App() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [view, setView] = useState<'tasks' | 'notes' | 'progress'>('tasks');
  const { signIn, signUp, signOut, user, loading, error, clearError } = useAuthStore();

  // Restore user context when the app loads with a persisted user
  useEffect(() => {
    if (user) {
      restoreUserContext(user.id).catch(console.error);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          useAuthStore.setState({ error: 'Passwords do not match' });
          return;
        }
        await signUp(username, displayName, password);
      } else {
        await signIn(username, password);
      }
    } catch (error) {
      // Error is handled by the store
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setUsername('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    clearError();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2829&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="bg-card/95 backdrop-blur-sm text-card-foreground rounded-lg border shadow-lg p-8">
            {isSignUp ? (
              <div className="flex items-center mb-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchMode}
                  className="mr-4 hover:bg-background/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold text-center flex-1 pr-8">Create Account</h1>
              </div>
            ) : (
              <div className="mb-8 text-center">
                <div className="flex justify-center mb-4">
                  <Kanban className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Welcome to Trackify</h1>
                <p className="text-sm text-muted-foreground mt-2">Your personal task management solution</p>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearError}
                  className="h-6 w-6 hover:bg-destructive/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-background/50"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50"
                  required
                  minLength={6}
                />
              </div>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background/50"
                    required
                    minLength={6}
                  />
                </div>
              )}
              <Button type="submit" className="w-full">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
              {!isSignUp && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={switchMode}
                  className="w-full bg-background/50 hover:bg-background"
                >
                  Create Account
                </Button>
              )}
            </form>
          </div>
        </div>
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Kanban className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Trackify</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'tasks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('tasks')}
              className="flex items-center gap-2"
            >
              <Kanban className="w-4 h-4" />
              Tasks
            </Button>
            <Button
              variant={view === 'notes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('notes')}
              className="flex items-center gap-2"
            >
              <BookText className="w-4 h-4" />
              Notes
            </Button>
            <Button
              variant={view === 'progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('progress')}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Progress
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'tasks' ? (
          <KanbanBoard />
        ) : view === 'notes' ? (
          <DailyNotes />
        ) : (
          <TimeProgressBar />
        )}
      </main>
    </div>
  );
}

export default App;