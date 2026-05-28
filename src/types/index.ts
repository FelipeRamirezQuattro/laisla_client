// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

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
export type PaymentMethod = 'cash' | 'card' | 'transfer';

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

export interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  visitCount: number;
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

// ─── Cash Closing ────────────────────────────────────────────────────────────

export interface Expense {
  description: string;
  amount: number;
  source?: 'manual' | 'daily_expense';
  expenseId?: string;
}

export interface CashClosing {
  _id: string;
  date: string;
  openingCash: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  expenses: Expense[];
  totalExpenses: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  notes?: string;
  closedBy: string | User;
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
export type RawMaterialCategory =
  | 'LACTEOS' | 'BASES_POLVO' | 'JARABES_SALSAS' | 'CONCENTRADOS'
  | 'TE_INFUSIONES' | 'CAFE' | 'AGUA' | 'VASOS_CARTON' | 'VASOS_PLASTICO'
  | 'EXTRAS' | 'SUPLEMENTOS' | 'AZUCAR' | 'POLVOS' | 'FRUTAS_VERDURAS'
  | 'UNTABLES' | 'HIELO' | 'MODIFICADORES' | 'POLLO' | 'SYRUPS' | 'PERLAS'
  | 'MATERIALES_PICNIC' | 'DECORACION';

export type RecipeCategory = string;

export interface RecipeCategoryOption {
  _id: string;
  value: RecipeCategory;
  label: string;
  orden: number;
}

export type VariantSize = '6OZ' | '8OZ' | '12OZ' | '16OZ' | '20OZ' | 'UND';

export interface RawMaterial {
  _id: string;
  category: RawMaterialCategory;
  name: string;
  presentation: string;
  purchaseUnit: MeasurementUnit;
  quantityPerPresentation: number;
  totalPrice: number;
  pricePerUnit: number;
  supplier: string;
  notes: string;
  minStock: number;
  importedFromExcel: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  targetMargin?: number;
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

export interface InventoryStatus {
  rawMaterial: RawMaterial;
  closingStock: number;
  unit: MeasurementUnit;
  belowMin: boolean;
  lastPeriod: string | null;
}

export interface CascadePreview {
  affectedPacks: number;
  affectedRecipes: number;
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
