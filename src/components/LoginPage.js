import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import './LoginPage.css';
import LoginBackground from './LoginBackground'; // Import the new LoginBackground component

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export default function LoginPage({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, githubProvider);
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <LoginBackground /> {/* Render the new LoginBackground component */}
      <div className="login-container glass-panel glass-panel-hover">
        <div className="project-intro">
          <img src="/static/media/aether-logo.588fd633233a8dba939d.png" alt="Aether AI Logo" className="intro-logo" />
          <h1 className="intro-title gradient-text">Aether AI</h1>
          <p className="intro-tagline">The Ultimate Conversational AI Experience</p>
        </div>
        <h2 className="login-title">{isRegister ? 'Register' : 'Sign In'}</h2>
        {error && <div className="login-error">{error}</div>}
        <form className="login-form" autoComplete="on" onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="input-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2.5" y="5.5" width="23" height="17" rx="6" fill="#172a43" stroke="#7ae2ff" strokeWidth="2.2"/>
                <path d="M6 9l8 6.5L22 9" stroke="#3bb3ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <input type="email" placeholder="Email" required className="login-input glass-input" tabIndex={1} value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="input-group">
            <span className="input-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="6.4" y="12" width="15.2" height="9" rx="3.2" fill="#172a43" stroke="#7ae2ff" strokeWidth="2.2"/>
                <rect x="10.2" y="15.2" width="7.6" height="3" rx="1.5" fill="#3bb3ff"/>
                <circle cx="14" cy="12" r="4.2" stroke="#7ae2ff" strokeWidth="1.7" fill="#172a43"/>
              </svg>
            </span>
            <input type="password" placeholder="Password" required className="login-input glass-input" tabIndex={2} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="login-btn btn btn-primary shimmer" tabIndex={3} disabled={loading}>
            {loading ? '...' : (isRegister ? 'Register' : 'Sign In')}
          </button>
        </form>
        <div className="provider-btns-row">
          <button className="google-btn provider-btn" tabIndex={4} onClick={handleGoogleSignIn} disabled={loading}>
            <span className="provider-icon google-custom">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <g><path d="M21.805 10.023h-9.765v3.955h5.625c-.242 1.238-1.264 3.637-5.625 3.637-3.387 0-6.151-2.807-6.151-6.264s2.764-6.264 6.151-6.264c1.928 0 3.221.82 3.963 1.527l2.705-2.634c-1.711-1.59-3.918-2.574-6.668-2.574-5.522 0-10 4.477-10 10s4.478 10 10 10c5.756 0 9.575-4.047 9.575-9.75 0-.654-.07-1.15-.162-1.659z" fill="#7ae2ff"/></g>
              </svg>
            </span>
            <span className="btn-label">Google</span>
          </button>
          <button className="github-btn provider-btn" tabIndex={5} onClick={handleGithubSignIn} disabled={loading}>
            <span className="provider-icon github-custom">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <g><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.189 6.839 9.525.5.09.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.031 1.532 1.031.892 1.53 2.341 1.088 2.91.832.09-.647.349-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.104-.254-.446-1.273.098-2.654 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.338 1.909-1.295 2.748-1.025 2.748-1.025.546 1.381.203 2.4.1 2.654.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.576.688.479C19.138 20.208 22 16.448 22 12.021 22 6.484 17.523 2 12 2z" fill="#a6f1ff"/></g>
              </svg>
            </span>
            <span className="btn-label">GitHub</span>
          </button>
        </div>
        <div className="toggle-auth">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button className="toggle-btn" tabIndex={6} onClick={() => setIsRegister(v => !v)}>
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
