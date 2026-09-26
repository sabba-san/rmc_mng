import { useState, useEffect } from 'react';
import { grantsAPI, documentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, Alert, Modal, EmptyState, Button, Input, Select } from '../components/UI';
import { formatDate, DOC_TYPES } from '../utils/helpers';
import { ScrollReveal, StaggeredReveal } from '../components/ScrollReveal';
import {
  Upload, Download, FilePdf, Image, FileText, MagnifyingGlass,
  Paperclip, Trash, Eye
} from '@phosphor-icons/react';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [grants, setGrants] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!selectedGrant) return;
    documentsAPI.listByGrant(selectedGrant)
      .then(res => setDocs(res.data))
      .catch(err => setError(err.message));
  }, [selectedGrant]);

  async function handleDownload(doc) {
    try {
      const res = await documentsAPI.download(doc.id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(doc) {
    try {
      await documentsAPI.delete(doc.id);
      if (selectedGrant) documentsAPI.listByGrant(selectedGrant).then(res => setDocs(res.data));
    } catch (err) { setError(err.message); }
  }

  if (loading) return <Spinner size={32} className="page-loading" />;

  return (
    <div className="page-body">
      <div className="page-header-content">
        <div>
          <ScrollReveal as="h1" className="page-title">Document Vault</ScrollReveal>
          <ScrollReveal delay={100} as="p" className="page-subtitle">Secure storage for proposals, receipts, and research proofs</ScrollReveal>
        </div>
        <ScrollReveal delay={200} as="div">
          <Button variant="primary" onClick={() => setModal(true)}>
            <Upload weight="bold" size={18} className="mr-2" />
            Upload Document
          </Button>
        </ScrollReveal>
      </div>

      {error && <ScrollReveal as="div"><Alert>{error}</Alert></ScrollReveal>}

      <ScrollReveal delay={100} as="div" className="card grant-selector-card">
        <Select
          label="Select Grant"
          id="grant-select"
          value={selectedGrant}
          onChange={e => setSelectedGrant(e.target.value)}
          options={grants.map(g => ({ value: String(g.id), label: g.title }))}
          className="grant-select"
        />
      </ScrollReveal>

      <ScrollReveal delay={200} as="div">
        {docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents"
            description="Upload proposals, financial receipts, progress reports and manuscript proofs."
            action={<Button variant="primary" onClick={() => setModal(true)}>Upload Document</Button>}
          />
        ) : (
          <StaggeredReveal baseDelay={60} as="div" className="bento-grid-auto documents-grid" style={{ minWidth: '280px' }}>
            {docs.map((doc, index) => (
              <div key={doc.id} className="stagger-item document-card">
                <DocumentCard doc={doc} onDownload={handleDownload} onDelete={handleDelete} />
              </div>
            ))}
          </StaggeredReveal>
        )}
      </ScrollReveal>

      {modal && (
        <UploadModal
          grantId={selectedGrant}
          onClose={() => setModal(false)}
          onSave={() => {
            setModal(false);
            if (selectedGrant) documentsAPI.listByGrant(selectedGrant).then(res => setDocs(res.data));
          }}
        />
      )}
    </div>
  );
}

function DocumentCard({ doc, onDownload, onDelete }) {
  const isPdf = doc.mime_type?.includes('pdf');
  const isImage = doc.mime_type?.includes('image');
  const Icon = isPdf ? FilePdf : isImage ? Image : FileText;
  const iconColor = isPdf ? '#9F2F2D' : isImage ? '#346538' : '#104E90';
  const iconBg = isPdf ? '#FDEBEC' : isImage ? '#EDF3EC' : '#E3EDF7';

  return (
    <div className="card document-card-inner p-5">
      <div className="document-icon" style={{ background: iconBg, color: iconColor }}>
        <Icon weight="bold" size={36} />
      </div>
      <div className="document-info">
        <div className="document-filename truncate" title={doc.original_filename}>{doc.original_filename}</div>
        <div className="document-meta">
          <Badge className="badge-draft">{doc.doc_type?.replace(/_/g, ' ')}</Badge>
        </div>
        <div className="document-details">
          <span className="text-caption text-muted">{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}</span>
          <span className="text-caption text-muted">·</span>
          <span className="text-caption text-muted">{formatDate(doc.created_at)}</span>
        </div>
        <div className="document-uploader text-caption text-secondary">
          Uploaded by {doc.uploader?.name}
        </div>
      </div>
      <div className="document-actions">
        <Button variant="secondary" size="sm" onClick={() => onDownload(doc)} className="w-full">
          <Download weight="bold" size={14} className="mr-1" />
          Download
        </Button>
      </div>
    </div>
  );
}

function UploadModal({ grantId, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('proposal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  async function submit() {
    if (!file) { setError('Please select a file.'); return; }
    if (!grantId) { setError('No grant selected.'); return; }
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
        onClick={() => document.getElementById('doc-file-input').click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
      >
        {file ? (
          <div className="upload-zone-file">
            <div className="upload-zone-icon">
              <FileText weight="bold" size={32} />
            </div>
            <div className="upload-zone-info">
              <div className="font-semibold">{file.name}</div>
              <div className="text-caption text-muted mt-1">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        ) : (
          <div className="upload-zone-empty">
            <div className="upload-zone-icon">
              <Upload weight="bold" size={40} />
            </div>
            <div className="text-secondary mt-2">Drop file here or click to browse</div>
            <div className="text-caption text-muted mt-1">Accepted: PDF, PNG, JPG, DOCX, XLSX · Max 10 MB</div>
          </div>
        )}
        <input id="doc-file-input" type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" onChange={e => setFile(e.target.files[0])} />
      </div>
    </Modal>
  );
}