import { useState, useEffect, useCallback } from 'react';
import { milestonesAPI, grantsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, Alert, Modal, EmptyState } from '../components/UI';
import { formatDate, formatCurrency, REPORT_TYPES } from '../utils/helpers';

const MILESTONE_STATUSES = ['pending', 'in_progress', 'completed', 'overdue'];

export default function MilestonesPage() {
  const { user } = useAuth();
  const [grants, setGrants] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateModal, setUpdateModal] = useState(null);

  useEffect(() => {
    grantsAPI.list().then(res => {
      setGrants(res.data);
      if (res.data.length > 0) setSelectedGrant(String(res.data[0].id));
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const loadMilestones = useCallback(() => {
    if (!selectedGrant) return;
    milestonesAPI.listByGrant(selectedGrant)
      .then(res => setMilestones(res.data))
      .catch(err => setError(err.message));
  }, [selectedGrant]);

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  async function updateMilestone(id, data) {
    try {
      await milestonesAPI.update(id, data);
      loadMilestones();
      setUpdateModal(null);
    } catch (err) { setError(err.message); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="page-body">
      <div className="mb-4">
        <h1 className="page-title">🎯 Milestones & Progress</h1>
        <p className="page-subtitle">Track deliverables, progress reports, and financial claims across your grants</p>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="card mb-4">
        <label className="form-label">Select Grant</label>
        <select className="form-control" value={selectedGrant} onChange={e => setSelectedGrant(e.target.value)} style={{ maxWidth: 500 }}>
          {grants.map(g => <option key={g.id} value={g.id}>{g.title} — {g.status}</option>)}
        </select>
      </div>

      {milestones.length === 0 ? (
        <EmptyState icon="🎯" title="No milestones for this grant" description="Milestones are added from the Grant Detail page." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {milestones.map(ms => (
            <div key={ms.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2 items-center">
                  <span style={{ fontSize: '1.25rem' }}>
                    {ms.status === 'completed' ? '✅' : ms.status === 'overdue' ? '⚠️' : ms.status === 'in_progress' ? '🔄' : '⏳'}
                  </span>
                  <div>
                    <div className="font-semibold">{ms.title}</div>
                    {ms.report_type && <span className="badge badge-draft mt-1">{ms.report_type.replace(/_/g, ' ')} report</span>}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge status={ms.status} />
                  <button className="btn btn-secondary btn-sm" onClick={() => setUpdateModal(ms)}>Update</button>
                </div>
              </div>
              {ms.description && <p className="text-secondary text-sm mb-3">{ms.description}</p>}
              <div className="flex gap-4 text-xs text-muted flex-wrap">
                {ms.due_date && <span>📅 Due {formatDate(ms.due_date)}</span>}
                {ms.financial_claim_amount && <span>💰 Financial claim: <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(ms.financial_claim_amount)}</strong></span>}
              </div>
              {ms.progress_notes && (
                <div className="alert alert-info mt-3 text-sm">
                  📝 Progress notes: {ms.progress_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {updateModal && (
        <UpdateMilestoneModal
          milestone={updateModal}
          onClose={() => setUpdateModal(null)}
          onSave={(data) => updateMilestone(updateModal.id, data)}
        />
      )}
    </div>
  );
}

function UpdateMilestoneModal({ milestone, onClose, onSave }) {
  const [status, setStatus] = useState(milestone.status);
  const [notes, setNotes] = useState(milestone.progress_notes || '');
  const [claim, setClaim] = useState(milestone.financial_claim_amount || '');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await onSave({ status, progress_notes: notes, financial_claim_amount: claim ? parseFloat(claim) : undefined });
    setLoading(false);
  }

  return (
    <Modal open onClose={onClose} title={`Update: ${milestone.title}`}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <span className="spinner" /> : 'Save Update'}</button></>}
    >
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
          {MILESTONE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Progress Notes</label>
        <textarea className="form-control" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe progress, challenges, or completed deliverables..." />
      </div>
      <div className="form-group">
        <label className="form-label">Financial Claim Amount (MYR)</label>
        <input type="number" className="form-control" value={claim} onChange={e => setClaim(e.target.value)} min={0} />
      </div>
    </Modal>
  );
}
