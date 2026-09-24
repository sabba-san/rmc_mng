import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">R</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>RMC System</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Universiti Utara Malaysia</div>
          </div>
        </div>
        <div className="auth-title">
          <h2>Create account</h2>
          <p>Register as a researcher to apply for grants</p>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full name</label>
            <input id="reg-name" type="text" className="form-control" placeholder="Dr. Jane Smith" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" className="form-control" placeholder="you@uum.edu.my" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-dept">Department</label>
            <input id="reg-dept" type="text" className="form-control" placeholder="e.g. Computer Science" value={form.department} onChange={set('department')} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-pw">Password</label>
            <input id="reg-pw" type="password" className="form-control" placeholder="Min 8 chars with letter + digit" value={form.password} onChange={set('password')} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Creating account…</> : 'Create account →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
