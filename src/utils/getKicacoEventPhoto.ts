const IMAGE_PATH = '/event-images/';

const KEYWORD_TO_IMAGE_MAP: Record<string, string> = {
  'art': 'art.jpg',
  'school supplies': 'school supplies.jpg',
  'concert': 'concert.jpg',
  'deadline': 'deadline.jpg',
  'vaccine': 'vaccine.jpg',
  'karate': 'karate.jpg',
  'baseball': 'baseball.jpg',
  'ballet': 'ballet.jpg',
  'scout': 'scouts.jpg',
  'cheerleading': 'cheerleading.jpg',
  'american football': 'americanfootball.jpg',
  'basketball': 'basketball.jpg',
  'dentist': 'dentist.jpg',
  'permission slip': 'permission slip.jpg',
  'doctor': 'doctor.jpg',
  'tennis': 'tennis.jpg',
  'birthday': 'birthdaycupcake.jpg',
  'soccer': 'soccer.jpg',
  'library': 'library.jpg',
  'keeper': 'keeper.jpg',
};

const DEFAULT_IMAGE = 'default.jpg';

export function getKicacoEventPhoto(eventName: string): string {
  if (!eventName) {
    return `${IMAGE_PATH}${DEFAULT_IMAGE}`;
  }

  const lowerCaseEventName = eventName.toLowerCase();
  
  // Sort keywords by length descending to match longer phrases first
  const sortedKeywords = Object.keys(KEYWORD_TO_IMAGE_MAP).sort((a, b) => b.length - a.length);

  for (const keyword of sortedKeywords) {
    if (lowerCaseEventName.includes(keyword)) {
      return `${IMAGE_PATH}${KEYWORD_TO_IMAGE_MAP[keyword]}`;
    }
  }

  return `${IMAGE_PATH}${DEFAULT_IMAGE}`;
} 