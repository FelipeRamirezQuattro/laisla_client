import { useEffect, useState, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, CheckSquare, Minus, Moon, Square, Sun, X } from 'lucide-react';
import { insumosInvApi, revisionesApi } from '../../../api/inventario';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import { HistorialRevisionesPage } from './HistorialRevisionesPage';
import { formatMeasurementUnit } from '../../../utils/measurementUnits';
import { MEASUREMENT_UNITS } from '../../../utils/measurementUnits';
import type {
  CategoriaConInsumos, Insumo, RevisionInventario,
  RevisionInsumoDetalle, TurnoInventario, NivelInventario, MeasurementUnit,
} from '../../../types';

function detectTurno(): TurnoInventario {
  return new Date().getHours() < 13 ? 'MATUTINO' : 'VESPERTINO';
}

const NIVEL_STYLES: Record<NivelInventario, string> = {
  BUENO: 'bg-success-tint border-l-4 border-success',
  REGULAR: 'bg-warning-tint border-l-4 border-warning',
  AGOTADO: 'bg-error-tint border-l-4 border-error',
  NO_REVISADO: 'bg-white border-l-4 border-rule',
};

const NIVEL_BTN: Record<string, string> = {
  BUENO: 'bg-success hover:bg-success-ink text-cream',
  REGULAR: 'bg-warning hover:bg-warning-ink text-ink',
  AGOTADO: 'bg-error hover:bg-error-ink text-cream',
};

