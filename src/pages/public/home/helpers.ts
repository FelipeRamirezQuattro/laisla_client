import type { Event, Recipe, RecipeVariant } from "../../../types";

export const homeImages = {
  hero: {
    src: "/images/home/hero-barista.jpg",
    alt: "Barista preparando cafe en La Isla",
  },
  reasons: [
    { src: "/images/home/space-maquina.jpg", alt: "Maquina de espresso" },
    { src: "/images/home/space-mesa.jpg", alt: "Mesa para trabajar" },
    { src: "/images/home/space-mesera.jpg", alt: "Mesera sirviendo cafe" },
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
  "Menu de tres tiempos sorpresa, cocinado esa noche.",
  "Cuestionario de compatibilidad para armar la mesa.",
  "Los nombres se revelan en la mesa, no antes.",
];

export const bookingHours = ["10:00", "12:30", "15:00", "17:30", "20:00"];

export const socialLinks = {
  instagram: "https://www.instagram.com/laislacafepicnic?stkn=dXNrNGlqb2Jqdms3",
  tiktok: "https://www.tiktok.com/@laislacafepicnic?_r=1&_t=ZS-99ZGrZCYxAW",
};

export const contact = {
  email: "hola@laislacafepicnic.com",
  phone: "311 863 8163",
  phoneHref: "tel:+573118638163",
};

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

export function nextDayChips(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short" })
      .format(date)
      .replace(".", "");
    const label = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}`;
    days.push({ label, date });
  }
  return days;
}
