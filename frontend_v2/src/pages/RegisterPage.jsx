import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner, Button } from '../components/UI';
import { ScrollReveal } from '../components/ScrollReveal';
import { Lock, User, Envelope, Building, Eye, EyeSlash } from '@phosphor-icons/react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters with a letter and digit.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

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
              <img src="/brand/rmc-logo.png" alt="Pusat Pengurusan Penyelidikan (RMC), Universiti Utara Malaysia" className="brand-logo auth-logo-img" />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100} as="div" className="auth-title">
            <h2>Create researcher account</h2>
            <p>Register to apply for grants and track research outputs</p>
          </ScrollReveal>

          <ScrollReveal delay={200} as="form" onSubmit={handleSubmit} className="auth-form" noValidate>
            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full name</label>
              <div className="input-with-icon">
                <User weight="bold" size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-name"
                  type="text"
                  className="form-control"
                  placeholder="Dr. Jane Smith"
                  value={form.name}
                  onChange={set('name')}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email address</label>
              <div className="input-with-icon">
                <Envelope weight="bold" size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-email"
                  type="email"
                  className="form-control"
                  placeholder="you@uum.edu.my"
                  value={form.email}
                  onChange={set('email')}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-dept">Department</label>
              <div className="input-with-icon">
                <Building weight="bold" size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-dept"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Computer Science"
                  value={form.department}
                  onChange={set('department')}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-pw">Password</label>
              <div className="input-with-icon">
                <Lock weight="bold" size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="reg-pw"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Min 8 chars with letter + digit"
                  value={form.password}
                  onChange={set('password')}
                  required
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
              Create account
            </Button>
          </ScrollReveal>

          <ScrollReveal delay={300} as="p" className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="link">Sign in</Link>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}