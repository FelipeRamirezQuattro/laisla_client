import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, Mail, Send, Users } from "lucide-react";
import { gmailApi, type GmailStatus } from "../../api/gmail";
import { newslettersApi } from "../../api/newsletters";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../hooks/useToast";
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

export function BoletinesPage() {
  const [summary, setSummary] = useState<NewsletterSummary | null>(null);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [form, setForm] = useState(initialForm);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gmailBusy, setGmailBusy] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, campaignsRes, subscribersRes, gmailRes] =
        await Promise.all([
          newslettersApi.getSummary(),
          newslettersApi.getCampaigns({ page: 1, limit: 8 }),
          newslettersApi.getSubscribers({ page: 1, limit: 8 }),
          gmailApi.status(),
        ]);
      setSummary(summaryRes.data);
      setCampaigns(campaignsRes.data.campaigns);
      setSubscribers(subscribersRes.data.subscribers);
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
          <h1 className="font-body text-2xl font-bold text-espresso">
            Boletines
          </h1>
          <p className="text-stone font-body text-sm">
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] gap-6">
        <section className="card space-y-4">
          <div>
            <h2 className="font-body text-lg font-semibold text-espresso">
              Nuevo boletin
            </h2>
            <p className="text-stone font-body text-sm mt-1">
              El contenido acepta saltos de linea; se renderiza dentro de la
              plantilla de marca.
            </p>
          </div>

          <label className="block">
            <span className="block text-sm font-body font-medium text-espresso mb-1">
              Asunto
            </span>
            <input
              className="w-full rounded-lg border border-rule bg-white px-3 py-2 font-body text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              value={form.subject}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subject: event.target.value }))
              }
              placeholder="Cena, cata y nuevas pausas de junio"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-body font-medium text-espresso mb-1">
              Preheader
            </span>
            <input
              className="w-full rounded-lg border border-rule bg-white px-3 py-2 font-body text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              value={form.preheader}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, preheader: event.target.value }))
              }
              placeholder="Una vez al mes, sin ruido."
            />
          </label>

          <label className="block">
            <span className="block text-sm font-body font-medium text-espresso mb-1">
              Contenido
            </span>
            <textarea
              className="min-h-[260px] w-full resize-y rounded-lg border border-rule bg-white px-3 py-2 font-body text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
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
                <h2 className="font-body text-lg font-semibold text-espresso">
                  Cuenta remitente
                </h2>
                <p className="text-stone font-body text-sm mt-1">
                  Conecta Gmail para enviar boletines desde tu cuenta
                  autorizada.
                </p>
              </div>
              <div
                className={`rounded-full px-2 py-1 text-xs font-body font-semibold ${gmailStatus?.connected ? "bg-success-tint text-success" : "bg-surface-tint text-stone"}`}
              >
                {gmailStatus?.connected ? "Conectado" : "Sin conectar"}
              </div>
            </div>

            <div className="rounded-lg border border-rule bg-surface-tint p-4">
              <p className="font-body text-sm font-semibold text-espresso">
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
            <h2 className="font-body text-lg font-semibold text-espresso mb-4">
              Campanas recientes
            </h2>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className="rounded-lg border border-rule bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-body text-sm font-semibold text-espresso">
                        {campaign.subject}
                      </h3>
                      <p className="mt-1 text-xs text-stone">
                        {campaign.status === "sent"
                          ? `Enviado ${campaign.sentAt ? formatDateTime(campaign.sentAt) : ""}`
                          : `Borrador · ${formatDateTime(campaign.createdAt)}`}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-body font-semibold ${campaign.status === "sent" ? "bg-success-tint text-success" : "bg-surface-tint text-stone"}`}
                    >
                      {campaign.status === "sent" ? "Enviado" : "Borrador"}
                    </span>
                  </div>
                  {campaign.status === "sent" ? (
                    <p className="mt-3 text-xs text-stone">
                      {campaign.sentCount} enviados · {campaign.failedCount}{" "}
                      fallidos
                    </p>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3"
                      loading={sendingId === campaign._id}
                      onClick={() => sendCampaign(campaign._id)}
                    >
                      Enviar ahora
                    </Button>
                  )}
                </div>
              ))}
              {campaigns.length === 0 && (
                <p className="text-sm text-stone">Aun no hay boletines.</p>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="font-body text-lg font-semibold text-espresso mb-4">
              Ultimos suscriptores
            </h2>
            <div className="divide-y divide-rule">
              {subscribers.map((subscriber) => (
                <div key={subscriber._id} className="py-3">
                  <p className="font-body text-sm font-medium text-espresso">
                    {subscriber.email}
                  </p>
                  <p className="text-xs text-stone">
                    {formatDateTime(subscriber.createdAt)}
                  </p>
                </div>
              ))}
              {subscribers.length === 0 && (
                <p className="text-sm text-stone">
                  No hay suscriptores todavia.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
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
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-tint text-espresso">
        {icon}
      </div>
      <div>
        <p className="text-xs text-stone font-body uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-body font-bold text-espresso">{value}</p>
      </div>
    </div>
  );
}
