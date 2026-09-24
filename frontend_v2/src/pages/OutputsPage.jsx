import { useState, useEffect, useCallback } from 'react';
import { outputsAPI, grantsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, Alert, Modal, EmptyState } from '../components/UI';
import { formatDate, OUTPUT_TYPES } from '../utils/helpers';

export default function OutputsPage() {
  const { user } = useAuth();
  const [outputs, setOutputs] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = typeFilter ? { type: typeFilter } : {};
    outputsAPI.list(params)
      .then(res => setOutputs(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user.role === 'researcher' || user.role === 'admin') {
      grantsAPI.list({ status: 'approved' }).then(res => setGrants(res.data)).catch(() => {});
    }
  }, [user.role]);

  return (
    <div className="page-body">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">📄 Research Outputs</h1>
          <p className="page-subtitle">Publications, conferences, patents, and other research KPIs</p>
        </div>
        {(user.role === 'researcher' || user.role === 'admin') && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Output</button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="filter-bar">
        <button className={`filter-chip ${typeFilter === '' ? 'active' : ''}`} onClick={() => setTypeFilter('')}>All</button>
        {OUTPUT_TYPES.map(t => (
          <button key={t} className={`filter-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : outputs.length === 0 ? (
        <EmptyState icon="📄" title="No research outputs yet" description="Declare publications, conferences, and patents to track KPIs." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Authors</th>
                  <th>Venue / Journal</th>
                  <th>Indexing</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {outputs.map(o => (
                  <tr key={o.id}>
                    <td>
                      <div className="font-semibold" style={{ maxWidth: 260 }}>{o.title}</div>
                      {o.doi_or_url && (
                        <a href={o.doi_or_url.startsWith('http') ? o.doi_or_url : `https://${o.doi_or_url}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs" style={{ color: 'var(--color-primary)' }}>
                          ↗ {o.doi_or_url.substring(0, 40)}…
                        </a>
                      )}
                    </td>
                    <td><span className="badge badge-reviewer">{o.output_type}</span></td>
                    <td className="text-secondary text-sm">{o.authors || '—'}</td>
                    <td className="text-secondary text-sm">{o.journal_or_venue || '—'}</td>
                    <td>
                      {o.indexing ? <span className="badge badge-approved">{o.indexing}</span> : '—'}
                      {o.impact_factor && <div className="text-xs text-muted">IF: {o.impact_factor}</div>}
                    </td>
                    <td><Badge status={o.status} /></td>
                    <td className="text-muted text-xs">{formatDate(o.publication_date || o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <AddOutputModal grants={grants} onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />
      )}
    </div>
  );
}

function AddOutputModal({ grants, onClose, onSave }) {
  const [form, setForm] = useState({
    grant_id: '', output_type: 'publication', title: '',
    authors: '', journal_or_venue: '', publication_date: '',
    doi_or_url: '', impact_factor: '', indexing: '', status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  async function submit() {
    if (!form.title.trim() || !form.grant_id || !form.output_type) {
      setError('Title, grant, and type are required.'); return;
    }
    setLoading(true);
    try {
      await outputsAPI.create({ ...form, grant_id: parseInt(form.grant_id), impact_factor: form.impact_factor ? parseFloat(form.impact_factor) : undefined });
      onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add Research Output"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <span className="spinner" /> : 'Save'}</button></>}
    >
      {error && <Alert>{error}</Alert>}
      <div className="form-group">
        <label className="form-label">Linked Grant *</label>
        <select className="form-control" value={form.grant_id} onChange={set('grant_id')} required>
          <option value="">Select a grant…</option>
          {grants.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Output Type *</label>
          <select className="form-control" value={form.output_type} onChange={set('output_type')}>
            {OUTPUT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-control" value={form.status} onChange={set('status')}>
            {['draft','submitted','accepted','published'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group"><label className="form-label">Title *</label><input type="text" className="form-control" value={form.title} onChange={set('title')} /></div>
      <div className="form-group"><label className="form-label">Authors</label><input type="text" className="form-control" placeholder="Smith, J.; Lee, A." value={form.authors} onChange={set('authors')} /></div>
      <div className="form-group"><label className="form-label">Journal / Venue</label><input type="text" className="form-control" placeholder="Nature, ICCV, etc." value={form.journal_or_venue} onChange={set('journal_or_venue')} /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">DOI / URL</label><input type="text" className="form-control" placeholder="https://doi.org/..." value={form.doi_or_url} onChange={set('doi_or_url')} /></div>
        <div className="form-group"><label className="form-label">Indexing</label><input type="text" className="form-control" placeholder="Scopus, ISI, Q1" value={form.indexing} onChange={set('indexing')} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Impact Factor</label><input type="number" step="0.01" className="form-control" value={form.impact_factor} onChange={set('impact_factor')} /></div>
        <div className="form-group"><label className="form-label">Publication Date</label><input type="date" className="form-control" value={form.publication_date} onChange={set('publication_date')} /></div>
      </div>
    </Modal>
  );
}
