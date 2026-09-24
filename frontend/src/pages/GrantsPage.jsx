import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { grantsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, EmptyState, Modal, Alert, ConfirmModal } from '../components/UI';
import { formatCurrency, formatDate, GRANT_TYPES, STATUS_LABELS } from '../utils/helpers';

const ALL_STATUSES = ['', 'draft', 'pending', 'under_review', 'approved', 'rejected', 'completed'];

export default function GrantsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // grant being reviewed

  const load = useCallback(() => {
    setLoading(true);
    grantsAPI.list(statusFilter ? { status: statusFilter } : {})
      .then(res => setGrants(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(grantId, newStatus, extra = {}) {
    try {
      await grantsAPI.update(grantId, { status: newStatus, ...extra });
      load();
      setReviewModal(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(grantId) {
    try {
      await grantsAPI.submit(grantId);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-body">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">
            {user.role === 'reviewer' ? '🔍 Review Queue' : user.role === 'admin' ? '📋 All Grants' : '📋 My Grants'}
          </h1>
          <p className="page-subtitle">
            {user.role === 'researcher' ? 'Manage your grant applications and track approval progress' : 'Manage and review grant submissions'}
          </p>
        </div>
        {user.role === 'researcher' && (
          <button className="btn btn-primary" onClick={() => navigate('/grants/new')}>
            ✚ New Application
          </button>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="filter-bar">
        {ALL_STATUSES.map(s => (
          <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === '' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : grants.length === 0 ? (
        <EmptyState icon="📭" title="No grants found" description={user.role === 'researcher' ? 'Submit your first grant application to get started.' : 'No grants match the selected filter.'} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  {user.role !== 'researcher' && <th>Applicant</th>}
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grants.map(g => (
                  <tr key={g.id}>
                    <td>
                      <div className="font-semibold" style={{ maxWidth: 280 }}>{g.title}</div>
                      {g.rejection_reason && <div className="text-xs" style={{ color: 'var(--color-danger)', marginTop: 2 }}>↳ {g.rejection_reason}</div>}
                    </td>
                    {user.role !== 'researcher' && <td className="text-secondary">{g.applicant?.name}<div className="text-xs text-muted">{g.applicant?.department}</div></td>}
                    <td><span className="badge badge-draft">{g.grant_type}</span></td>
                    <td className="font-semibold">{formatCurrency(g.amount_requested)}</td>
                    <td><Badge status={g.status} /></td>
                    <td className="text-muted text-xs">{formatDate(g.created_at)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/grants/${g.id}`)}>View</button>
                        {user.role === 'researcher' && g.status === 'draft' && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/grants/${g.id}/edit`)}>Edit</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(g.id)}>Submit</button>
                          </>
                        )}
                        {(user.role === 'admin') && g.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(g.id, 'under_review')}>Start Review</button>
                        )}
                        {(user.role === 'admin' || user.role === 'reviewer') && g.status === 'under_review' && (
                          <button className="btn btn-primary btn-sm" onClick={() => setReviewModal(g)}>Review</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviewModal && (
        <ReviewModal
          grant={reviewModal}
          onClose={() => setReviewModal(null)}
          onDecision={handleStatusChange}
        />
      )}
    </div>
  );
}

function ReviewModal({ grant, onClose, onDecision }) {
  const [decision, setDecision] = useState('approved');
  const [approvedAmount, setApprovedAmount] = useState(grant.amount_requested || '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await onDecision(grant.id, decision, {
      amount_approved: decision === 'approved' ? parseFloat(approvedAmount) : undefined,
      rejection_reason: decision === 'rejected' ? reason : undefined,
    });
    setLoading(false);
  }

  return (
    <Modal open onClose={onClose} title={`Review: ${grant.title}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${decision === 'approved' ? 'btn-success' : 'btn-danger'}`} onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : decision === 'approved' ? '✓ Approve' : '✕ Reject'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Decision</label>
        <select className="form-control" value={decision} onChange={e => setDecision(e.target.value)}>
          <option value="approved">Approve</option>
          <option value="rejected">Reject</option>
        </select>
      </div>
      {decision === 'approved' && (
        <div className="form-group">
          <label className="form-label">Approved Amount (MYR)</label>
          <input type="number" className="form-control" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} min={0} />
        </div>
      )}
      {decision === 'rejected' && (
        <div className="form-group">
          <label className="form-label">Rejection Reason</label>
          <textarea className="form-control" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide clear justification..." />
        </div>
      )}
      <div className="alert alert-info">
        Requested amount: <strong>{formatCurrency(grant.amount_requested)}</strong>
      </div>
    </Modal>
  );
}
