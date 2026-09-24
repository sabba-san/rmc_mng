import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/UI';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">R</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>RMC System</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Universiti Utara Malaysia</div>
          </div>
        </div>

        <div className="auth-title">
          <h2>Welcome back</h2>
          <p>Sign in to the Research Management Centre</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="you@uum.edu.my"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Signing in…</> : 'Sign in →'}
          </button>
        </form>

        <div className="auth-divider">Demo accounts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'Researcher', email: 'researcher@uum.edu.my', pw: 'Researcher@123' },
            { label: 'RMC Admin', email: 'admin@uum.edu.my', pw: 'Admin@123' },
            { label: 'Reviewer/Dean', email: 'dean@uum.edu.my', pw: 'Dean@123' },
          ].map(acc => (
            <button
              key={acc.label}
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: '0.5rem' }}
              onClick={() => { setEmail(acc.email); setPassword(acc.pw); }}
            >
              <span className={`badge badge-${acc.label === 'RMC Admin' ? 'admin' : acc.label === 'Reviewer/Dean' ? 'reviewer' : 'researcher'}`}>
                {acc.label}
              </span>
              {acc.email}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
          New researcher?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)' }}>Create account</Link>
        </p>
      </div>
    </div>
  );
}
