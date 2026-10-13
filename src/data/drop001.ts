export type Drop001Language = "es" | "en";

type LocalizedCopy = Record<Drop001Language, string>;

export type Drop001Look = {
  id: string;
  eyebrow: LocalizedCopy;
  title: LocalizedCopy;
  description: LocalizedCopy;
  image: string;
  alt: LocalizedCopy;
  productId: number | null;
  focalPoint: [number, number];
};

export const drop001Looks: Drop001Look[] = [
  {
    id: "look-black",
    eyebrow: { es: "BUENOS AIRES / 2025", en: "BUENOS AIRES / 2025" },
    title: { es: "KAFUR®", en: "KAFUR®" },
    description: { es: "UNA MIRADA PROPIA.", en: "A POINT OF VIEW." },
    image: "/assets/drop001/look-black.jpg",
    alt: {
      es: "Modelo con remera oversized negra en arquitectura brutalista",
      en: "Model wearing an oversized black T-shirt in brutalist architecture",
    },
    productId: null,
    focalPoint: [0.5, 0.42],
  },
  {
    id: "look-white",
    eyebrow: { es: "PRIMER LANZAMIENTO", en: "FIRST RELEASE" },
    title: { es: "DROP 001", en: "DROP 001" },
    description: { es: "CUATRO REMERAS. UNA SOLA INTENCIÓN.", en: "FOUR T-SHIRTS. ONE INTENTION." },
    image: "/assets/drop001/look-white.jpg",
    alt: {
      es: "Modelo con remera oversized blanca en una calle de Buenos Aires",
      en: "Model wearing an oversized white T-shirt on a Buenos Aires street",
    },
    productId: null,
    focalPoint: [0.5, 0.4],
  },
  {
    id: "look-charcoal",
    eyebrow: { es: "PESO / FORMA / ACTITUD", en: "WEIGHT / SHAPE / ATTITUDE" },
    title: { es: "NO ES SOLO UNA REMERA.", en: "NOT JUST A T-SHIRT." },
    description: { es: "OVERSIZED. HECHA PARA OCUPAR ESPACIO.", en: "OVERSIZED. MADE TO TAKE UP SPACE." },
    image: "/assets/drop001/look-charcoal.jpg",
    alt: {
      es: "Modelo con remera oversized washed charcoal",
      en: "Model wearing a washed charcoal oversized T-shirt",
    },
    productId: null,
    focalPoint: [0.47, 0.38],
  },
  {
    id: "look-detail",
    eyebrow: { es: "DETALLE / ESTAMPA", en: "DETAIL / PRINT" },
    title: { es: "ARTE PARA LLEVAR PUESTO.", en: "ART YOU CAN WEAR." },
    description: { es: "ALGODÓN PESADO. GRÁFICA ORIGINAL.", en: "HEAVY COTTON. ORIGINAL GRAPHIC." },
    image: "/assets/drop001/look-detail.jpg",
    alt: {
      es: "Detalle de tela negra y estampa abstracta en marfil y rojo oscuro",
      en: "Detail of black fabric with an abstract ivory and dark-red print",
    },
    productId: null,
    focalPoint: [0.62, 0.5],
  },
];

export const drop001Closing = {
  eyebrow: { es: "DROP 001 / DISPONIBLE AHORA", en: "DROP 001 / AVAILABLE NOW" },
  title: { es: "EXPLORAR EL DROP", en: "EXPLORE THE DROP" },
  description: { es: "REMERAS OVERSIZED — BUENOS AIRES", en: "OVERSIZED T-SHIRTS — BUENOS AIRES" },
} satisfies Record<string, LocalizedCopy>;
