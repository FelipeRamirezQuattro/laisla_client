import type { Event, Recipe, RecipeVariant } from "../../../types";

export const homeImages = {
  hero: {
    src: "/images/home/hero-barista.jpg",
    alt: "Barista preparando café en La Isla",
  },
  reasons: [
    { src: "/images/home/space-maquina.jpg", alt: "Máquina de espresso preparando café" },
    { src: "/images/home/space-mesa.jpg", alt: "Mesa para trabajar" },
    { src: "/images/home/space-mesera.jpg", alt: "Mesera sirviendo café" },
  ],
  menuFeature: {
    src: "/images/home/hero-cappuccino.jpg",
    alt: "Cappuccino con torta",
  },
  menuPicnic: {
    src: "/images/home/picnic.jpg",
    alt: "Picnic kit de La Isla",
  },
  isleña: [
    { src: "/images/home/space-mesera.jpg", alt: "Mesera de La Isla" },
    { src: "/images/home/visita.jpg", alt: "El patio de La Isla" },
  ],
  cena: {
    src: "/images/home/cena.jpg",
    alt: "Mesa larga en la cena con desconocidos",
  },
  eventFallbacks: [
    { src: "/images/home/picnic.jpg", alt: "Evento en La Isla" },
    { src: "/images/home/space-maquina.jpg", alt: "Evento en La Isla" },
    { src: "/images/home/visita.jpg", alt: "Evento en La Isla" },
  ],
};

export const dinnerFeatures = [
  "Menú de tres tiempos sorpresa, cocinado esa noche.",
  "Cuestionario de compatibilidad para armar la mesa.",
  "Los nombres se revelan en la mesa, no antes.",
];

export const bookingHours = ["13:00", "15:00", "17:00", "19:00"];

export function publicPrice(variant: RecipeVariant) {
  return variant.finalPrice ?? variant.salePrice;
}

export function recipePriceLabel(recipe: Recipe) {
  const prices = recipe.variants.map(publicPrice).filter((price) => price > 0);
  if (!prices.length) return "Consultar";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const format = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value);
  return min === max ? format(min) : `${format(min)} - ${format(max)}`;
}

export function eventDateParts(event: Event) {
  const date = new Date(event.date);
  const day = new Intl.DateTimeFormat("es-CO", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    month: "short",
  })
    .format(date)
    .replace(".", "");
  return { day, month };
}

export function eventDateTimeLabel(event: Event) {
  const date = new Date(event.date);
  const dateLabel = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
  return `${dateLabel} · ${event.time}`;
}

export function eventPriceLabel(event: Event) {
  if (event.pricePerPerson <= 0) return "Entrada libre";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(event.pricePerPerson);
}

export function eventSpotsLeft(event: Event) {
  return Math.max(event.maxCapacity - event.currentRegistrations, 0);
}

export function eventCtaPath(event: Event) {
  return event.type === "dinner-with-strangers"
    ? "/reservar/cena-con-desconocidos"
    : `/reservar/eventos/${event._id}`;
}

export function nextOpenDayChips(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; days.length < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() === 0) continue;
    const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short" })
      .format(date)
      .replace(".", "");
    const label = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}`;
    const value = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    days.push({ label, value });
  }
  return days;
}
