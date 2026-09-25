import { useState, useEffect, useCallback } from 'react';
import { outputsAPI, grantsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, Alert, Modal, EmptyState, Button, FilterChips, Input, Textarea, Select } from '../components/UI';
import { formatDate, OUTPUT_TYPES } from '../utils/helpers';
import { ScrollReveal, StaggeredReveal } from '../components/ScrollReveal';
import {
  Plus, FileText, ArrowSquareOut, MagnifyingGlass, Funnel, Trophy, BookOpen,
  Newspaper, FileCode, Presentation, ChartBar
} from '@phosphor-icons/react';

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  ...OUTPUT_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ') })),
];

const TYPE_ICONS = {
  publication: FileText,
  conference: Presentation,
  patent: FileCode,
  book_chapter: BookOpen,
  thesis: Newspaper,
  other: Trophy,
};

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
      <div className="page-header-content">
        <div>
          <ScrollReveal as="h1" className="page-title">Research Outputs</ScrollReveal>
          <ScrollReveal delay={100} as="p" className="page-subtitle">Publications, conferences, patents, and other research KPIs</ScrollReveal>
        </div>
        {(user.role === 'researcher' || user.role === 'admin') && (
          <ScrollReveal delay={200} as="div">
            <Button variant="primary" onClick={() => setModal(true)}>
              <Plus weight="bold" size={18} className="mr-2" />
              Add Output
            </Button>
          </ScrollReveal>
        )}
      </div>

      {error && <ScrollReveal as="div"><Alert>{error}</Alert></ScrollReveal>}

      <ScrollReveal delay={100} as="div" className="filter-section">
        <FilterChips
          options={TYPE_FILTERS}
          value={typeFilter}
          onChange={setTypeFilter}
          className="filter-chips"
        />
      </ScrollReveal>

      <ScrollReveal delay={200} as="div">
        {loading ? (
          <Spinner size={32} className="page-loading" />
        ) : outputs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No research outputs yet"
            description="Declare publications, conferences, and patents to track KPIs."
            action={(user.role === 'researcher' || user.role === 'admin') && (
              <Button variant="primary" onClick={() => setModal(true)}>Add Output</Button>
            )}
          />
        ) : (
          <div className="card outputs-table-card">
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
                    {outputs.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <div className="output-title-cell">
                            <div className="font-semibold truncate" style={{ maxWidth: 300 }}>{o.title}</div>
                            {o.doi_or_url && (
                              <a
                                href={o.doi_or_url.startsWith('http') ? o.doi_or_url : `https://${o.doi_or_url}`}
                                target="_blank" rel="noopener noreferrer"
                                className="output-doi"
                              >
                                <ArrowSquareOut weight="bold" size={12} className="inline mr-1" />
                                {o.doi_or_url.substring(0, 50)}…
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          {(() => {
                            const Icon = TYPE_ICONS[o.output_type] || FileText;
                            return (
                              <Badge className="badge-reviewer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Icon weight="bold" size={12} />
                                {o.output_type.replace(/_/g, ' ')}
                              </Badge>
                            );
                          })()}
                        </td>
                        <td className="text-secondary text-sm">{o.authors || '—'}</td>
                        <td className="text-secondary text-sm">{o.journal_or_venue || '—'}</td>
                        <td>
                          {o.indexing ? <Badge className="badge-approved">{o.indexing}</Badge> : '—'}
                          {o.impact_factor && <div className="text-caption text-muted mt-1">IF: {o.impact_factor}</div>}
                        </td>
                        <td><Badge status={o.status} /></td>
                        <td className="text-muted text-sm">{formatDate(o.publication_date || o.created_at)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ScrollReveal>

      {modal && (
        <AddOutputModal
          grants={grants}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); load(); }}
        />
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
      await outputsAPI.create({
        ...form,
        grant_id: parseInt(form.grant_id),
        impact_factor: form.impact_factor ? parseFloat(form.impact_factor) : undefined,
      });
      onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add Research Output" size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={loading} disabled={loading}>Save</Button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <div className="form-row">
        <Input
          label="Linked Grant *"
          id="grant_id"
          value={form.grant_id}
          onChange={set('grant_id')}
          required
        >
          <option value="">Select a grant…</option>
          {grants.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </Input>
        <Select
          label="Output Type *"
          id="output_type"
          value={form.output_type}
          onChange={set('output_type')}
          required
          options={OUTPUT_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ') }))}
        />
      </div>
      <div className="form-row">
        <Input
          label="Title *"
          id="title"
          value={form.title}
          onChange={set('title')}
          required
        />
        <Select
          label="Status"
          id="status"
          value={form.status}
          onChange={set('status')}
          options={['draft','submitted','accepted','published'].map(s => ({ value: s, label: s }))}
        />
      </div>
      <Textarea
        label="Authors"
        id="authors"
        value={form.authors}
        onChange={set('authors')}
        placeholder="Smith, J.; Lee, A."
        rows={2}
      />
      <Input
        label="Journal / Venue"
        id="journal_or_venue"
        value={form.journal_or_venue}
        onChange={set('journal_or_venue')}
        placeholder="Nature, ICCV, etc."
      />
      <div className="form-row">
        <Input
          label="DOI / URL"
          id="doi_or_url"
          value={form.doi_or_url}
          onChange={set('doi_or_url')}
          placeholder="https://doi.org/..."
        />
        <Input
          label="Indexing"
          id="indexing"
          value={form.indexing}
          onChange={set('indexing')}
          placeholder="Scopus, ISI, Q1"
        />
      </div>
      <div className="form-row">
        <Input
          label="Impact Factor"
          id="impact_factor"
          type="number"
          step="0.01"
          value={form.impact_factor}
          onChange={set('impact_factor')}
          placeholder="0.00"
        />
        <Input
          label="Publication Date"
          id="publication_date"
          type="date"
          value={form.publication_date}
          onChange={set('publication_date')}
        />
      </div>
    </Modal>
  );
}