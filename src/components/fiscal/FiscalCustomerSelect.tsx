import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clientsApi } from '../../api/clients';
import { Client } from '../../types';
import { calculateNitDV } from '../../utils/nitValidation';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const quickCreateSchema = z.object({
  personType: z.enum(['NATURAL', 'JURIDICA']),
  name: z.string().min(1, 'Nombre requerido'),
  docType: z.enum(['CC', 'NIT', 'CE']),
  docNumber: z.string().min(1, 'Número de documento requerido'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
});

type QuickCreateForm = z.infer<typeof quickCreateSchema>;

interface FiscalCustomerSelectProps {
  onChange: (clientId: string | null) => void;
  initialClient?: Client | null;
}

export function FiscalCustomerSelect({ onChange, initialClient }: FiscalCustomerSelectProps) {
  const [mode, setMode] = useState<'final' | 'client'>(initialClient ? 'client' : 'final');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickCreateForm>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: { personType: 'NATURAL', docType: 'CC', name: '', docNumber: '', email: '' },
  });
  const personType = watch('personType');
  const docType = watch('docType');
  const docNumber = watch('docNumber');
  const computedDv = docType === 'NIT' && docNumber ? calculateNitDV(docNumber) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mode !== 'client' || !open) return;
    clientsApi
      .getAll({ page: 1, limit: 10, search })
      .then((res) => setResults(res.data.clients))
      .catch(() => {});
  }, [mode, open, search]);

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    onChange(client._id);
    setOpen(false);
    setShowCreate(false);
  };

  const handleModeChange = (next: 'final' | 'client') => {
    setMode(next);
    if (next === 'final') {
      setSelectedClient(null);
      onChange(null);
    }
  };

  const onCreateSubmit = async (data: QuickCreateForm) => {
    try {
      const res = await clientsApi.create({
        name: data.name,
        email: data.email || undefined,
        fiscal: {
          personType: data.personType,
          docType: data.docType,
          docNumber: data.docNumber,
          dv: data.docType === 'NIT' && computedDv !== null ? String(computedDv) : undefined,
          businessName: data.personType === 'JURIDICA' ? data.name : undefined,
          fiscalEmail: data.email || undefined,
        },
      });
      toast.success('Cliente creado');
      reset();
      selectClient(res.data);
    } catch {
      toast.error('Error al crear cliente');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-island-dark font-body block mb-1">Adquirente</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('final')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-body transition-colors ${
              mode === 'final'
                ? 'border-island-blue bg-island-blue/10 text-island-blue font-medium'
                : 'border-island-blue/30 text-island-dark/70 hover:bg-gray-100'
            }`}
          >
            Consumidor final
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('client')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-body transition-colors ${
              mode === 'client'
                ? 'border-island-blue bg-island-blue/10 text-island-blue font-medium'
                : 'border-island-blue/30 text-island-dark/70 hover:bg-gray-100'
            }`}
          >
            Cliente con factura
          </button>
        </div>
      </div>

      {mode === 'client' && (
        <div ref={containerRef} className="space-y-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className={`input-base flex items-center justify-between gap-2 text-left bg-white ${
                selectedClient ? 'text-island-dark' : 'text-island-dark/50'
              }`}
            >
              <span className="truncate">
                {selectedClient
                  ? `${selectedClient.name}${
                      selectedClient.fiscal?.docNumber
                        ? ` · ${selectedClient.fiscal.docType} ${selectedClient.fiscal.docNumber}`
                        : ''
                    }`
                  : 'Buscar cliente...'}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-island-dark/50 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-island-blue/20 rounded-lg shadow-xl z-30 overflow-hidden">
                <div className="p-2 border-b border-island-blue/20">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-island-dark/40" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nombre, email, NIT..."
                      className="w-full pl-7 pr-2 py-1.5 text-sm border border-island-blue/20 rounded-md focus:outline-none focus:ring-1 focus:ring-island-blue"
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {results.map((client) => (
                    <button
                      type="button"
                      key={client._id}
                      onClick={() => selectClient(client)}
                      className="w-full text-left flex flex-col px-3 py-2 hover:bg-gray-100"
                    >
                      <span className="text-sm text-island-dark truncate">{client.name}</span>
                      {client.fiscal?.docNumber && (
                        <span className="text-xs text-island-dark/60">
                          {client.fiscal.docType} {client.fiscal.docNumber}
                          {client.fiscal.dv ? `-${client.fiscal.dv}` : ''}
                        </span>
                      )}
                    </button>
                  ))}
                  {results.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-island-dark/70">Sin resultados</div>
                  )}
                </div>
                <div className="border-t border-island-blue/20 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(true);
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-sm font-body font-medium text-island-blue hover:bg-gray-100 rounded-md py-1.5"
                  >
                    <Plus size={14} /> Crear nuevo cliente
                  </button>
                </div>
              </div>
            )}
          </div>

          {showCreate && (
            <div className="card space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-island-dark font-body">Nuevo cliente con factura</p>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-island-dark/50 hover:text-island-dark"
                  aria-label="Cerrar formulario de nuevo cliente"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-3">
                <Select
                  label="Tipo de persona"
                  options={[
                    { value: 'NATURAL', label: 'Natural' },
                    { value: 'JURIDICA', label: 'Jurídica' },
                  ]}
                  {...register('personType')}
                />
                <Input
                  label={personType === 'JURIDICA' ? 'Razón social' : 'Nombre'}
                  error={errors.name?.message}
                  {...register('name')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Tipo doc."
                    options={[
                      { value: 'CC', label: 'CC' },
                      { value: 'NIT', label: 'NIT' },
                      { value: 'CE', label: 'CE' },
                    ]}
                    {...register('docType')}
                  />
                  <Input label="Número" error={errors.docNumber?.message} {...register('docNumber')} />
                </div>
                {docType === 'NIT' && docNumber && (
                  <p className="text-xs text-island-dark/70 font-body">
                    Dígito de verificación: <span className="font-semibold text-island-dark">{computedDv}</span>
                  </p>
                )}
                <Input label="Email (opcional)" type="email" error={errors.email?.message} {...register('email')} />
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreate(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" loading={isSubmitting}>
                    Crear y seleccionar
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
