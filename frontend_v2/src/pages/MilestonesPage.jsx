import { useState, useEffect, useCallback } from 'react';
import { milestonesAPI, grantsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, Alert, Modal, EmptyState, Button, Input, Textarea, Select } from '../components/UI';
import { formatDate, formatCurrency, REPORT_TYPES } from '../utils/helpers';
import { ScrollReveal, StaggeredReveal } from '../components/ScrollReveal';
import {
  Target, CheckCircle, Clock, Warning, CaretRight,
  CurrencyDollar, Pencil, FileText, Calendar
} from '@phosphor-icons/react';

const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_ICONS = {
  pending: Clock,
  in_progress: CaretRight,
  completed: CheckCircle,
  overdue: Warning,
};

const STATUS_COLORS = {
  pending: { bg: '#FBF3DB', text: '#956400' },
  in_progress: { bg: '#E3EDF7', text: '#104E90' },
  completed: { bg: '#EDF3EC', text: '#346538' },
  overdue: { bg: '#FDEBEC', text: '#9F2F2D' },
};

export default function MilestonesPage() {
  const { user } = useAuth();
  const [grants, setGrants] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateModal, setUpdateModal] = useState(null);

  useEffect(() => {
    setLoading(true);
    grantsAPI.list()
      .then(res => {
        setGrants(res.data);
        if (res.data.length > 0) setSelectedGrant(String(res.data[0].id));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
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

  if (loading) return <Spinner size={32} className="page-loading" />;

  return (
    <div className="page-body">
      <div className="page-header-content">
        <div>
          <ScrollReveal as="h1" className="page-title">Milestones & Progress</ScrollReveal>
          <ScrollReveal delay={100} as="p" className="page-subtitle">Track deliverables, progress reports, and financial claims across your grants</ScrollReveal>
        </div>
      </div>

      {error && <ScrollReveal as="div"><Alert>{error}</Alert></ScrollReveal>}

      <ScrollReveal delay={100} as="div" className="card grant-selector-card">
        <Select
          label="Select Grant"
          id="grant-select"
          value={selectedGrant}
          onChange={e => setSelectedGrant(e.target.value)}
          options={grants.map(g => ({ value: String(g.id), label: `${g.title} — ${g.status}` }))}
          className="grant-select"
        />
      </ScrollReveal>

      <ScrollReveal delay={200} as="div">
        {milestones.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No milestones for this grant"
            description="Milestones are added from the Grant Detail page."
          />
        ) : (
          <StaggeredReveal baseDelay={80} as="div" className="milestones-list">
            {milestones.map((ms, index) => (
              <MilestoneCard
                key={ms.id}
                index={index}
                milestone={ms}
                onUpdate={() => setUpdateModal(ms)}
              />
            ))}
          </StaggeredReveal>
        )}
      </ScrollReveal>

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

function MilestoneCard({ milestone, index, onUpdate }) {
  const statusConfig = STATUS_COLORS[milestone.status] || STATUS_COLORS.pending;
  const StatusIcon = STATUS_ICONS[milestone.status] || Clock;

  return (
    <div className="stagger-item milestone-card">
      <div className="card p-5 milestone-card-inner">
        <div className="milestone-header">
          <div className="milestone-status-indicator" style={{ background: statusConfig.bg, color: statusConfig.text }}>
            <StatusIcon weight="bold" size={20} />
          </div>
          <div className="milestone-title-block">
            <div className="milestone-title">{milestone.title}</div>
            {milestone.report_type && (
              <Badge className="badge-draft milestone-report-type">
                <FileText weight="bold" size={10} className="mr-1" />
                {milestone.report_type.replace(/_/g, ' ')} report
              </Badge>
            )}
          </div>
          <div className="milestone-actions">
            <Badge
              status={milestone.status}
              style={{
                background: statusConfig.bg,
                color: statusConfig.text,
              }}
            />
            <Button variant="secondary" size="sm" onClick={onUpdate}>
              <Pencil weight="bold" size={14} className="mr-1" />
              Update
            </Button>
          </div>
        </div>

        {milestone.description && (
          <p className="milestone-description text-secondary text-sm">{milestone.description}</p>
        )}

        <div className="milestone-meta">
          {milestone.due_date && (
            <span className="milestone-meta-item">
              <Calendar weight="bold" size={12} className="inline mr-1" />
              Due {formatDate(milestone.due_date)}
            </span>
          )}
          {milestone.financial_claim_amount && (
            <span className="milestone-meta-item">
              <CurrencyDollar weight="bold" size={12} className="inline mr-1" />
              Financial claim: <strong>{formatCurrency(milestone.financial_claim_amount)}</strong>
            </span>
          )}
        </div>

        {milestone.progress_notes && (
          <div className="milestone-notes">
            <span className="notes-label">Progress notes:</span>
            <span className="notes-text">{milestone.progress_notes}</span>
          </div>
        )}
      </div>
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
    await onSave({
      status,
      progress_notes: notes,
      financial_claim_amount: claim ? parseFloat(claim) : undefined,
    });
    setLoading(false);
  }

  return (
    <Modal open onClose={onClose} title={`Update: ${milestone.title}`} size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={loading} disabled={loading}>Save Update</Button>
        </>
      }
    >
      <Select
        label="Status"
        id="milestone-status"
        value={status}
        onChange={e => setStatus(e.target.value)}
        options={MILESTONE_STATUSES}
      />
      <Textarea
        label="Progress Notes"
        id="milestone-notes"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Describe progress, challenges, or completed deliverables..."
        rows={4}
      />
      <Input
        label="Financial Claim Amount (MYR)"
        id="milestone-claim"
        type="number"
        value={claim}
        onChange={e => setClaim(e.target.value)}
        min={0}
        placeholder="0.00"
      />
    </Modal>
  );
}