export function ControlDiarioPage({ initialTab = 'control' }: { initialTab?: 'control' | 'historial' } = {}) {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'control' | 'historial'>(initialTab);
  const [turno, setTurno] = useState<TurnoInventario>(detectTurno());
  const [grupos, setGrupos] = useState<CategoriaConInsumos[]>([]);
  const [revision, setRevision] = useState<RevisionInventario | null>(null);
  const [detalles, setDetalles] = useState<Record<string, RevisionInsumoDetalle>>({});
  const [comparacion, setComparacion] = useState<{ revision: RevisionInventario; detalles: RevisionInsumoDetalle[] } | null>(null);
  const [showComparacion, setShowComparacion] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [closeModal, setCloseModal] = useState(false);
  const [closeWarning, setCloseWarning] = useState<{ noRevisados: number; itemNames: string[] } | null>(null);
  const [closing, setClosing] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [unidades, setUnidades] = useState<Record<string, MeasurementUnit>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});

  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  const loadRevision = useCallback(async (t: TurnoInventario) => {
    setLoading(true);
    try {
      const [gruposRes, revRes] = await Promise.all([
        insumosInvApi.getAgrupados(),
        revisionesApi.createOrGet(t),
      ]);
      setGrupos(gruposRes.data);
      setRevision(revRes.data.revision);
      const map: Record<string, RevisionInsumoDetalle> = {};
      for (const d of revRes.data.detalles) map[d.insumoId] = d;
      setDetalles(map);

      // load today's other-shift for comparison
      const hoyRes = await revisionesApi.getHoy();
      const otherShift = t === 'MATUTINO' ? hoyRes.data.vespertino : hoyRes.data.matutino;
      if (otherShift?._id && otherShift.cerradaEn) {
        const detRes = await revisionesApi.getDetalles(otherShift._id);
        setComparacion(detRes.data);
      } else {
        setComparacion(null);
      }
    } catch {
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRevision(turno); }, [turno]);

  const setNivel = async (insumo: Insumo, nivel: NivelInventario) => {
    if (!revision || revision.cerradaEn) return;
    const id = insumo._id;
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      const res = await revisionesApi.updateDetalle(revision._id, id, { nivel });
      setDetalles((prev) => ({ ...prev, [id]: res.data }));
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  const saveExtra = async (insumoId: string, nextUnit?: MeasurementUnit) => {
    if (!revision || revision.cerradaEn) return;
    const cantidad = cantidades[insumoId];
    const unidad = nextUnit ?? unidades[insumoId];
    const obs = observaciones[insumoId];
    try {
      const res = await revisionesApi.updateDetalle(revision._id, insumoId, {
        cantidadObservada: cantidad ? parseFloat(cantidad) : undefined,
        unidadObservada: unidad,
        observacion: obs,
      });
      setDetalles((prev) => ({ ...prev, [insumoId]: res.data }));
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleBulkSetNivel = async (nivel: NivelInventario) => {
    if (!revision || selected.size === 0) return;
    const updates = Array.from(selected).map((insumoId) => ({ insumoId, nivel }));
    try {
      await revisionesApi.bulkUpdateDetalles(revision._id, updates);
      setDetalles((prev) => {
        const next = { ...prev };
        for (const { insumoId } of updates) {
          if (next[insumoId]) next[insumoId] = { ...next[insumoId], nivel };
        }
        return next;
      });
      setSelected(new Set());
      setBulkMode(false);
      toast.success(`${updates.length} ítems marcados como ${nivel}`);
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleCerrar = async (force = false) => {
    if (!revision) return;
    setClosing(true);
    try {
      const res = await revisionesApi.cerrar(revision._id);
      if (res.data.noRevisados > 0 && !force) {
        setCloseWarning({ noRevisados: res.data.noRevisados, itemNames: res.data.itemNames });
        setCloseModal(true);
        // reopen since backend already closed it — need to reabrir
        await revisionesApi.reabrir(revision._id, 'Reapertura automática por confirmación pendiente');
      } else {
        setRevision((r) => r ? { ...r, cerradaEn: new Date().toISOString() } : r);
        toast.success('Revisión cerrada');
        setCloseModal(false);
      }
    } catch {
      toast.error('Error al cerrar revisión');
    } finally {
      setClosing(false);
    }
  };

  const confirmCerrar = async () => {
    if (!revision) return;
    setClosing(true);
    try {
      await revisionesApi.cerrar(revision._id);
      setRevision((r) => r ? { ...r, cerradaEn: new Date().toISOString() } : r);
      toast.success('Revisión cerrada');
      setCloseModal(false);
    } catch {
      toast.error('Error al cerrar revisión');
    } finally {
      setClosing(false);
    }
  };

  const allInsumos = grupos.flatMap((g) => g.insumos);
  const revisados = allInsumos.filter((i) => detalles[i._id]?.nivel !== 'NO_REVISADO').length;
  const locked = !!revision?.cerradaEn;

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (activeTab === 'control' && loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Control de Inventario</h1>
          <p className="text-stone font-body text-sm mt-0.5">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}{user?.name}
          </p>
        </div>
        {activeTab === 'control' && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Turno selector */}
          <div className="inline-flex rounded-lg border border-rule bg-white p-1 shadow-sm">
            {[
              { value: 'MATUTINO' as TurnoInventario, label: 'Mañana', Icon: Sun },
              { value: 'VESPERTINO' as TurnoInventario, label: 'Tarde', Icon: Moon },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTurno(value)}
                disabled={locked}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-body transition-all ${
                  turno === value
                    ? 'bg-espresso text-cream'
                    : 'text-espresso hover:bg-surface-tint disabled:text-stone disabled:hover:bg-transparent'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          {/* Progress */}
          <span className="text-sm font-body text-stone bg-white px-3 py-1.5 rounded-lg border border-rule">
            {revisados} / {allInsumos.length} revisados
          </span>
          {/* Bulk toggle */}
          {!locked && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setBulkMode((b) => !b); setSelected(new Set()); }}
            >
              {bulkMode ? 'Cancelar selección' : 'Selección múltiple'}
            </Button>
          )}
          {/* Close */}
          {!locked ? (
            <Button onClick={() => handleCerrar()} disabled={closing}>
              {closing ? 'Cerrando...' : 'Cerrar Revisión'}
            </Button>
          ) : (
            <span className="text-sm font-body text-success-ink bg-success-tint border border-success px-3 py-1.5 rounded-lg">
              <Check size={14} className="inline-block mr-1 align-[-2px]" />
              Cerrada {new Date(revision!.cerradaEn!).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        )}
      </div>

      <div className="inline-flex rounded-lg border border-rule bg-white p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('control')}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${activeTab === 'control' ? 'bg-espresso text-cream' : 'text-espresso hover:bg-surface-tint'}`}
        >
          Revisión diaria
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${activeTab === 'historial' ? 'bg-espresso text-cream' : 'text-espresso hover:bg-surface-tint'}`}
        >
          Historial
        </button>
      </div>

      {activeTab === 'historial' ? (
        <HistorialRevisionesPage hideHeader />
      ) : (
        <>

      {/* Category groups */}
      {grupos.map((grupo) => (
        <div key={grupo.categoria._id} className="rounded-xl overflow-hidden shadow-sm border border-rule">
          {/* Category header */}
          <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-rule">
            <span className="font-body font-semibold text-espresso text-sm tracking-wide">{grupo.categoria.nombre}</span>
            <span className="text-xs font-body text-stone">
              {grupo.insumos.filter((i) => detalles[i._id]?.nivel !== 'NO_REVISADO').length}/{grupo.insumos.length}
            </span>
          </div>

          {/* Insumo rows */}
          <div className="divide-y divide-rule">
            {grupo.insumos.map((insumo) => {
              const detalle = detalles[insumo._id];
              const nivel = detalle?.nivel ?? 'NO_REVISADO';
              const isExpanded = expanded[insumo._id];
              const isSaving = saving[insumo._id];
              const isSelected = selected.has(insumo._id);

              return (
                <div key={insumo._id} className={`${NIVEL_STYLES[nivel]} transition-colors duration-200`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Bulk checkbox */}
                    {bulkMode && !locked && (
                      <button onClick={() => toggleSelected(insumo._id)}>
                        {isSelected
                          ? <CheckSquare size={18} className="text-terracotta" />
                          : <Square size={18} className="text-stone" />
                        }
                      </button>
                    )}

                    {/* Name + levels hint */}
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-espresso text-sm truncate">{insumo.nombre}</p>
                      <p className="text-xs text-stone font-body opacity-70">
                        {insumo.cantidadPresentacion ?? 1} {formatMeasurementUnit(insumo.unidad)}
                      </p>
                      {(insumo.nivelBueno || insumo.nivelRegular || insumo.nivelAgotado) && (
                        <p className="flex items-center gap-1.5 text-xs text-stone font-body mt-0.5 opacity-60">
                          <span className="h-2 w-2 rounded-full bg-success" /> {insumo.nivelBueno}
                          <span className="mx-0.5">·</span>
                          <span className="h-2 w-2 rounded-full bg-warning" /> {insumo.nivelRegular}
                          <span className="mx-0.5">·</span>
                          <span className="h-2 w-2 rounded-full bg-error" /> {insumo.nivelAgotado}
                        </p>
                      )}
                    </div>

                    {/* Semaphore buttons */}
                    {!locked && !bulkMode && (
                      <div className="flex gap-1.5 shrink-0">
                        {(['BUENO', 'REGULAR', 'AGOTADO'] as NivelInventario[]).map((n) => (
                          <button
                            key={n}
                            onClick={() => setNivel(insumo, n)}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-all duration-150 ${
                              nivel === n
                                ? NIVEL_BTN[n] + ' ring-2 ring-offset-1 ring-current'
                                : 'bg-rule hover:bg-rule-strong text-stone'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {n === 'BUENO' ? <Check size={13} /> : n === 'REGULAR' ? <Minus size={13} /> : <X size={13} />}
                              {n === 'BUENO' ? 'Bueno' : n === 'REGULAR' ? 'Regular' : 'Agotado'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {locked && nivel !== 'NO_REVISADO' && (
                      <span className={`text-xs font-body font-semibold px-2 py-1 rounded-lg ${NIVEL_BTN[nivel]}`}>
                        {nivel}
                      </span>
                    )}

                    {/* Expand toggle */}
                    {!locked && (
                      <button
                        onClick={() => setExpanded((e) => ({ ...e, [insumo._id]: !e[insumo._id] }))}
                        className="text-stone hover:text-stone shrink-0"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>

                  {/* Expanded extra fields */}
                  {isExpanded && !locked && (
                    <div className="px-4 pb-3 flex gap-3 flex-wrap">
                      <input
                        type="number"
                        placeholder="Cantidad observada"
                        value={cantidades[insumo._id] ?? detalle?.cantidadObservada ?? ''}
                        onChange={(e) => setCantidades((c) => ({ ...c, [insumo._id]: e.target.value }))}
                        onBlur={() => saveExtra(insumo._id)}
                        className="input-base w-40 text-sm"
                      />
                      <select
                        value={unidades[insumo._id] ?? detalle?.unidadObservada ?? insumo.unidad}
                        onChange={(e) => {
                          const nextUnit = e.target.value as MeasurementUnit;
                          setUnidades((u) => ({ ...u, [insumo._id]: nextUnit }));
                          saveExtra(insumo._id, nextUnit);
                        }}
                        className="input-base w-40 text-sm"
                      >
                        {MEASUREMENT_UNITS.map((unit) => (
                          <option key={unit.value} value={unit.value}>{unit.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Observación..."
                        value={observaciones[insumo._id] ?? detalle?.observacion ?? ''}
                        onChange={(e) => setObservaciones((o) => ({ ...o, [insumo._id]: e.target.value }))}
                        onBlur={() => saveExtra(insumo._id)}
                        className="input-base flex-1 text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Comparison view */}
      {comparacion && (
        <div className="card">
          <button
            className="flex items-center gap-2 text-sm font-body font-medium text-stone w-full"
            onClick={() => setShowComparacion((v) => !v)}
          >
            {showComparacion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Ver turno de {turno === 'MATUTINO' ? 'tarde' : 'mañana'} de hoy
          </button>
          {showComparacion && (
            <div className="mt-4 space-y-1 opacity-70">
              {comparacion.detalles.map((d) => (
                <div key={d._id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-body ${NIVEL_STYLES[d.nivel]}`}>
                  <span>{d.nombreSnapshot}</span>
                  <span className="text-xs font-semibold">{d.nivel}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk sticky footer */}
      {bulkMode && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-espresso text-cream rounded-xl shadow-2xl px-5 py-3 flex items-center gap-3 z-50">
          <span className="text-sm font-body">{selected.size} seleccionados</span>
          {(['BUENO', 'REGULAR', 'AGOTADO'] as NivelInventario[]).map((n) => (
            <button
              key={n}
              onClick={() => handleBulkSetNivel(n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${NIVEL_BTN[n]}`}
            >
              <span className="inline-flex items-center gap-1">
                {n === 'BUENO' ? <Check size={13} /> : n === 'REGULAR' ? <Minus size={13} /> : <X size={13} />}
                {n === 'BUENO' ? 'Bueno' : n === 'REGULAR' ? 'Regular' : 'Agotado'}
              </span>
            </button>
          ))}
          <button onClick={() => { setBulkMode(false); setSelected(new Set()); }}>
            <X size={16} className="text-cream opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Close warning modal */}
      <Modal isOpen={closeModal} onClose={() => setCloseModal(false)} title="Ítems sin revisar">
        <div className="space-y-4">
          <p className="font-body text-sm text-stone">
            Hay <strong>{closeWarning?.noRevisados}</strong> ítems marcados como <em>NO REVISADO</em>:
          </p>
          <ul className="text-sm font-body text-ink max-h-48 overflow-y-auto space-y-1">
            {closeWarning?.itemNames.map((name) => (
              <li key={name} className="px-2 py-1 bg-surface-tint rounded text-xs">{name}</li>
            ))}
          </ul>
          <p className="text-xs text-stone font-body">¿Deseas cerrar la revisión de todos modos?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCloseModal(false)}>Cancelar</Button>
            <Button onClick={confirmCerrar} disabled={closing}>
              {closing ? 'Cerrando...' : 'Cerrar de todos modos'}
            </Button>
          </div>
        </div>
      </Modal>
        </>
      )}
    </div>
  );
}
