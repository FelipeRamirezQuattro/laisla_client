import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fiscalConfigApi } from '../../../api/fiscal';
import { FiscalConfig, FiscalDocumentType, FiscalEnvironment, FiscalIssuer, FiscalNumberingResolution, FiscalProviderName } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { PageLoader } from '../../../components/ui/Spinner';

const DOCUMENT_TYPES: FiscalDocumentType[] = ['DEE_POS', 'INVOICE', 'CREDIT_NOTE'];

function emptyResolution(): FiscalNumberingResolution {
  return { documentType: 'DEE_POS', prefix: '', rangeFrom: 1, rangeTo: 1000, currentNumber: 0, resolutionNumber: '' };
}

export function ConfiguracionFiscalPage() {
  const [config, setConfig] = useState<FiscalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [environment, setEnvironment] = useState<FiscalEnvironment>('TEST');
  const [provider, setProvider] = useState<FiscalProviderName>('MOCK');
  const [issuer, setIssuer] = useState<FiscalIssuer | null>(null);
  const [numbering, setNumbering] = useState<FiscalNumberingResolution[]>([]);
  const toast = useToast();

  useEffect(() => {
    fiscalConfigApi
      .get()
      .then((res) => {
        const c = res.data;
        setConfig(c);
        setEnabled(c.enabled);
        setEnvironment(c.environment);
        setProvider(c.provider);
        setIssuer(c.issuer);
        setNumbering(c.numbering.map((n) => ({ ...n })));
      })
      .catch(() => toast.error('Error al cargar configuración fiscal'))
      .finally(() => setLoading(false));
  }, []);

  const updateIssuer = (field: keyof FiscalIssuer, value: string | boolean) => {
    setIssuer((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateResolution = (idx: number, field: keyof FiscalNumberingResolution, value: string | number) => {
    setNumbering((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addResolution = () => setNumbering((prev) => [...prev, emptyResolution()]);
  const removeResolution = (idx: number) => setNumbering((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!issuer) return;
    setSaving(true);
    try {
      const res = await fiscalConfigApi.update({ enabled, environment, provider, issuer, numbering });
      setConfig(res.data);
      toast.success('Configuración fiscal actualizada');
    } catch {
      toast.error('Error al guardar la configuración fiscal');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !issuer) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">Configuración fiscal</h1>
          <p className="text-island-dark/70 font-body text-sm">
            Emisor, resoluciones de numeración y ambiente de facturación electrónica.
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>Guardar</Button>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body font-semibold text-island-dark">Emisión electrónica habilitada</p>
            <p className="text-xs text-island-dark/70 font-body">
              Si está apagado, los pedidos se cierran normalmente y no se genera ningún documento fiscal.
            </p>
          </div>
          <Switch checked={enabled} onChange={setEnabled} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Select
            label="Ambiente"
            options={[
              { value: 'TEST', label: 'Pruebas (TEST)' },
              { value: 'PRODUCTION', label: 'Producción' },
            ]}
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as FiscalEnvironment)}
          />
          <Select
            label="Proveedor"
            options={[
              { value: 'MOCK', label: 'Mock (pruebas internas)' },
              { value: 'ALANUBE', label: 'Alanube' },
              { value: 'BILIDOX', label: 'Bilidox' },
            ]}
            value={provider}
            onChange={(e) => setProvider(e.target.value as FiscalProviderName)}
          />
        </div>

        {environment === 'TEST' && (
          <div className="rounded-lg border border-warning bg-warning-tint text-warning-ink px-4 py-3 text-sm font-body">
            Ambiente de pruebas: los documentos generados no tienen validez fiscal ante la DIAN.
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <h2 className="font-body text-lg font-semibold text-island-dark border-b border-island-blue/20 pb-2">Emisor</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Select
            label="Tipo de persona"
            options={[
              { value: 'NATURAL', label: 'Natural' },
              { value: 'JURIDICA', label: 'Jurídica' },
            ]}
            value={issuer.personType}
            onChange={(e) => updateIssuer('personType', e.target.value)}
          />
          <Select
            label="Tipo de documento"
            options={[
              { value: 'CC', label: 'CC' },
              { value: 'NIT', label: 'NIT' },
            ]}
            value={issuer.idType}
            onChange={(e) => updateIssuer('idType', e.target.value)}
          />
          <Input label="Número de documento" value={issuer.idNumber} onChange={(e) => updateIssuer('idNumber', e.target.value)} />
          <Input label="DV" value={issuer.dv || ''} onChange={(e) => updateIssuer('dv', e.target.value)} />
          <Input label="Razón social / Nombre" value={issuer.businessName} onChange={(e) => updateIssuer('businessName', e.target.value)} />
          <Input label="Nombre comercial" value={issuer.tradeName} onChange={(e) => updateIssuer('tradeName', e.target.value)} />
          <Input label="Dirección" value={issuer.address} onChange={(e) => updateIssuer('address', e.target.value)} />
          <Input label="Municipio" value={issuer.municipality} onChange={(e) => updateIssuer('municipality', e.target.value)} />
          <Input label="Email" type="email" value={issuer.email} onChange={(e) => updateIssuer('email', e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-6 pt-1">
          <Switch checked={issuer.ivaResponsible} onChange={(v) => updateIssuer('ivaResponsible', v)} label="Responsable de IVA" />
          <Switch
            checked={issuer.consumptionTaxResponsible}
            onChange={(v) => updateIssuer('consumptionTaxResponsible', v)}
            label="Responsable de Impoconsumo"
          />
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-island-blue/20 pb-2">
          <h2 className="font-body text-lg font-semibold text-island-dark">Resoluciones de numeración</h2>
          <Button variant="ghost" size="sm" onClick={addResolution}>+ Agregar</Button>
        </div>
        <div className="space-y-3">
          {numbering.map((res, idx) => (
            <div key={idx} className="grid sm:grid-cols-6 gap-2 items-end border border-island-blue/10 rounded-lg p-3">
              <Select
                label="Tipo"
                options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
                value={res.documentType}
                onChange={(e) => updateResolution(idx, 'documentType', e.target.value)}
              />
              <Input label="Prefijo" value={res.prefix} onChange={(e) => updateResolution(idx, 'prefix', e.target.value)} />
              <Input
                label="Desde"
                type="number"
                value={res.rangeFrom}
                onChange={(e) => updateResolution(idx, 'rangeFrom', +e.target.value)}
              />
              <Input
                label="Hasta"
                type="number"
                value={res.rangeTo}
                onChange={(e) => updateResolution(idx, 'rangeTo', +e.target.value)}
              />
              <Input
                label="N° resolución"
                value={res.resolutionNumber}
                onChange={(e) => updateResolution(idx, 'resolutionNumber', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeResolution(idx)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-error-ink hover:bg-error-tint self-end"
                aria-label="Eliminar resolución"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {numbering.length === 0 && <p className="text-sm text-island-dark/70 font-body">No hay resoluciones configuradas.</p>}
        </div>
      </div>

      {config && (
        <p className="text-xs text-island-dark/70 font-body">
          Última actualización: {new Date(config.updatedAt).toLocaleString('es-CO')}
        </p>
      )}
    </div>
  );
}
