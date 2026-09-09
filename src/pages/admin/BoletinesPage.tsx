import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Mail, Plus, Send, Users } from "lucide-react";
import { gmailApi, type GmailStatus } from "../../api/gmail";
import { newslettersApi } from "../../api/newsletters";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../hooks/useConfirm";
import { formatDateTime } from "../../utils/formatDate";
import type {
  NewsletterCampaign,
  NewsletterSubscriber,
  NewsletterSummary,
} from "../../types";

const initialForm = {
  subject: "",
  preheader: "",
  body: "",
};

const subscriberSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().default(""),
  status: z.enum(["active", "unsubscribed"]).default("active"),
});

type SubscriberFormData = z.infer<typeof subscriberSchema>;

const statusLabel: Record<NewsletterSubscriber["status"], string> = {
  active: "Activo",
  unsubscribed: "Dado de baja",
};

const sourceLabel: Record<NewsletterSubscriber["source"], string> = {
  homepage: "Página web",
  admin: "Manual",
};

export function BoletinesPage() {
  const [view, setView] = useState<"boletines" | "suscriptores">("boletines");
  const [summary, setSummary] = useState<NewsletterSummary | null>(null);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [form, setForm] = useState(initialForm);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gmailBusy, setGmailBusy] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<NewsletterCampaign | null>(null);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, campaignsRes, gmailRes] = await Promise.all([
        newslettersApi.getSummary(),
        newslettersApi.getCampaigns({ page: 1, limit: 8 }),
        gmailApi.status(),
      ]);
      setSummary(summaryRes.data);
      setCampaigns(campaignsRes.data.campaigns);
      setGmailStatus(gmailRes.data);
    } catch {
      toast.error("Error al cargar boletines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const connectGmail = async () => {
    setGmailBusy(true);
    try {
      const res = await gmailApi.auth(
        `${window.location.pathname}${window.location.search}`,
      );
      window.location.href = res.data.url;
    } catch {
      toast.error("No se pudo iniciar la conexión con Gmail");
      setGmailBusy(false);
    }
  };

  const disconnectGmail = async () => {
    setGmailBusy(true);
    try {
      await gmailApi.disconnect();
      const res = await gmailApi.status();
      setGmailStatus(res.data);
      toast.success("Gmail desconectado");
    } catch {
      toast.error("No se pudo desconectar Gmail");
    } finally {
      setGmailBusy(false);
    }
  };

  const createCampaign = async (sendNow: boolean) => {
    setSaving(true);
    try {
      const created = await newslettersApi.createCampaign(form);
      setForm(initialForm);
      toast.success(
        sendNow ? "Boletin creado, enviando..." : "Boletin guardado",
      );

      if (sendNow) {
        setSendingId(created.data._id);
        await newslettersApi.sendCampaign(created.data._id);
        toast.success("Boletin enviado");
      }

      await fetchData();
    } catch {
      toast.error("No se pudo guardar el boletin");
    } finally {
      setSaving(false);
      setSendingId(null);
    }
  };

  const sendCampaign = async (id: string) => {
    setSendingId(id);
    try {
      await newslettersApi.sendCampaign(id);
      toast.success("Boletin enviado");
      fetchData();
    } catch {
      toast.error("No se pudo enviar el boletin");
    } finally {
      setSendingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">
            Boletines
          </h1>
          <p className="text-island-dark/70 font-body text-sm">
            Crea y envia correos mensuales a los suscriptores de La Isla.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric
          icon={<Users size={20} />}
          label="Suscriptores activos"
          value={summary?.activeSubscribers ?? 0}
        />
        <Metric
          icon={<Mail size={20} />}
          label="Suscriptores totales"
          value={summary?.totalSubscribers ?? 0}
        />
        <Metric
          icon={<Send size={20} />}
          label="Boletines enviados"
          value={summary?.sentCampaigns ?? 0}
        />
      </div>

      <div className="inline-flex rounded-lg border border-island-blue/20 bg-white p-1 shadow-sm">
        <button
          onClick={() => setView("boletines")}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${view === "boletines" ? "bg-island-dark text-white" : "text-island-dark hover:bg-gray-100"}`}
        >
          Boletines
        </button>
        <button
          onClick={() => setView("suscriptores")}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${view === "suscriptores" ? "bg-island-dark text-white" : "text-island-dark hover:bg-gray-100"}`}
        >
          Suscriptores
        </button>
      </div>

      {view === "boletines" && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] gap-6">
          <section className="card space-y-4">
            <div>
              <h2 className="font-body text-lg font-semibold text-island-dark">
                Nuevo boletin
              </h2>
              <p className="text-island-dark/70 font-body text-sm mt-1">
                El contenido acepta saltos de linea; se renderiza dentro de la
                plantilla de marca.
              </p>
            </div>

            <label className="block">
              <span className="block text-sm font-body font-medium text-island-dark mb-1">
                Asunto
              </span>
              <input
                className="w-full rounded-lg border border-island-blue/20 bg-white px-3 py-2 font-body text-sm text-island-dark outline-none focus:border-island-blue focus:ring-2 focus:ring-island-blue/20"
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="Cena, cata y nuevas pausas de junio"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-body font-medium text-island-dark mb-1">
                Preheader
              </span>
              <input
                className="w-full rounded-lg border border-island-blue/20 bg-white px-3 py-2 font-body text-sm text-island-dark outline-none focus:border-island-blue focus:ring-2 focus:ring-island-blue/20"
                value={form.preheader}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, preheader: event.target.value }))
                }
                placeholder="Una vez al mes, sin ruido."
              />
            </label>

            <label className="block">
              <span className="block text-sm font-body font-medium text-island-dark mb-1">
                Contenido
              </span>
              <textarea
                className="min-h-[260px] w-full resize-y rounded-lg border border-island-blue/20 bg-white px-3 py-2 font-body text-sm text-island-dark outline-none focus:border-island-blue focus:ring-2 focus:ring-island-blue/20"
                value={form.body}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, body: event.target.value }))
                }
                placeholder={"Hola,\n\nEste mes en La Isla tendremos..."}
              />
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="secondary"
                loading={saving && !sendingId}
                disabled={!form.subject || !form.body || saving}
                onClick={() => createCampaign(false)}
              >
                Guardar borrador
              </Button>
              <Button
                type="button"
                icon={<Send size={16} />}
                loading={saving && Boolean(sendingId)}
                disabled={!form.subject || !form.body || saving}
                onClick={() => createCampaign(true)}
              >
                Guardar y enviar
              </Button>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-body text-lg font-semibold text-island-dark">
                    Cuenta remitente
                  </h2>
                  <p className="text-island-dark/70 font-body text-sm mt-1">
                    Conecta Gmail para enviar boletines desde tu cuenta
                    autorizada.
                  </p>
                </div>
                <div
                  className={`rounded-full px-2 py-1 text-xs font-body font-semibold ${gmailStatus?.connected ? "bg-success-tint text-success" : "bg-gray-100 text-island-dark/70"}`}
                >
                  {gmailStatus?.connected ? "Conectado" : "Sin conectar"}
                </div>
              </div>

              <div className="rounded-lg border border-island-blue/20 bg-gray-100 p-4">
                <p className="font-body text-sm font-semibold text-island-dark">
                  {gmailStatus?.connected
                    ? gmailStatus.gmailEmail
                    : "No hay Gmail conectado"}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  icon={<Link size={16} />}
                  onClick={connectGmail}
                  loading={gmailBusy}
                >
                  {gmailStatus?.connected ? "Reconectar Gmail" : "Conectar Gmail"}
                </Button>
                {gmailStatus?.connected && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={disconnectGmail}
                    loading={gmailBusy}
                  >
                    Desconectar
                  </Button>
                )}
              </div>
            </section>

            <section className="card">
              <h2 className="font-body text-lg font-semibold text-island-dark mb-4">
                Campanas recientes
              </h2>
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign._id}
                    className="rounded-lg border border-island-blue/20 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-body text-sm font-semibold text-island-dark">
                          {campaign.subject}
                        </h3>
                        <p className="mt-1 text-xs text-island-dark/70">
                          {campaign.status === "sent"
                            ? `Enviado ${campaign.sentAt ? formatDateTime(campaign.sentAt) : ""}`
                            : `Borrador · ${formatDateTime(campaign.createdAt)}`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-body font-semibold ${campaign.status === "sent" ? "bg-success-tint text-success" : "bg-gray-100 text-island-dark/70"}`}
                      >
                        {campaign.status === "sent" ? "Enviado" : "Borrador"}
                      </span>
                    </div>
                    {campaign.status === "sent" && (
                      <p className="mt-3 text-xs text-island-dark/70">
                        {campaign.sentCount} enviados · {campaign.failedCount}{" "}
                        fallidos
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailCampaign(campaign)}
                      >
                        Ver detalle
                      </Button>
                      {campaign.status !== "sent" && (
                        <Button
                          type="button"
                          size="sm"
                          loading={sendingId === campaign._id}
                          onClick={() => sendCampaign(campaign._id)}
                        >
                          Enviar ahora
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-sm text-island-dark/70">Aun no hay boletines.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}

      {view === "suscriptores" && <SubscribersManager onChange={fetchData} />}

      <CampaignDetailModal
        campaign={detailCampaign}
        onClose={() => setDetailCampaign(null)}
      />
    </div>
  );
}

function CampaignDetailModal({
  campaign,
  onClose,
}: {
  campaign: NewsletterCampaign | null;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={!!campaign} onClose={onClose} title={campaign?.subject || "Boletín"} size="lg">
      {campaign && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-body font-semibold ${campaign.status === "sent" ? "bg-success-tint text-success" : "bg-gray-100 text-island-dark/70"}`}
            >
              {campaign.status === "sent" ? "Enviado" : "Borrador"}
            </span>
            <span className="text-xs text-island-dark/70">
              {campaign.status === "sent"
                ? `Enviado ${campaign.sentAt ? formatDateTime(campaign.sentAt) : ""}`
                : `Creado ${formatDateTime(campaign.createdAt)}`}
            </span>
          </div>

          {campaign.status === "sent" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-island-blue/20 bg-gray-100 p-3 text-center">
                <p className="text-lg font-body font-bold text-island-dark">{campaign.recipientsCount}</p>
                <p className="text-xs text-island-dark/70">Destinatarios</p>
              </div>
              <div className="rounded-lg border border-island-blue/20 bg-success-tint p-3 text-center">
                <p className="text-lg font-body font-bold text-success">{campaign.sentCount}</p>
                <p className="text-xs text-island-dark/70">Enviados</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${campaign.failedCount > 0 ? "border-error/30 bg-error-tint" : "border-island-blue/20 bg-gray-100"}`}>
                <p className={`text-lg font-body font-bold ${campaign.failedCount > 0 ? "text-error-ink" : "text-island-dark"}`}>
                  {campaign.failedCount}
                </p>
                <p className="text-xs text-island-dark/70">Fallidos</p>
              </div>
            </div>
          )}

          {campaign.preheader && (
            <div>
              <p className="text-xs font-body font-semibold uppercase tracking-wide text-island-dark/70 mb-1">
                Preheader
              </p>
              <p className="text-sm text-island-dark">{campaign.preheader}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-body font-semibold uppercase tracking-wide text-island-dark/70 mb-1">
              Contenido
            </p>
            <div className="rounded-lg border border-island-blue/20 bg-white p-4 text-sm text-island-dark whitespace-pre-wrap max-h-64 overflow-y-auto">
              {campaign.body}
            </div>
          </div>

          {campaign.status === "sent" && campaign.failedCount > 0 && (
            <div>
              <p className="text-xs font-body font-semibold uppercase tracking-wide text-island-dark/70 mb-1">
                Suscriptores fallidos
              </p>
              {campaign.failedRecipients && campaign.failedRecipients.length > 0 ? (
                <div className="divide-y divide-island-blue/20 rounded-lg border border-island-blue/20 bg-white max-h-48 overflow-y-auto">
                  {campaign.failedRecipients.map((recipient) => (
                    <div key={recipient.email} className="p-3">
                      <p className="text-sm font-medium text-island-dark">{recipient.email}</p>
                      <p className="text-xs text-error-ink mt-0.5">{recipient.error}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-island-dark/70">
                  No se guardó el detalle de los fallos (boletín enviado antes de que esta función existiera).
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function SubscribersManager({ onChange }: { onChange: () => void }) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NewsletterSubscriber | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriberFormData>({ resolver: zodResolver(subscriberSchema) });

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await newslettersApi.getSubscribers({
        page,
        limit: 20,
        search,
        status: statusFilter,
      });
      setSubscribers(res.data.subscribers);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Error al cargar suscriptores");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const openCreate = () => {
    setEditing(null);
    reset({ email: "", name: "", status: "active" });
    setModalOpen(true);
  };

  const openEdit = (subscriber: NewsletterSubscriber) => {
    setEditing(subscriber);
    reset({
      email: subscriber.email,
      name: subscriber.name || "",
      status: subscriber.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: SubscriberFormData) => {
    try {
      if (editing) {
        await newslettersApi.updateSubscriber(editing._id, data);
        toast.success("Suscriptor actualizado");
      } else {
        await newslettersApi.createSubscriber(data);
        toast.success("Suscriptor creado");
      }
      setModalOpen(false);
      fetchSubscribers();
      onChange();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "No se pudo guardar el suscriptor");
    }
  };

  const handleDelete = async (subscriber: NewsletterSubscriber) => {
    if (!(await confirm(`¿Eliminar al suscriptor "${subscriber.email}"?`))) return;
    try {
      await newslettersApi.deleteSubscriber(subscriber._id);
      toast.success("Suscriptor eliminado");
      fetchSubscribers();
      onChange();
    } catch {
      toast.error("Error al eliminar suscriptor");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-island-dark/70 font-body text-sm">
          {total} suscriptor{total === 1 ? "" : "es"}
        </p>
        <Button onClick={openCreate} icon={<Plus size={15} />}>
          Nuevo suscriptor
        </Button>
      </div>

      <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
        <Input
          placeholder="Buscar por email o nombre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          options={[
            { value: "", label: "Todos los estados" },
            { value: "active", label: "Activos" },
            { value: "unsubscribed", label: "Dados de baja" },
          ]}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-gray-100 border-b border-island-blue/20">
              <tr>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Origen</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Desde</th>
                <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-island-blue/20">
              {subscribers.map((subscriber) => (
                <tr key={subscriber._id} className="hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-3 font-medium text-island-dark">{subscriber.email}</td>
                  <td className="px-4 py-3 text-island-dark/70">{subscriber.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-body font-semibold ${subscriber.status === "active" ? "bg-success-tint text-success" : "bg-gray-100 text-island-dark/70"}`}
                    >
                      {statusLabel[subscriber.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-island-dark/70">{sourceLabel[subscriber.source]}</td>
                  <td className="px-4 py-3 text-island-dark/70">{formatDateTime(subscriber.subscribedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(subscriber)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(subscriber)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-island-dark/70">
                    No se encontraron suscriptores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar suscriptor" : "Nuevo suscriptor"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Input label="Nombre" error={errors.name?.message} {...register("name")} />
          <Select
            label="Estado"
            options={[
              { value: "active", label: "Activo" },
              { value: "unsubscribed", label: "Dado de baja" },
            ]}
            error={errors.status?.message}
            {...register("status")}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-island-dark">
        {icon}
      </div>
      <div>
        <p className="text-xs text-island-dark/70 font-body uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-body font-bold text-island-dark">{value}</p>
      </div>
    </div>
  );
}
