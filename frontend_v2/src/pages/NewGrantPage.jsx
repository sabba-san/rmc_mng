import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { grantsAPI } from '../utils/api';
import { Alert, Button, Input, Textarea, Select } from '../components/UI';
import { GRANT_TYPES } from '../utils/helpers';
import { ScrollReveal } from '../components/ScrollReveal';
import { ArrowLeft, ArrowRight, FloppyDisk, CaretRight } from '@phosphor-icons/react';

export default function NewGrantPage({ editMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = editMode || !!id;

  const [form, setForm] = useState({
    title: '', description: '', grant_type: 'internal',
    amount_requested: '', start_date: '', end_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isEdit && id) {
      grantsAPI.get(id).then(res => {
        setForm({
          title: res.data.title || '',
          description: res.data.description || '',
          grant_type: res.data.grant_type || 'internal',
          amount_requested: res.data.amount_requested?.toString() || '',
          start_date: res.data.start_date || '',
          end_date: res.data.end_date || '',
        });
      }).catch(() => {});
    }
  }, [isEdit, id]);

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
      const payload = {
        ...form,
        amount_requested: parseFloat(form.amount_requested),
      };
      if (isEdit) {
        await grantsAPI.update(id, payload);
        navigate(`/grants/${id}`);
      } else {
        const res = await grantsAPI.create(payload);
        navigate(`/grants/${res.data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { num: 1, label: 'Basic Information', desc: 'Title, description, and grant type' },
    { num: 2, label: 'Grant Details', desc: 'Budget, timeline, and dates' },
  ];

  return (
    <div className="page-body">
      <div className="page-header-content">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/grants')}>
            <ArrowLeft weight="bold" size={16} />
            Back
          </Button>
          <div>
            <ScrollReveal as="h1" className="page-title">{isEdit ? 'Edit Grant Application' : 'New Grant Application'}</ScrollReveal>
            <ScrollReveal delay={100} as="p" className="page-subtitle">
              {isEdit ? 'Update your research funding application' : 'Complete the form below to submit a new research funding application'}
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <ScrollReveal delay={100} as="div" className="step-indicator">
        <div className="step-progress" style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }} />
        {steps.map((s) => (
          <div key={s.num} className={`step ${step >= s.num ? 'completed' : ''} ${step === s.num ? 'active' : ''}`}>
            <div className="step-circle" style={{
              background: step >= s.num ? 'var(--color-primary)' : 'var(--color-border)',
              color: step >= s.num ? 'white' : 'var(--color-text-muted)',
            }}>
              {step > s.num ? <CaretRight weight="bold" size={14} /> : s.num}
            </div>
            <div className="step-label">
              <span className="step-title">{s.label}</span>
              <span className="step-desc">{s.desc}</span>
            </div>
          </div>
        ))}
      </ScrollReveal>

      <ScrollReveal delay={200} as="div" className="card grant-form-card">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <ScrollReveal as="div" className="form-section">
              <h3 className="section-title mb-4">Basic Information</h3>
              <Input
                label="Research Title *"
                id="grant-title"
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. AI-Powered Drug Discovery Using Deep Learning"
                required
              />
              <Textarea
                label="Project Description"
                id="grant-desc"
                value={form.description}
                onChange={set('description')}
                placeholder="Describe your research objectives, methodology, and expected outcomes..."
                rows={5}
              />
              <Select
                label="Grant Type *"
                id="grant-type"
                value={form.grant_type}
                onChange={set('grant_type')}
                required
                options={GRANT_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
              />

              <div className="form-actions">
                <Button variant="secondary" type="button" onClick={() => navigate('/grants')}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => {
                    if (!form.title.trim()) { setError('Title is required.'); return; }
                    setError(''); setStep(2);
                  }}
                >
                  Next
                  <ArrowRight weight="bold" size={16} className="ml-2" />
                </Button>
              </div>
            </ScrollReveal>
          )}

          {step === 2 && (
            <ScrollReveal as="div" className="form-section">
              <h3 className="section-title mb-4">Grant Details</h3>
              <div className="form-row">
                <Input
                  label="Amount Requested (MYR) *"
                  id="grant-amount"
                  type="number"
                  value={form.amount_requested}
                  onChange={set('amount_requested')}
                  min={1}
                  required
                  placeholder="e.g. 50000"
                />
              </div>
              <div className="form-row">
                <Input
                  label="Project Start Date"
                  id="grant-start"
                  type="date"
                  value={form.start_date}
                  onChange={set('start_date')}
                />
                <Input
                  label="Project End Date"
                  id="grant-end"
                  type="date"
                  value={form.end_date}
                  onChange={set('end_date')}
                />
              </div>

              <Alert type="info" className="mt-4">
                <FloppyDisk weight="bold" size={14} className="mr-2" />
                Your application will be saved as a <strong>Draft</strong>. You can review and submit it from the Grants list.
              </Alert>

              <div className="form-actions">
                <Button variant="secondary" type="button" onClick={() => setStep(1)}>
                  <ArrowRight weight="bold" size={16} className="mr-2" style={{ transform: 'rotate(180deg)' }} />
                  Back
                </Button>
                <Button variant="primary" type="submit" loading={loading}>
                  {isEdit ? 'Update Draft' : 'Save Draft'}
                </Button>
              </div>
            </ScrollReveal>
          )}
        </form>
      </ScrollReveal>
    </div>
  );
}