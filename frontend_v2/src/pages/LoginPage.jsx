import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Button } from '../components/UI';
import { ScrollReveal } from '../components/ScrollReveal';
import { Lock, Envelope, Eye, EyeSlash } from '@phosphor-icons/react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const demoAccounts = [
    { label: 'Researcher', email: 'researcher@uum.edu.my', pw: 'Researcher@123', role: 'researcher' },
    { label: 'RMC Admin', email: 'admin@uum.edu.my', pw: 'Admin@123', role: 'admin' },
    { label: 'Reviewer/Dean', email: 'dean@uum.edu.my', pw: 'Dean@123', role: 'reviewer' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-background" aria-hidden="true">
        <div className="auth-gradient-blob" />
        <div className="auth-gradient-blob auth-gradient-blob-2" />
      </div>

      <div className="container">
        <div className="auth-card">
          <ScrollReveal delay={0} as="div" className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">R</div>
              <div>
                <div className="auth-logo-title">RMC System</div>
                <div className="auth-logo-subtitle">Universiti Utara Malaysia</div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100} as="div" className="auth-title">
            <h2>Welcome back</h2>
            <p>Sign in to the Research Management Centre</p>
          </ScrollReveal>

          <ScrollReveal delay={200} as="form" onSubmit={handleSubmit} className="auth-form" noValidate>
            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="input-with-icon">
                <Envelope weight="bold" size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="you@uum.edu.my"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock weight="bold" size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeSlash weight="bold" size={18} /> : <Eye weight="bold" size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Sign in
            </Button>
          </ScrollReveal>

          <ScrollReveal delay={300} as="div" className="auth-divider">
            <span>Demo accounts</span>
          </ScrollReveal>

          <ScrollReveal delay={400} as="div" className="demo-accounts">
            {demoAccounts.map(acc => (
              <button
                key={acc.label}
                type="button"
                className="btn btn-secondary demo-account-btn"
                onClick={() => { setEmail(acc.email); setPassword(acc.pw); }}
                disabled={loading}
              >
                <span className={`badge badge-${acc.role} mr-2`}>{acc.label}</span>
                {acc.email}
              </button>
            ))}
          </ScrollReveal>

          <ScrollReveal delay={500} as="p" className="auth-footer">
            New researcher?{' '}
            <Link to="/register" className="link">Create account</Link>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}