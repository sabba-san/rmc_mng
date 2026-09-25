import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { grantsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, EmptyState, Modal, Alert, ConfirmModal, Button, FilterChips } from '../components/UI';
import { formatCurrency, formatDate, GRANT_TYPES, STATUS_LABELS } from '../utils/helpers';
import { ScrollReveal, StaggeredReveal } from '../components/ScrollReveal';
import {
  Plus, MagnifyingGlass, Funnel, Eye, Pencil, PaperPlane, Clock, CheckCircle, X,
  FileText, Users, Shield, Trash
} from '@phosphor-icons/react';

const ALL_STATUSES = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
];

export default function GrantsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

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

  async function handleDelete(grantId) {
    try {
      await grantsAPI.delete(grantId);
      load();
      setDeleteModal(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-body">
      <div className="page-header-content">
        <div>
          <ScrollReveal as="h1" className="page-title">
            {user.role === 'reviewer' ? 'Review Queue' : user.role === 'admin' ? 'All Grants' : 'My Grants'}
          </ScrollReveal>
          <ScrollReveal delay={100} as="p" className="page-subtitle">
            {user.role === 'researcher' ? 'Manage your grant applications and track approval progress' : 'Manage and review grant submissions'}
          </ScrollReveal>
        </div>
        {user.role === 'researcher' && (
          <ScrollReveal delay={200} as="div">
            <Button variant="primary" onClick={() => navigate('/grants/new')}>
              <Plus weight="bold" size={18} className="mr-2" />
              New Application
            </Button>
          </ScrollReveal>
        )}
      </div>

      {error && <ScrollReveal as="div"><Alert type="error">{error}</Alert></ScrollReveal>}

      <ScrollReveal delay={100} as="div" className="filter-section">
        <FilterChips
          options={ALL_STATUSES}
          value={statusFilter}
          onChange={setStatusFilter}
          className="filter-chips"
        />
      </ScrollReveal>

      <ScrollReveal delay={200} as="div">
        {loading ? (
          <Spinner size={32} className="page-loading" />
        ) : grants.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No grants found"
            description={user.role === 'researcher' ? 'Submit your first grant application to get started.' : 'No grants match the selected filter.'}
            action={user.role === 'researcher' && <Button variant="primary" onClick={() => navigate('/grants/new')}>New Application</Button>}
          />
        ) : (
          <div className="card grants-table-card">
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
                    {grants.map((g) => (
                      <tr key={g.id}>
                        <td>
                          <div className="grant-title-cell">
                            <span className="font-semibold truncate" style={{ maxWidth: 320 }}>{g.title}</span>
                            {g.rejection_reason && (
                              <div className="text-sm text-accent-red mt-1">
                                <X weight="bold" size={12} className="inline mr-1" />
                                {g.rejection_reason}
                              </div>
                            )}
                          </div>
                        </td>
                        {user.role !== 'researcher' && (
                          <td className="text-secondary">
                            {g.applicant?.name}
                            {g.applicant?.department && <div className="text-caption text-muted">{g.applicant.department}</div>}
                          </td>
                        )}
                        <td><Badge className="badge-draft">{g.grant_type}</Badge></td>
                        <td className="font-semibold">{formatCurrency(g.amount_requested)}</td>
                        <td><Badge status={g.status} /></td>
                        <td className="text-muted text-sm">{formatDate(g.created_at)}</td>
                        <td>
                          <div className="action-buttons">
                            <Button variant="secondary" size="sm" onClick={() => navigate(`/grants/${g.id}`)}>
                              <Eye weight="bold" size={14} />
                            </Button>
                            {user.role === 'researcher' && g.status === 'draft' && (
                              <>
                                <Button variant="secondary" size="sm" onClick={() => navigate(`/grants/${g.id}/edit`)}>
                                  <Pencil weight="bold" size={14} />
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => handleSubmit(g.id)}>
                                  <PaperPlane weight="bold" size={14} />
                                </Button>
                              </>
                            )}
                            {(user.role === 'admin') && g.status === 'pending' && (
                              <Button variant="primary" size="sm" onClick={() => handleStatusChange(g.id, 'under_review')}>
                                <Clock weight="bold" size={14} />
                                Start Review
                              </Button>
                            )}
                            {(user.role === 'admin' || user.role === 'reviewer') && g.status === 'under_review' && (
                              <Button variant="primary" size="sm" onClick={() => setReviewModal(g)}>
                                <Shield weight="bold" size={14} />
                                Review
                              </Button>
                            )}
                            {user.role === 'researcher' && g.status === 'draft' && (
                              <Button variant="ghost" size="sm" onClick={() => setDeleteModal(g)} className="text-accent-red">
                                <Trash weight="bold" size={14} />
                              </Button>
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
      </ScrollReveal>

      {reviewModal && (
        <ReviewModal
          grant={reviewModal}
          onClose={() => setReviewModal(null)}
          onDecision={handleStatusChange}
        />
      )}

      {deleteModal && (
        <ConfirmModal
          open
          onClose={() => setDeleteModal(null)}
          onConfirm={() => handleDelete(deleteModal.id)}
          title="Delete Grant"
          message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
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
    <Modal open onClose={onClose} title={`Review: ${grant.title}`} size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={decision === 'approved' ? 'success' : 'danger'} onClick={submit} loading={loading} disabled={loading}>
            {decision === 'approved' ? 'Approve' : 'Reject'}
          </Button>
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
      <Alert type="info">
        Requested amount: <strong>{formatCurrency(grant.amount_requested)}</strong>
      </Alert>
    </Modal>
  );
}