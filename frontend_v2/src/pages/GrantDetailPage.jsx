import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { grantsAPI, milestonesAPI, documentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, Alert, Modal, EmptyState } from '../components/UI';
import { formatCurrency, formatDate, timeAgo, REPORT_TYPES, DOC_TYPES } from '../utils/helpers';

export default function GrantDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grant, setGrant] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [msModal, setMsModal] = useState(false);
  const [docModal, setDocModal] = useState(false);

  async function loadAll() {
    try {
      const [gRes, msRes, docRes] = await Promise.all([
        grantsAPI.get(id),
        milestonesAPI.listByGrant(id),
        documentsAPI.listByGrant(id),
      ]);
      setGrant(gRes.data);
      setMilestones(msRes.data);
      setDocuments(docRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [id]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!grant) return null;

  const canEdit = user.role === 'researcher' && grant.applicant?.id === user.id;

  return (
    <div className="page-body">
      <div className="flex items-center gap-3 mb-4">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/grants')}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ fontSize: '1.25rem' }}>{grant.title}</h1>
          <div className="flex gap-2 items-center mt-1">
            <Badge status={grant.status} />
            <span className="text-xs text-muted">{grant.grant_type} grant · {timeAgo(grant.created_at)}</span>
          </div>
        </div>
        {canEdit && grant.status === 'draft' && (
          <button className="btn btn-primary" onClick={() => navigate(`/grants/${id}/edit`)}>Edit Draft</button>
        )}
      </div>

      {/* Tabs */}
      <div className="filter-bar mb-4">
        {['overview', 'milestones', 'documents'].map(t => (
          <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : t === 'milestones' ? '🎯 Milestones' : '🗂 Documents'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title mb-3">Grant Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                ['Applicant', grant.applicant?.name],
                ['Department', grant.applicant?.department],
                ['Grant Type', grant.grant_type],
                ['Amount Requested', formatCurrency(grant.amount_requested)],
                ['Amount Approved', formatCurrency(grant.amount_approved)],
                ['Start Date', formatDate(grant.start_date)],
                ['End Date', formatDate(grant.end_date)],
                ['Reviewer', grant.reviewer?.name || '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted text-sm">{label}</span>
                  <span className="font-semibold text-sm">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-title mb-3">Description</div>
            <p className="text-secondary text-sm" style={{ lineHeight: 1.8 }}>{grant.description || 'No description provided.'}</p>
            {grant.rejection_reason && (
              <div className="alert alert-error mt-3">
                <strong>Rejection reason:</strong> {grant.rejection_reason}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'milestones' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🎯 Project Milestones</span>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => setMsModal(true)}>+ Add Milestone</button>
            )}
          </div>
          {milestones.length === 0 ? (
            <EmptyState icon="🎯" title="No milestones yet" description="Add project milestones to track progress and upload reports." />
          ) : (
            <div className="timeline mt-2">
              {milestones.map(ms => (
                <div key={ms.id} className="timeline-item">
                  <div className={`timeline-dot ${ms.status === 'completed' ? 'completed' : ''}`} />
                  <div className="card" style={{ marginLeft: '0.5rem', padding: '1rem' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{ms.title}</span>
                      <Badge status={ms.status} />
                    </div>
                    {ms.report_type && <span className="badge badge-draft" style={{ marginBottom: 8 }}>{ms.report_type} report</span>}
                    {ms.description && <p className="text-secondary text-sm mb-2">{ms.description}</p>}
                    <div className="flex gap-4 text-xs text-muted">
                      {ms.due_date && <span>📅 Due {formatDate(ms.due_date)}</span>}
                      {ms.financial_claim_amount && <span>💰 Claim: {formatCurrency(ms.financial_claim_amount)}</span>}
                    </div>
                    {ms.progress_notes && (
                      <div className="alert alert-info mt-2" style={{ fontSize: '0.78rem' }}>
                        📝 {ms.progress_notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🗂 Document Vault</span>
            <button className="btn btn-primary btn-sm" onClick={() => setDocModal(true)}>+ Upload</button>
          </div>
          {documents.length === 0 ? (
            <EmptyState icon="📁" title="No documents yet" description="Upload proposals, receipts, progress reports, and more." />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Filename</th><th>Type</th><th>Size</th><th>Uploaded by</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td className="font-semibold">{doc.original_filename}</td>
                      <td><span className="badge badge-draft">{doc.doc_type}</span></td>
                      <td className="text-muted text-xs">{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                      <td className="text-secondary">{doc.uploader?.name}</td>
                      <td className="text-muted text-xs">{formatDate(doc.created_at)}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={async () => {
                          const res = await documentsAPI.download(doc.id);
                          const url = URL.createObjectURL(res.data);
                          const a = document.createElement('a');
                          a.href = url; a.download = doc.original_filename;
                          a.click(); URL.revokeObjectURL(url);
                        }}>↓ Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {msModal && (
        <AddMilestoneModal grantId={id} onClose={() => setMsModal(false)} onSave={() => { setMsModal(false); loadAll(); }} />
      )}
      {docModal && (
        <UploadDocModal grantId={id} onClose={() => setDocModal(false)} onSave={() => { setDocModal(false); loadAll(); }} />
      )}
    </div>
  );
}

function AddMilestoneModal({ grantId, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', due_date: '', report_type: '', financial_claim_amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  async function submit() {
    if (!form.title.trim()) { setError('Title required'); return; }
    setLoading(true);
    try {
      await milestonesAPI.create({ ...form, grant_id: parseInt(grantId), financial_claim_amount: form.financial_claim_amount ? parseFloat(form.financial_claim_amount) : undefined });
      onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add Milestone"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <span className="spinner" /> : 'Save'}</button></>}
    >
      {error && <Alert>{error}</Alert>}
      <div className="form-group"><label className="form-label">Title *</label><input type="text" className="form-control" value={form.title} onChange={set('title')} /></div>
      <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={set('description')} /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-control" value={form.due_date} onChange={set('due_date')} /></div>
        <div className="form-group"><label className="form-label">Report Type</label><select className="form-control" value={form.report_type} onChange={set('report_type')}><option value="">None</option>{REPORT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
      </div>
      <div className="form-group"><label className="form-label">Financial Claim (MYR)</label><input type="number" className="form-control" value={form.financial_claim_amount} onChange={set('financial_claim_amount')} min={0} /></div>
    </Modal>
  );
}

function UploadDocModal({ grantId, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('proposal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!file) { setError('Please select a file.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('grant_id', grantId);
      fd.append('doc_type', docType);
      await documentsAPI.upload(fd);
      onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <Modal open onClose={onClose} title="Upload Document"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <span className="spinner" /> : '↑ Upload'}</button></>}
    >
      {error && <Alert>{error}</Alert>}
      <div className="form-group">
        <label className="form-label">Document Type</label>
        <select className="form-control" value={docType} onChange={e => setDocType(e.target.value)}>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div className="upload-zone" onClick={() => document.getElementById('file-input').click()}>
        {file ? (
          <div><span style={{ fontSize: '1.5rem' }}>📄</span><div className="mt-2 font-semibold">{file.name}</div><div className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</div></div>
        ) : (
          <div><span style={{ fontSize: '2rem' }}>📤</span><div className="mt-2 text-secondary">Click to select file</div><div className="text-xs text-muted mt-1">PDF, PNG, JPG, DOCX, XLSX · Max 10 MB</div></div>
        )}
        <input id="file-input" type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" onChange={e => setFile(e.target.files[0])} />
      </div>
    </Modal>
  );
}
