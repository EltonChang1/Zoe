import { RankedObject } from "./types";

export const objects: Record<string, RankedObject> = {
  O001: {
    id: "O001",
    type: "cafe",
    title: "Sumi Coffee",
    subtitle: "Third-wave · quiet",
    city: "Pittsburgh",
    neighborhood: "Shadyside",
    tags: ["quiet", "laptop-friendly", "aesthetic"],
    shortDescriptor: "Light-filled corner shop with a tiny seasonal menu.",
    heroImage:
      "https://images.unsplash.com/photo-1453614512568-c4024d13c249?auto=format&fit=crop&w=1200&q=80",
  },
  O004: {
    id: "O004",
    type: "restaurant",
    title: "Legume",
    subtitle: "Seasonal · neighborhood",
    city: "Pittsburgh",
    neighborhood: "Oakland",
    tags: ["comforting", "casual", "group"],
    heroImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  },
  O005: {
    id: "O005",
    type: "bar",
    title: "Acrimony",
    subtitle: "Low-light · natural wine",
    city: "Pittsburgh",
    neighborhood: "Lawrenceville",
    tags: ["date-night", "natural-wine", "low-light"],
    heroImage:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80",
  },
  O006: {
    id: "O006",
    type: "perfume",
    title: "Bal d'Afrique",
    subtitle: "Byredo",
    tags: ["luxury", "warm", "night"],
    heroImage:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
  },
  O007: {
    id: "O007",
    type: "perfume",
    title: "Blanche",
    subtitle: "Byredo · skin scent",
    tags: ["clean", "skin-scent", "minimal"],
    heroImage:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80",
  },
  O008: {
    id: "O008",
    type: "perfume",
    title: "Gris Charnel",
    subtitle: "BDK Parfums",
    tags: ["woody", "tea", "night"],
    heroImage:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=1200&q=80",
  },
  O009: {
    id: "O009",
    type: "album",
    title: "Blonde",
    subtitle: "Frank Ocean",
    tags: ["all-time", "late-night", "headphones"],
    heroImage:
      "https://images.unsplash.com/photo-1514533212735-5df27d970db9?auto=format&fit=crop&w=1200&q=80",
  },
  O012: {
    id: "O012",
    type: "cafe",
    title: "Cha Cha Matcha",
    subtitle: "Matcha · aesthetic",
    city: "New York",
    neighborhood: "SoHo",
    tags: ["matcha", "aesthetic", "dessert"],
    heroImage:
      "https://images.unsplash.com/photo-1536520002442-39764a41e987?auto=format&fit=crop&w=1200&q=80",
  },
  O020: {
    id: "O020",
    type: "sneaker",
    title: "Aether \"Concrete\" High",
    subtitle: "Limited run",
    tags: ["sneakers", "limited", "street"],
    heroImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
  },
  O021: {
    id: "O021",
    type: "cafe",
    title: "Kurasu",
    subtitle: "Ceremonial grade matcha",
    city: "Kyoto",
    tags: ["matcha", "minimal", "slow"],
    heroImage:
      "https://images.unsplash.com/photo-1515592302748-6c5ea17e2f0e?auto=format&fit=crop&w=1200&q=80",
  },
};

export function getObject(id: string): RankedObject | undefined {
  return objects[id];
}

/**
 * Merge an object record into the runtime cache so any catalog item the app
 * has seen over the wire is reachable via `getObject(id)`.
 */
export function registerObject(partial: Partial<RankedObject> & Pick<RankedObject, "id" | "title" | "type">) {
  const existing = objects[partial.id];
  objects[partial.id] = {
    id: partial.id,
    type: partial.type,
    title: partial.title,
    subtitle: partial.subtitle ?? existing?.subtitle,
    city: partial.city ?? existing?.city,
    neighborhood: partial.neighborhood ?? existing?.neighborhood,
    tags: partial.tags ?? existing?.tags ?? [],
    shortDescriptor: partial.shortDescriptor ?? existing?.shortDescriptor,
    heroImage: partial.heroImage ?? existing?.heroImage ?? "",
    metadata: partial.metadata ?? existing?.metadata,
  };
}
