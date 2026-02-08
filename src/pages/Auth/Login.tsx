import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import styles from './Login.module.css';

interface LoginProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export default function Login({ onBack, onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          alert('Check your email for confirmation link!');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onSuccess(data.user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay}></div>
      
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={20} /> Back to Home
      </button>

      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>K</div>
          <h1>{isSignUp ? 'Create Account' : 'System Login'}</h1>
          <p>{isSignUp ? 'Join Ken\'s Garage Inventory System' : 'Authorized Access Only'}</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleAuth} className={styles.form}>
          <div className={styles.inputGroup}>
            <Mail className={styles.icon} size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock className={styles.icon} size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className={styles.spinner} size={20} /> : (isSignUp ? 'SIGN UP' : 'LOGIN')}
          </button>
        </form>

        <div className={styles.toggleAuth}>
          {isSignUp ? (
            <p>Already have an account? <span onClick={() => setIsSignUp(false)}>Login here</span></p>
          ) : (
            <p>Need an account? <span onClick={() => setIsSignUp(true)}>Contact admin or sign up</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
