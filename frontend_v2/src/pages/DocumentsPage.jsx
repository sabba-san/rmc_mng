import { useState, useEffect } from 'react';
import { grantsAPI, documentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, Alert, Modal, EmptyState } from '../components/UI';
import { formatDate, DOC_TYPES } from '../utils/helpers';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [grants, setGrants] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    grantsAPI.list().then(res => {
      setGrants(res.data);
      if (res.data.length > 0) setSelectedGrant(String(res.data[0].id));
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
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

  if (loading) return <Spinner />;

  return (
    <div className="page-body">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">🗂️ Document Vault</h1>
          <p className="page-subtitle">Secure storage for proposals, receipts, and research proofs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>↑ Upload Document</button>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="card mb-4">
        <label className="form-label">Select Grant</label>
        <select className="form-control" value={selectedGrant} onChange={e => setSelectedGrant(e.target.value)} style={{ maxWidth: 500 }}>
          {grants.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon="📁" title="No documents" description="Upload proposals, financial receipts, progress reports and manuscript proofs." />
      ) : (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {docs.map(doc => (
            <div key={doc.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                {doc.mime_type?.includes('pdf') ? '📕' : doc.mime_type?.includes('image') ? '🖼️' : '📄'}
              </div>
              <div className="font-semibold truncate" style={{ textAlign: 'center', marginBottom: 4 }}>
                {doc.original_filename}
              </div>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span className="badge badge-draft">{doc.doc_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-xs text-muted" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''} · {formatDate(doc.created_at)}
              </div>
              <div className="text-xs text-secondary" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                Uploaded by {doc.uploader?.name}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => handleDownload(doc)}>
                ↓ Download
              </button>
            </div>
          ))}
        </div>
      )}

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
    <Modal open onClose={onClose} title="Upload Document"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? <span className="spinner" /> : '↑ Upload'}</button></>}
    >
      {error && <Alert>{error}</Alert>}
      <div className="form-group">
        <label className="form-label">Document Category</label>
        <select className="form-control" value={docType} onChange={e => setDocType(e.target.value)}>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onClick={() => document.getElementById('doc-file-input').click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
      >
        {file ? (
          <div>
            <div style={{ fontSize: '2rem' }}>📄</div>
            <div className="mt-2 font-semibold">{file.name}</div>
            <div className="text-xs text-muted mt-1">{(file.size / 1024).toFixed(1)} KB</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2.5rem' }}>📤</div>
            <div className="mt-2 text-secondary">Drop file here or click to browse</div>
            <div className="text-xs text-muted mt-1">Accepted: PDF, PNG, JPG, DOCX, XLSX · Max 10 MB</div>
          </div>
        )}
        <input id="doc-file-input" type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" onChange={e => setFile(e.target.files[0])} />
      </div>
    </Modal>
  );
}
