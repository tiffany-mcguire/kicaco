// Utility to get a Kicaco event photo by event type/name
const KICACO_EVENT_PHOTOS: Record<string, string> = {
  concert: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=80&h=80',
  soccer: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=facearea&w=80&h=80',
  default: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=facearea&w=80&h=80',
  // ...add more as needed
};

export function getKicacoEventPhoto(eventName: string) {
  if (!eventName) return KICACO_EVENT_PHOTOS.default;
  const name = eventName.toLowerCase();
  if (name.includes('concert')) return KICACO_EVENT_PHOTOS.concert;
  if (name.includes('soccer')) return KICACO_EVENT_PHOTOS.soccer;
  // ...add more mappings as needed
  return KICACO_EVENT_PHOTOS.default;
} 