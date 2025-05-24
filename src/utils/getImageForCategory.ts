export function getImageForCategory(tag: string = ''): string {
  return `/event-images/${tag || 'default'}.jpg`;
} 