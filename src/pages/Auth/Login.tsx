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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);

    try {
      // Check if admin email (no password required)
      if (email === 'deviy63349@helesco.com') {
        const adminUser = {
          id: 'admin',
          email: 'deviy63349@helesco.com',
          user_metadata: { role: 'admin' }
        };
        onSuccess(adminUser);
      } else {
        // For future password authentication
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
      setError(err.message || 'Authentication failed. Please check your credentials.');
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
          <img src="/kenslogo.jpg" alt="KEN'S GARAGE" className={styles.logoIcon} />
          <h1>System Login</h1>
          <p>Authorized Access Only</p>
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
            {loading ? <Loader2 className={styles.spinner} size={20} /> : 'LOGIN'}
          </button>
        </form>

        <div className={styles.authNote}>
          <p>Admin access: Enter your email address.</p>
          <p>Regular users: Enter both email and password.</p>
          <p>Password must be at least 8 characters with uppercase, lowercase, and numbers.</p>
        </div>
      </div>
    </div>
  );
}
