import { useCallback, useEffect, useState } from 'react';
import { fiscalDocumentsApi } from '../../../api/fiscal';
import { FiscalDocument } from '../../../types';
import { formatCOP } from '../../../utils/formatCurrency';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { PageLoader } from '../../../components/ui/Spinner';
import { FiscalDocumentStatusBadge } from '../../../components/ui/Badge';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'SENDING', label: 'Enviando' },
  { value: 'ACCEPTED', label: 'Aceptado' },
  { value: 'REJECTED', label: 'Rechazado' },
  { value: 'ERROR', label: 'Error' },
  { value: 'CONTINGENCY', label: 'Contingencia' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'DEE_POS', label: 'DEE POS' },
  { value: 'INVOICE', label: 'Factura' },
  { value: 'CREDIT_NOTE', label: 'Nota crédito' },
];

const RETRYABLE_STATUSES = ['ERROR', 'CONTINGENCY', 'REJECTED'];

export function DocumentosFiscalesPage() {
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailDoc, setDetailDoc] = useState<FiscalDocument | null>(null);
  const [creditNoteTarget, setCreditNoteTarget] = useState<FiscalDocument | null>(null);
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [creditNoteLoading, setCreditNoteLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const toast = useToast();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await fiscalDocumentsApi.getAll(params);
      setDocuments(res.data.documents);
      setTotal(res.data.total);
      setTotalPages(Math.max(1, Math.ceil(res.data.total / (res.data.limit || 20))));
    } catch {
      toast.error('Error al cargar documentos fiscales');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleRetry = async (doc: FiscalDocument) => {
    setRetryingId(doc._id);
    try {
      await fiscalDocumentsApi.retry(doc._id);
      toast.success('Documento reencolado para reintento');
      fetchDocuments();
    } catch {
      toast.error('Error al reintentar el documento');
    } finally {
      setRetryingId(null);
    }
  };

  const handleDownload = async (doc: FiscalDocument, kind: 'pdfUrl' | 'xmlUrl') => {
    try {
      const url = doc[kind] || (await fiscalDocumentsApi.getFiles(doc._id)).data[kind];
      if (!url) { toast.error('Archivo no disponible todavía'); return; }
      window.open(url, '_blank');
    } catch {
      toast.error('Error al obtener el archivo');
    }
  };

  const handleCreateCreditNote = async () => {
    if (!creditNoteTarget || !creditNoteReason.trim()) return;
    setCreditNoteLoading(true);
    try {
      await fiscalDocumentsApi.createCreditNote(creditNoteTarget._id, creditNoteReason.trim());
      toast.success('Nota crédito generada');
      setCreditNoteTarget(null);
      setCreditNoteReason('');
      fetchDocuments();
    } catch {
      toast.error('Error al generar la nota crédito');
    } finally {
      setCreditNoteLoading(false);
    }
  };

  if (loading && documents.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-island-dark">Documentos fiscales</h1>
        <p className="text-island-dark/70 font-body text-sm">{total} documentos generados</p>
      </div>

      <div className="card grid gap-3 md:grid-cols-2">
        <Select
          label="Estado"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        />
        <Select
          label="Tipo de documento"
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-gray-100 border-b border-island-blue/20">
              <tr>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Prefijo/Número</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Adquirente</th>
                <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Total</th>
                <th className="text-center px-4 py-3 text-island-dark/70 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Creado</th>
                <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-island-blue/20">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-3 text-island-dark">{TYPE_OPTIONS.find((t) => t.value === doc.type)?.label || doc.type}</td>
                  <td className="px-4 py-3 text-island-dark/70">{doc.prefix ? `${doc.prefix}${doc.number ?? ''}` : '—'}</td>
                  <td className="px-4 py-3 text-island-dark/70">{doc.acquirerSnapshot.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-island-dark">{formatCOP(doc.totalsSnapshot.total)}</td>
                  <td className="px-4 py-3 text-center"><FiscalDocumentStatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3 text-island-dark/70">{new Date(doc.createdAt).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end flex-wrap gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetailDoc(doc)}>Ver</Button>
                      {RETRYABLE_STATUSES.includes(doc.status) && (
                        <Button variant="secondary" size="sm" loading={retryingId === doc._id} onClick={() => handleRetry(doc)}>
                          Reintentar
                        </Button>
                      )}
                      {doc.status === 'ACCEPTED' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc, 'pdfUrl')}>PDF</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc, 'xmlUrl')}>XML</Button>
                          {doc.type !== 'CREDIT_NOTE' && (
                            <Button variant="danger" size="sm" onClick={() => setCreditNoteTarget(doc)}>Nota crédito</Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-island-dark/70">No hay documentos fiscales.</td></tr>
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Modal isOpen={!!detailDoc} onClose={() => setDetailDoc(null)} title="Detalle del documento fiscal" size="lg">
        {detailDoc && (
          <div className="space-y-3 text-sm font-body">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-island-dark/60">Tipo</p><p className="font-medium text-island-dark">{detailDoc.type}</p></div>
              <div><p className="text-island-dark/60">Estado</p><FiscalDocumentStatusBadge status={detailDoc.status} /></div>
              <div><p className="text-island-dark/60">Prefijo/Número</p><p className="font-medium text-island-dark">{detailDoc.prefix ? `${detailDoc.prefix}${detailDoc.number}` : '—'}</p></div>
              <div><p className="text-island-dark/60">Intentos</p><p className="font-medium text-island-dark">{detailDoc.attempts}</p></div>
              <div><p className="text-island-dark/60">CUFE/CUDE</p><p className="font-medium text-island-dark break-all">{detailDoc.cufe || detailDoc.cude || '—'}</p></div>
              <div><p className="text-island-dark/60">Adquirente</p><p className="font-medium text-island-dark">{detailDoc.acquirerSnapshot.name}</p></div>
            </div>
            {detailDoc.reason && (
              <div><p className="text-island-dark/60">Motivo</p><p className="font-medium text-island-dark">{detailDoc.reason}</p></div>
            )}
            {detailDoc.lastError && (
              <div className="rounded-lg bg-error-tint text-error-ink p-3 text-xs">{detailDoc.lastError}</div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!creditNoteTarget} onClose={() => setCreditNoteTarget(null)} title="Generar nota crédito">
        <div className="space-y-4">
          <p className="text-sm text-island-dark/70 font-body">Indica el motivo de la nota crédito.</p>
          <div>
            <label className="text-sm font-medium text-island-dark font-body block mb-1">Motivo</label>
            <textarea
              className="input-base h-24 resize-none"
              value={creditNoteReason}
              onChange={(e) => setCreditNoteReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreditNoteTarget(null)}>Cancelar</Button>
            <Button onClick={handleCreateCreditNote} loading={creditNoteLoading} disabled={!creditNoteReason.trim()}>Generar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
