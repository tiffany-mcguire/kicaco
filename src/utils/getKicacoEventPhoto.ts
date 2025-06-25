const IMAGE_PATH = '/event-images/';

const KEYWORD_TO_IMAGE_MAP: Record<string, string> = {
  // Sports & Activities
  'american football': 'americanfootball.jpg',
  'basketball': 'basketball.jpg',
  'baseball': 'baseball.jpg',
  'kids baseball': 'kids baseball.jpg',
  'soccer': 'soccer.jpg',
  'tennis': 'tennis.jpg',
  'karate': 'karate.jpg',
  'kids karate': 'kids karate.jpg',
  'ballet': 'ballet.jpg',
  'cheerleading': 'cheerleading.jpg',
  'swim': 'lap swim pool.jpg',
  'swimming': 'lap swim pool.jpg',
  'pool': 'lap swim pool.jpg',
  
  // Medical & Health
  'doctor': 'doctor.jpg',
  'little kids doctor': 'little kids doctor.jpg',
  'pediatric': 'little kids doctor.jpg',
  'check-up': 'check-up.jpg',
  'checkup': 'check-up.jpg',
  'dentist': 'dentist.jpg',
  'vaccine': 'vaccine.jpg',
  'vaccination': 'vaccine.jpg',
  
  // School & Education
  'art': 'art.jpg',
  'school supplies': 'school supplies.jpg',
  'homework': 'homework.jpg',
  'tutor': 'tutor.jpg',
  'tutoring': 'tutor.jpg',
  'library': 'library of books.jpeg',
  'permission slip': 'permission slip.jpg',
  'deadline': 'deadline.jpg',
  
  // Personal Care
  'haircut': 'boy haircut.jpg',
  'hair cut': 'boy haircut.jpg',
  'barber': 'boy haircut.jpg',
  
  // Entertainment & Social
  'birthday': 'birthdaycupcake.jpg',
  'birthday party': 'birthday cupcake.jpg',
  'concert': 'concert.jpg',
  'music': 'concert.jpg',
  'scout': 'scouts.jpg',
  'scouts': 'scouts.jpg',
  
  // Default
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