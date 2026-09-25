import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { grantsAPI, milestonesAPI, documentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, Alert, Modal, EmptyState, Button, Input, Textarea, Select } from '../components/UI';
import { formatCurrency, formatDate, timeAgo, REPORT_TYPES, DOC_TYPES } from '../utils/helpers';
import { ScrollReveal, StaggeredReveal } from '../components/ScrollReveal';
import {
  ArrowLeft, Target, FileText, FolderOpen, Calendar, CurrencyDollar,
  User, Building, Clock, Shield, Plus, Pencil, Upload, Download,
  Warning, CheckCircle, CaretRight
} from '@phosphor-icons/react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'milestones', label: 'Milestones', icon: Target },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
];

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

  if (loading) return <Spinner size={32} className="page-loading" />;
  if (error) return <div className="page-error"><Alert type="error">{error}</Alert></div>;
  if (!grant) return null;

  const canEdit = user.role === 'researcher' && grant.applicant?.id === user.id;

  return (
    <div className="page-body">
      <div className="page-header-content">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/grants')}>
            <ArrowLeft weight="bold" size={16} />
            Back
          </Button>
          <div style={{ flex: 1 }}>
            <ScrollReveal as="h1" className="page-title" style={{ fontSize: 'var(--text-2xl)' }}>{grant.title}</ScrollReveal>
            <div className="flex gap-2 items-center mt-1">
              <Badge status={grant.status} />
              <span className="text-caption text-muted">{grant.grant_type} grant · {timeAgo(grant.created_at)}</span>
            </div>
          </div>
          {canEdit && grant.status === 'draft' && (
            <ScrollReveal delay={100} as="div">
              <Button variant="primary" onClick={() => navigate(`/grants/${id}/edit`)}>
                <Pencil weight="bold" size={16} className="mr-2" />
                Edit Draft
              </Button>
            </ScrollReveal>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ScrollReveal delay={100} as="div" className="tabs-container">
        <div className="tabs" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? 'active' : ''}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
              >
                <Icon weight="bold" size={16} className="mr-2" />
                {t.label}
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      {tab === 'overview' && (
        <ScrollReveal delay={200} as="div" className="bento-grid-auto overview-grid" style={{ minWidth: '380px' }}>
          <StaggeredReveal baseDelay={60} as="section" className="card p-6">
            <h3 className="card-title mb-4">Grant Summary</h3>
            <dl className="summary-list">
              {[
                ['Applicant', grant.applicant?.name, User],
                ['Department', grant.applicant?.department, Building],
                ['Grant Type', grant.grant_type, Shield],
                ['Amount Requested', formatCurrency(grant.amount_requested), CurrencyDollar],
                ['Amount Approved', formatCurrency(grant.amount_approved), CurrencyDollar],
                ['Start Date', formatDate(grant.start_date), Calendar],
                ['End Date', formatDate(grant.end_date), Calendar],
                ['Reviewer', grant.reviewer?.name || '—', User],
              ].map(([label, val, Icon]) => (
                <div key={label} className="summary-item">
                  <dt className="summary-label">
                    <Icon weight="bold" size={14} className="mr-2" />
                    {label}
                  </dt>
                  <dd className="summary-value">{val}</dd>
                </div>
              ))}
            </dl>
          </StaggeredReveal>

          <StaggeredReveal baseDelay={120} as="section" className="card p-6">
            <h3 className="card-title mb-4">Description</h3>
            <p className="text-secondary" style={{ lineHeight: 1.8 }}>{grant.description || 'No description provided.'}</p>
            {grant.rejection_reason && (
              <Alert type="error" className="mt-4">
                <Warning weight="bold" size={14} className="mr-2" />
                <strong>Rejection reason:</strong> {grant.rejection_reason}
              </Alert>
            )}
            {grant.amount_approved && grant.amount_approved > 0 && (
              <Alert type="success" className="mt-4">
                <CheckCircle weight="bold" size={14} className="mr-2" />
                <strong>Grant approved for {formatCurrency(grant.amount_approved)}</strong>
              </Alert>
            )}
          </StaggeredReveal>
        </ScrollReveal>
      )}

      {tab === 'milestones' && (
        <ScrollReveal delay={200} as="div" className="milestones-tab">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Project Milestones</h3>
              {canEdit && (
                <Button variant="primary" size="sm" onClick={() => setMsModal(true)}>
                  <Plus weight="bold" size={14} className="mr-2" />
                  Add Milestone
                </Button>
              )}
            </div>
            {milestones.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No milestones yet"
                description="Add project milestones to track progress and upload reports."
                action={canEdit && <Button variant="primary" onClick={() => setMsModal(true)}>Add Milestone</Button>}
              />
            ) : (
              <StaggeredReveal baseDelay={60} as="div" className="timeline-list">
                {milestones.map((ms, index) => (
                  <MilestoneTimelineItem key={ms.id} index={index} milestone={ms} />
                ))}
              </StaggeredReveal>
            )}
          </div>
        </ScrollReveal>
      )}

      {tab === 'documents' && (
        <ScrollReveal delay={200} as="div" className="documents-tab">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Document Vault</h3>
              <Button variant="primary" size="sm" onClick={() => setDocModal(true)}>
                <Upload weight="bold" size={14} className="mr-2" />
                Upload
              </Button>
            </div>
            {documents.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No documents yet"
                description="Upload proposals, receipts, progress reports, and more."
                action={<Button variant="primary" onClick={() => setDocModal(true)}>Upload</Button>}
              />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Uploaded by</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id}>
                          <td className="font-semibold">{doc.original_filename}</td>
                          <td><Badge className="badge-draft">{doc.doc_type?.replace(/_/g, ' ')}</Badge></td>
                          <td className="text-muted text-sm">{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                          <td className="text-secondary">{doc.uploader?.name}</td>
                          <td className="text-muted text-sm">{formatDate(doc.created_at)}</td>
                          <td>
                            <Button variant="secondary" size="sm" onClick={async () => {
                              const res = await documentsAPI.download(doc.id);
                              const url = URL.createObjectURL(res.data);
                              const a = document.createElement('a');
                              a.href = url; a.download = doc.original_filename;
                              a.click(); URL.revokeObjectURL(url);
                            }}>
                              <Download weight="bold" size={14} className="mr-1" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollReveal>
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

function MilestoneTimelineItem({ milestone }) {
  const statusConfig = {
    pending: { bg: '#FBF3DB', text: '#956400', icon: Clock },
    in_progress: { bg: '#E1F3FE', text: '#1F6C9F', icon: CaretRight },
    completed: { bg: '#EDF3EC', text: '#346538', icon: CheckCircle },
    overdue: { bg: '#FDEBEC', text: '#9F2F2D', icon: Warning },
  }[milestone.status] || { bg: '#FBF3DB', text: '#956400', icon: Clock };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="timeline-item">
      <div className="timeline-marker" style={{ background: statusConfig.text }}>
        <StatusIcon weight="bold" size={12} color="white" />
      </div>
      <div className="timeline-content">
        <div className="card p-4 timeline-card">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{milestone.title}</span>
            <Badge
              status={milestone.status}
              style={{ background: statusConfig.bg, color: statusConfig.text }}
            />
          </div>
          {milestone.report_type && (
            <Badge className="badge-draft mb-2" style={{ fontSize: 'var(--text-xs)' }}>
              <FileText weight="bold" size={10} className="mr-1" />
              {milestone.report_type.replace(/_/g, ' ')} report
            </Badge>
          )}
          {milestone.description && <p className="text-secondary text-sm mb-2">{milestone.description}</p>}
          <div className="flex gap-4 text-caption text-muted">
            {milestone.due_date && (
              <span className="flex items-center gap-1">
                <Calendar weight="bold" size={11} />
                Due {formatDate(milestone.due_date)}
              </span>
            )}
            {milestone.financial_claim_amount && (
              <span className="flex items-center gap-1">
                <CurrencyDollar weight="bold" size={11} />
                Claim: {formatCurrency(milestone.financial_claim_amount)}
              </span>
            )}
          </div>
          {milestone.progress_notes && (
            <div className="milestone-notes mt-2 p-3" style={{ background: 'var(--color-bg-warm)', borderRadius: 'var(--radius-sm)' }}>
              <span className="text-caption text-secondary">Progress notes:</span>
              <p className="text-sm mt-1">{milestone.progress_notes}</p>
            </div>
          )}
        </div>
      </div>
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
      await milestonesAPI.create({
        ...form,
        grant_id: parseInt(grantId),
        financial_claim_amount: form.financial_claim_amount ? parseFloat(form.financial_claim_amount) : undefined,
      });
      onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add Milestone" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={loading} disabled={loading}>Save</Button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <Input label="Title *" id="ms-title" value={form.title} onChange={set('title')} required />
      <Textarea label="Description" id="ms-description" value={form.description} onChange={set('description')} rows={3} />
      <div className="form-row">
        <Input label="Due Date" id="ms-due_date" type="date" value={form.due_date} onChange={set('due_date')} />
        <Select
          label="Report Type"
          id="ms-report_type"
          value={form.report_type}
          onChange={set('report_type')}
          options={[{ value: '', label: 'None' }, ...REPORT_TYPES.map(r => ({ value: r, label: r }))]}
        />
      </div>
      <Input
        label="Financial Claim (MYR)"
        id="ms-claim"
        type="number"
        value={form.financial_claim_amount}
        onChange={set('financial_claim_amount')}
        min={0}
        placeholder="0.00"
      />
    </Modal>
  );
}

function UploadDocModal({ grantId, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('proposal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

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
    <Modal open onClose={onClose} title="Upload Document" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={loading} disabled={loading}>Upload</Button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <Select
        label="Document Category"
        id="doc-type"
        value={docType}
        onChange={e => setDocType(e.target.value)}
        options={DOC_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ') }))}
      />
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onClick={() => document.getElementById('file-input').click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
      >
        {file ? (
          <div className="upload-zone-file">
            <div className="upload-zone-icon"><FileText weight="bold" size={32} /></div>
            <div className="upload-zone-info">
              <div className="font-semibold">{file.name}</div>
              <div className="text-caption text-muted mt-1">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        ) : (
          <div className="upload-zone-empty">
            <div className="upload-zone-icon"><Upload weight="bold" size={40} /></div>
            <div className="text-secondary mt-2">Drop file here or click to browse</div>
            <div className="text-caption text-muted mt-1">Accepted: PDF, PNG, JPG, DOCX, XLSX · Max 10 MB</div>
          </div>
        )}
        <input id="file-input" type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" onChange={e => setFile(e.target.files[0])} />
      </div>
    </Modal>
  );
}