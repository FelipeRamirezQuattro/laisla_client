// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  avatarInitials?: string;
  createdBy?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export type UserRole = 'superadmin' | 'admin' | 'user';

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductCategory = 'coffee' | 'food' | 'beverage' | 'experience' | 'work-cafe' | 'other';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
}

// ─── Table ───────────────────────────────────────────────────────────────────

export type TableZone = string;
export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface TableZoneRecord {
  _id: string;
  value: string;
  label: string;
  orden: number;
  createdAt: string;
}

export interface CafeTable {
  _id: string;
  name: string;
  capacity: number;
  zone: TableZone;
  status: TableStatus;
  currentOrderId?: string;
  createdAt: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'in-progress' | 'ready' | 'delivered' | 'billed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'nequi';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  productType?: 'product' | 'recipe';
  variantSize?: string;
  taxType?: 'NONE' | 'IVA_19' | 'CONSUMO_8';
  taxRate?: number;
  taxAmount?: number;
}

export interface Order {
  _id: string;
  tableId?: string | CafeTable | null;
  orderType?: 'table' | 'walk-in';
  clientId?: string | Client;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  total: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdBy: string;
  serviceDate?: string;
  deliveredAt?: string;
  billedAt?: string;
  closedAt?: string;
  inventoryDeductedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelReasonDetail?: string;
  statusHistory?: Array<{ status: OrderStatus; at: string; by?: string; notes?: string }>;
  createdAt: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface ClientFiscal {
  docType?: 'CC' | 'NIT' | 'CE';
  docNumber?: string;
  dv?: string;
  businessName?: string;
  personType?: 'NATURAL' | 'JURIDICA';
  fiscalEmail?: string;
}

export interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  visitCount: number;
  fiscal?: ClientFiscal;
  createdAt: string;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface Provider {
  _id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  category: string;
  notes?: string;
  createdAt: string;
}

// ─── Cash Shift / Arqueo ─────────────────────────────────────────────────────

export type CashShiftStatus = 'OPEN' | 'COUNTING' | 'CLOSED' | 'REVIEWED';
export type DenominationKind = 'bill' | 'coin';

export interface DenominationCount {
  value: number;
  kind: DenominationKind;
  quantity: number;
  subtotal: number;
}

/** Request-side shape — no subtotal, the server computes and verifies it. */
export interface DenominationInput {
  value: number;
  kind: DenominationKind;
  quantity: number;
}

export interface CashCount {
  denominations: DenominationCount[];
  total: number;
  countedBy: string | User;
  countedAt: string;
}

export interface CashShiftSalesSnapshot {
  cashSales: number;
  cardSales: number;
  nequiSales: number;
  transferSales: number;
  totalSales: number;
  totalOrders: number;
  unassignedOrdersCount: number;
}

export type CashShiftAuditAction =
  | 'OPEN'
  | 'COUNT_OPENING'
  | 'COUNT_CLOSING'
  | 'CLOSE'
  | 'APPROVE'
  | 'ADJUSTMENT';

export interface CashShiftAuditEntry {
  action: CashShiftAuditAction;
  by: string | User;
  at: string;
  detail?: Record<string, unknown>;
}

export interface CashShift {
  _id: string;
  status: CashShiftStatus;
  openedBy: string | User;
  openedAt: string;
  openingFloat: CashCount;
  closingCount?: CashCount;
  closedBy?: string | User;
  closedAt?: string;
  salesSnapshot?: CashShiftSalesSnapshot;
  totalExpenses?: number;
  totalWithdrawals?: number;
  totalCashIn?: number;
  expectedCash?: number;
  difference?: number;
  reviewedBy?: string | User;
  reviewedAt?: string;
  reviewNotes?: string;
  fiscalWarning?: string;
  notes?: string;
  auditLog: CashShiftAuditEntry[];
  migratedFromLegacy?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CashMovementType = 'WITHDRAWAL' | 'CASH_IN';

export interface CashMovement {
  _id: string;
  cashShiftId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdBy: string | User;
  createdAt: string;
}

export type DailyExpenseType = 'INSUMO' | 'OTRO';

export interface DailyExpense {
  _id: string;
  date: string;
  type: DailyExpenseType;
  description: string;
  amount: number;
  insumoId?: string | Insumo;
  providerId?: string | Provider;
  quantity?: number;
  unit?: MeasurementUnit;
  stockMovementId?: string;
  notes?: string;
  createdBy: string | User;
  cashShiftId?: string | null;
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Event ───────────────────────────────────────────────────────────────────

export type EventType = 'picnic' | 'movie' | 'trivia' | 'tasting' | 'dinner-with-strangers' | 'other';
export type EventStatus = 'upcoming' | 'active' | 'cancelled' | 'completed';

export interface GeneratedGroup {
  groupNumber: number;
  guests: string[];
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  type: EventType;
  date: string;
  time: string;
  pricePerPerson: number;
  maxCapacity: number;
  currentRegistrations: number;
  imageUrl?: string;
  isPublished: boolean;
  status: EventStatus;
  generatedGroups: GeneratedGroup[];
  createdAt: string;
}

// ─── Reservation ─────────────────────────────────────────────────────────────

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
export type OccasionType = 'birthday' | 'anniversary' | 'business meeting' | 'first date' | 'celebration' | 'other';
export type ReservationZone = 'social' | 'work-cafe' | 'terrace';

export interface SpecialOccasion {
  hasOccasion: boolean;
  type?: OccasionType;
  notes?: string;
}

export interface Reservation {
  _id: string;
  clientName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  partySize: number;
  tableId?: string | CafeTable | null;
  detail?: string;
  zone: ReservationZone;
  specialOccasion: SpecialOccasion;
  confirmationCode: string;
  status: ReservationStatus;
  createdAt: string;
}

// ─── Dinner Guest ────────────────────────────────────────────────────────────

export type AgeRange = '18-24' | '25-32' | '33-40' | '41-50' | '50+';
export type ConversationType = 'deep' | 'intellectual' | 'creative' | 'entrepreneurial' | 'casual' | 'balanced';
export type DinnerStyle = 'intimate' | 'lively' | 'experiential';
export type PersonalityTag = 'intellectual' | 'empathetic' | 'aesthetic' | 'adventurous';

export interface CompatibilityProfile {
  socialEnergy: number;
  conversationType: ConversationType;
  workAttitude: number;
  hobbies: string[];
  spontaneity: number;
  dinnerStyle: DinnerStyle;
  personalityTag: PersonalityTag;
}

export interface DinnerGuest {
  _id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  ageRange: AgeRange;
  compatibilityProfile: CompatibilityProfile;
  assignedGroup?: number;
  status: 'registered' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface EventBooking {
  _id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  tickets: number;
  notes?: string;
  status: 'registered' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export type EventGuest = DinnerGuest | EventBooking;

// ─── Newsletter ──────────────────────────────────────────────────────────────

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed';
  source: 'homepage' | 'admin';
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
}

export interface NewsletterFailedRecipient {
  email: string;
  error: string;
}

export interface NewsletterCampaign {
  _id: string;
  subject: string;
  preheader?: string;
  body: string;
  status: 'draft' | 'sent';
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  failedRecipients?: NewsletterFailedRecipient[];
  sentAt?: string;
  createdAt: string;
}

export interface NewsletterSummary {
  activeSubscribers: number;
  totalSubscribers: number;
  sentCampaigns: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface HourlySale {
  hour: string;
  revenue: number;
  orders: number;
}

export interface DashboardSummary {
  todaySales: number;
  todayOrders: number;
  openTables: number;
  upcomingEvents: Event[];
  hourlySales: HourlySale[];
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Cost Module ─────────────────────────────────────────────────────────────

export type MeasurementUnit = 'KG' | 'GR' | 'LT' | 'ML' | 'UND' | 'PAQ';
export type RecipeIngredientUnit = MeasurementUnit;

export type RecipeCategory = string;

export interface RecipeCategoryOption {
  _id: string;
  value: RecipeCategory;
  label: string;
  orden: number;
}

export type VariantSize = '6OZ' | '8OZ' | '12OZ' | '16OZ' | '20OZ' | 'UND';

export interface DisposablePackItem {
  rawMaterialId: string;
  quantity: number;
  unit: RecipeIngredientUnit;
  cost: number;
}

export interface DisposablePack {
  _id: string;
  name: string;
  items: DisposablePackItem[];
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface OverheadItem {
  concept: string;
  monthlyCost: number;
}

export interface LaborAndOverheadParams {
  _id: string;
  hourlyWage: number;
  numberOfWorkers: number;
  hoursPerDay: number;
  numberOfShifts: number;
  monthlyCustomers: number;
  productsPerCustomer: number;
  totalHourlyWage: number;
  dailyLabor: number;
  monthlyLabor: number;
  laborPerItem: number;
  overheadItems: OverheadItem[];
  totalMonthlyOverhead: number;
  dailyOverhead: number;
  overheadPerItem: number;
  ivaRate: number;
  updatedAt: string;
}

export interface RecipeIngredient {
  ingredientRefId: string;
  ingredientType: 'raw' | 'recipe';
  quantity: number;
  unit: RecipeIngredientUnit;
  cost: number;
  includePreparationTime?: boolean;
  // enriched in cost-sheet endpoint:
  name?: string;
}

export interface RecipeVariant {
  size: VariantSize;
  ingredients: RecipeIngredient[];
  disposablePackId?: string;
  salePrice: number;
  taxType?: 'NONE' | 'IVA_19' | 'CONSUMO_8';
  taxRate?: number;
  taxIncluded?: boolean;
  salePriceWithoutTax: number;
  costingMethod?: 'food-cost' | 'full-cost';
  targetMargin?: number;
  targetFoodCostPct?: number;
  totalPreparationTimeMinutes?: number;
  directMaterialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  profitAmount: number;
  profitPct: number;
  grossMarginPct: number;
  suggestedPrice: number;
  taxAmount?: number;
  finalPrice?: number;
}

export interface Recipe {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category: RecipeCategory;
  isSubRecipe: boolean;
  isProduct?: boolean;
  preparationTimeMinutes?: number;
  variants: RecipeVariant[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthProjection {
  month: number;
  isManualOverride: boolean;
  dailyTickets: number;
  monthlyTickets: number;
  averageTicket: number;
  dailySales: number;
  monthlySales: number;
  costOfSalesPct: number;
  costOfSales: number;
  operatingExpenses: number;
  totalExpenses: number;
  profit: number;
}

export interface Projection {
  _id: string;
  year: number;
  growthRate: number;
  workingDaysPerMonth: number;
  months: MonthProjection[];
}

export interface ActualExpenses {
  payroll: number;
  founderPayroll: number;
  rent: number;
  bankFees: number;
  utilities: number;
  maintenance: number;
  marketing: number;
  paidAds: number;
  musicRights: number;
  accounting: number;
  other: number;
}

export interface ActualResult {
  _id: string;
  year: number;
  month: number;
  totalSales: number;
  costOfSales: number;
  costOfSalesPct: number;
  grossMargin: number;
  grossMarginPct: number;
  expenses: ActualExpenses;
  totalOperatingExpenses: number;
  netProfit: number;
  netProfitPct: number;
  variationVsPrevMonth: Record<string, number>;
  insights: string[];
}

// ─── Inventario Diario ────────────────────────────────────────────────────────

export type TurnoInventario = 'MATUTINO' | 'VESPERTINO';
export type NivelInventario = 'BUENO' | 'REGULAR' | 'AGOTADO' | 'NO_REVISADO';

export interface InsumoCategoria {
  _id: string;
  nombre: string;
  orden: number;
}

export interface Insumo {
  _id: string;
  nombre: string;
  categoriaId: string | InsumoCategoria;
  unidad: MeasurementUnit;
  cantidadPresentacion?: number;
  precioLista?: number;
  proveedorPrincipalId?: string | Provider;
  proveedorIds?: Array<string | Provider>;
  nivelBueno?: string;
  nivelRegular?: string;
  nivelAgotado?: string;
  activo: boolean;
  orden: number;
}

export interface CategoriaConInsumos {
  categoria: InsumoCategoria;
  insumos: Insumo[];
}

export interface RevisionInventario {
  _id: string;
  fecha: string;
  turno: TurnoInventario;
  colaboradorId: string | { _id: string; name: string };
  creadaEn: string;
  cerradaEn?: string;
  notas?: string;
  reaperturas: Array<{ adminId: string; reabiertaEn: string; motivo?: string }>;
}

export interface RevisionInsumoDetalle {
  _id: string;
  revisionId: string;
  insumoId: string;
  nombreSnapshot: string;
  nivel: NivelInventario;
  cantidadObservada?: number;
  unidadObservada?: MeasurementUnit;
  cantidadSistema?: number;
  unidadSistema?: MeasurementUnit;
  observacion?: string;
  compradoEn?: string;
}

export type StockMovementTipo = 'VENTA_AUTOMATICA' | 'COMPRA' | 'AJUSTE_MANUAL' | 'REVISION_MANUAL';
export type StockMovementEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface InsumoStockMovement {
  _id: string;
  insumoId: string;
  tipo: StockMovementTipo;
  estado: StockMovementEstado;
  cantidad: number;
  unidad: MeasurementUnit;
  cantidadBase: number;
  fecha: string;
  orderId?: string;
  revisionId?: string;
  providerId?: string | Provider;
  notas?: string;
  aprobadoEn?: string;
  rechazadoEn?: string;
  createdAt: string;
}

export interface InsumoStockStatus {
  insumo: Insumo;
  stock: number;
  pendingDelta: number;
  pendingOut: number;
  pendingIn: number;
  unit: MeasurementUnit;
  pendingCount: number;
  lastMovementAt: string | null;
}

export interface InsumoStockHistory {
  insumo: Insumo;
  desde: string;
  hasta: string;
  movements: InsumoStockMovement[];
  points: Array<{
    date: string;
    stock: number;
    delta: number;
    estado: StockMovementEstado;
    tipo: StockMovementTipo;
  }>;
}

export interface AlertaCompra {
  detalle: RevisionInsumoDetalle;
  insumo: Insumo;
  categoria: InsumoCategoria;
  ultimaRevision: string;
}

export interface HistorialItem {
  _id: string;
  fecha: string;
  turno: TurnoInventario;
  colaborador: { _id: string; name: string };
  creadaEn: string;
  cerradaEn?: string;
  counts: { bueno: number; regular: number; agotado: number; noRevisado: number };
}

export interface ReporteAgotamiento {
  insumoId: string;
  nombre: string;
  agotadoCount: number;
}

export interface ReporteCumplimiento {
  colaboradorId: string;
  nombre: string;
  completadas: number;
  esperadas: number;
  pct: number;
}

export interface ReporteInsumoCritico {
  insumoId: string;
  nombre: string;
  categoria: string;
  agotadoCount: number;
}

// ─── Projects, Tasks & Notifications ────────────────────────────────────────

export type ProjectTaskStatus = 'pending' | 'in-progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface TaskRecurrence {
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  taskCounts?: Partial<Record<ProjectTaskStatus, number>>;
}

export interface TaskAttachment {
  _id: string;
  filename: string;
  url: string;
  addedBy: string | User;
  addedAt: string;
}

export interface ProjectTask {
  _id: string;
  projectId: string | Project;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  priority: TaskPriority;
  assignedTo: User[];
  createdBy: string | User;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  attachments: TaskAttachment[];
  tags: string[];
  order: number;
  isRecurring: boolean;
  recurrence?: TaskRecurrence;
  nextOccurrenceAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_due_soon'
  | 'task_overdue'
  | 'project_created'
  | 'general';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: 'task' | 'project';
  entityId?: string;
  linkTo?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ─── Fiscal (DIAN electronic invoicing) ─────────────────────────────────────

export type FiscalDocumentType = 'DEE_POS' | 'INVOICE' | 'CREDIT_NOTE';
export type FiscalDocumentStatus = 'PENDING' | 'SENDING' | 'ACCEPTED' | 'REJECTED' | 'ERROR' | 'CONTINGENCY';
export type FiscalEnvironment = 'TEST' | 'PRODUCTION';
export type FiscalProviderName = 'MOCK' | 'ALANUBE' | 'BILIDOX';

export interface FiscalTaxSummaryEntry {
  taxType: 'NONE' | 'IVA_19' | 'CONSUMO_8';
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface FiscalIssuerSnapshot {
  personType: 'NATURAL' | 'JURIDICA';
  idType: string;
  idNumber: string;
  dv?: string;
  businessName: string;
  tradeName: string;
  taxRegime?: string;
  fiscalResponsibilities: string[];
  ivaResponsible: boolean;
  consumptionTaxResponsible: boolean;
  address: string;
  municipality: string;
  email: string;
}

export interface FiscalAcquirerSnapshot {
  personType: 'NATURAL' | 'JURIDICA';
  docType: string;
  docNumber: string;
  dv?: string;
  name: string;
  email?: string;
}

export interface FiscalDocument {
  _id: string;
  orderId: string;
  type: FiscalDocumentType;
  referencedDocumentId?: string;
  reason?: string;
  issuerSnapshot: FiscalIssuerSnapshot;
  acquirerSnapshot: FiscalAcquirerSnapshot;
  totalsSnapshot: { subtotal: number; taxSummary: FiscalTaxSummaryEntry[]; total: number };
  prefix?: string;
  number?: number;
  status: FiscalDocumentStatus;
  cufe?: string;
  cude?: string;
  qrData?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  providerDocumentId?: string;
  attempts: number;
  nextAttemptAt?: string;
  lastError?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalNumberingResolution {
  documentType: FiscalDocumentType;
  prefix: string;
  rangeFrom: number;
  rangeTo: number;
  currentNumber: number;
  resolutionNumber: string;
  validFrom?: string;
  validTo?: string;
  technicalKey?: string;
}

export interface FiscalIssuer {
  personType: 'NATURAL' | 'JURIDICA';
  idType: 'CC' | 'NIT';
  idNumber: string;
  dv?: string;
  businessName: string;
  tradeName: string;
  taxRegime?: string;
  fiscalResponsibilities: string[];
  ivaResponsible: boolean;
  consumptionTaxResponsible: boolean;
  address: string;
  municipality: string;
  municipalityCode?: string;
  email: string;
}

export interface FiscalConfig {
  _id: string;
  enabled: boolean;
  environment: FiscalEnvironment;
  provider: FiscalProviderName;
  issuer: FiscalIssuer;
  numbering: FiscalNumberingResolution[];
  alertThresholds: { rangeConsumedPercent: number; daysBeforeExpiry: number };
  createdAt: string;
  updatedAt: string;
}

export interface FiscalHealth {
  enabled: boolean;
  environment: FiscalEnvironment;
  provider: FiscalProviderName;
  documentsByStatus: Partial<Record<FiscalDocumentStatus, number>>;
  lastAcceptedAt: string | null;
}

export interface FiscalOrderTicket {
  applicable: boolean;
  status?: FiscalDocumentStatus | 'NOT_APPLICABLE';
  type?: FiscalDocumentType;
  prefix?: string;
  number?: number;
  cufe?: string;
  cude?: string;
  qrData?: string;
  pdfUrl?: string;
  lastError?: string;
}

// ─── Printing (ticket térmico / comandas) ───────────────────────────────────

export type PrinterRole = 'CAJA' | 'BARRA';

export interface Printer {
  _id: string;
  name: string;
  role: PrinterRole;
  ip: string;
  port: number;
  paperWidthMm: number;
  columns: number;
  hasCashDrawer: boolean;
  isActive: boolean;
  agentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrintAgent {
  _id: string;
  name: string;
  isActive: boolean;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Only present right after creating or regenerating an agent's token — the
// backend never returns the cleartext token again afterward.
export interface PrintAgentWithToken extends PrintAgent {
  token: string;
}

export interface PrintConfig {
  _id: string;
  receiptAutoPrint: boolean;
  kitchenPrintingEnabled: boolean;
  openDrawerOnCash: boolean;
  headerText: string;
  footerText: string;
  businessNit: string;
  businessPhone: string;
  businessSocial: string;
  createdAt: string;
  updatedAt: string;
}

export type PrintJobType = 'RECEIPT' | 'KITCHEN_ORDER' | 'REPRINT' | 'TEST';
export type PrintJobStatus = 'PENDING' | 'CLAIMED' | 'DONE' | 'FAILED';

export interface PrintJob {
  _id: string;
  type: PrintJobType;
  printerId?: string | Pick<Printer, '_id' | 'name' | 'role'> | null;
  orderId?: string | null;
  fiscalDocumentId?: string | null;
  status: PrintJobStatus;
  attempts: number;
  claimedAt?: string | null;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrintingAlerts {
  failedJobsCount: number;
  noCajaPrinter: boolean;
  agentsOffline: boolean;
}
