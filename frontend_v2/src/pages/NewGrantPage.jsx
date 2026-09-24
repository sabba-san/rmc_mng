import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { grantsAPI } from '../utils/api';
import { Alert } from '../components/UI';
import { GRANT_TYPES } from '../utils/helpers';

export default function NewGrantPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', grant_type: 'internal',
    amount_requested: '', start_date: '', end_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.amount_requested) {
      setError('Title and amount are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await grantsAPI.create({
        ...form,
        amount_requested: parseFloat(form.amount_requested),
      });
      navigate(`/grants/${res.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-body">
      <div className="mb-4">
        <h1 className="page-title">✚ New Grant Application</h1>
        <p className="page-subtitle">Complete the form below to submit a new research funding application</p>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        {/* Step indicator */}
        <div className="flex gap-2 mb-4" style={{ padding: '0 0 1rem', borderBottom: '1px solid var(--color-border)' }}>
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2" onClick={() => setStep(s)} style={{ cursor: 'pointer' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: step >= s ? 'white' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s',
              }}>{s}</div>
              <span style={{ fontSize: '0.825rem', color: step >= s ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: step === s ? 600 : 400 }}>
                {s === 1 ? 'Basic Information' : 'Grant Details'}
              </span>
              {s < 2 && <span style={{ color: 'var(--color-border)', margin: '0 0.5rem' }}>›</span>}
            </div>
          ))}
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="grant-title">Research Title *</label>
                <input id="grant-title" type="text" className="form-control" placeholder="e.g. AI-Powered Drug Discovery Using Deep Learning" value={form.title} onChange={set('title')} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="grant-desc">Project Description</label>
                <textarea id="grant-desc" className="form-control" rows={5} placeholder="Describe your research objectives, methodology, and expected outcomes..." value={form.description} onChange={set('description')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="grant-type">Grant Type *</label>
                <select id="grant-type" className="form-control" value={form.grant_type} onChange={set('grant_type')}>
                  {GRANT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/grants')}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={() => { if (!form.title.trim()) { setError('Title is required.'); return; } setError(''); setStep(2); }}>
                  Next →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="grant-amount">Amount Requested (MYR) *</label>
                  <input id="grant-amount" type="number" className="form-control" placeholder="e.g. 50000" value={form.amount_requested} onChange={set('amount_requested')} min={1} required />
                </div>
                <div />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="grant-start">Project Start Date</label>
                  <input id="grant-start" type="date" className="form-control" value={form.start_date} onChange={set('start_date')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="grant-end">Project End Date</label>
                  <input id="grant-end" type="date" className="form-control" value={form.end_date} onChange={set('end_date')} />
                </div>
              </div>

              <div className="alert alert-info mt-4">
                💡 Your application will be saved as a <strong>Draft</strong>. You can review and submit it from the Grants list.
              </div>

              <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner" style={{width:16,height:16}} /> Saving…</> : '💾 Save Draft'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
