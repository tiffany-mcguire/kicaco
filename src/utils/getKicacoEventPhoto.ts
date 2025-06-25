const IMAGE_PATH = '/event-images/';

const KEYWORD_TO_IMAGE_MAP: Record<string, string> = {
  // Sports & Activities
  'american football': 'americanfootball.jpg',
  'football': 'americanfootball.jpg',
  'basketball': 'basketball.jpg',
  'baseball': 'baseball.jpg',
  'kids baseball': 'kids baseball.jpg',
  'soccer': 'soccer.jpg',
  'tennis': 'tennis.jpg',
  'karate': 'karate.jpg',
  'kids karate': 'kids karate.jpg',
  'martial arts': 'karate.jpg',
  'ballet': 'ballet.jpg',
  'dance': 'ballet.jpg',
  'cheerleading': 'cheerleading.jpg',
  'cheer': 'cheerleading.jpg',
  'swim': 'lap swim pool.jpg',
  'swimming': 'lap swim pool.jpg',
  'pool': 'lap swim pool.jpg',
  'teen sports': 'teen sports.jpg',
  'sports': 'teen sports.jpg',
  'playground': 'playground swings.jpg',
  'swings': 'playground swings.jpg',
  'recess': 'playground swings.jpg',
  
  // Medical & Health
  'doctor': 'doctor.jpg',
  'little kids doctor': 'little kids doctor.jpg',
  'pediatric': 'little kids doctor.jpg',
  'pediatrician': 'little kids doctor.jpg',
  'check-up': 'check-up.jpg',
  'checkup': 'check-up.jpg',
  'physical': 'check-up.jpg',
  'dentist': 'dentist.jpg',
  'dental': 'dentist.jpg',
  'vaccine': 'vaccine.jpg',
  'vaccination': 'vaccine.jpg',
  'shot': 'vaccine.jpg',
  'immunization': 'vaccine.jpg',
  'eye exam': 'eye exam vision test.jpg',
  'vision test': 'eye exam vision test.jpg',
  'optometrist': 'eye exam vision test.jpg',
  'prescription': 'prescription medications.jpg',
  'medication': 'prescription medications.jpg',
  'medicine': 'prescription medications.jpg',
  'pharmacy': 'prescription medications.jpg',
  
  // School & Education
  'art': 'art.jpg',
  'art class': 'art.jpg',
  'painting': 'art.jpg',
  'drawing': 'art.jpg',
  'school supplies': 'school supplies.jpg',
  'supplies': 'school supplies.jpg',
  'back to school': 'school supplies.jpg',
  'homework': 'homework.jpg',
  'study': 'homework.jpg',
  'assignment': 'homework.jpg',
  'tutor': 'tutor.jpg',
  'tutoring': 'tutor.jpg',
  'library': 'library of books.jpeg',
  'books': 'library of books.jpeg',
  'reading': 'library of books.jpeg',
  'permission slip': 'permission slip.jpg',
  'form': 'permission slip.jpg',
  'paperwork': 'permission slip.jpg',
  'deadline': 'deadline.jpg',
  'due date': 'deadline.jpg',
  'school backpack': 'school backpack.jpg',
  'backpack': 'school backpack.jpg',
  'school bag': 'school backpack.jpg',
  'school hallway': 'school hallway.jpg',
  'hallway': 'school hallway.jpg',
  'school corridor': 'school hallway.jpg',
  'school classroom': 'school classroom desks.jpg',
  'classroom': 'school classroom desks.jpg',
  'class': 'school classroom desks.jpg',
  'school locker': 'school locker.jpg',
  'locker': 'school locker.jpg',
  'school bus': 'school bus stop.jpg',
  'bus stop': 'school bus stop.jpg',
  'bus': 'school bus stop.jpg',
  'school snacks': 'school snacks.jpg',
  'snacks': 'school snacks.jpg',
  'lunch': 'school snacks.jpg',
  'teens at school': 'teens at school.jpg',
  'high school': 'teens at school.jpg',
  'middle school': 'teens at school.jpg',
  'parent teacher conference': 'parent-teacher conference.jpg',
  'conference': 'parent-teacher conference.jpg',
  'meeting': 'parent-teacher conference.jpg',
  'picture day': 'picture day.jpg',
  'photos': 'picture day.jpg',
  'school photos': 'picture day.jpg',
  'book fair': 'book fair.jpg',
  'fair': 'book fair.jpg',
  'field trip': 'class field trip.jpg',
  'excursion': 'class field trip.jpg',
  
  // Personal Care & Shopping
  'haircut': 'boy haircut.jpg',
  'hair cut': 'boy haircut.jpg',
  'barber': 'boy haircut.jpg',
  'salon': 'boy haircut.jpg',
  'back-to-school clothes': 'back-to-school clothes.jpg',
  'clothes shopping': 'back-to-school clothes.jpg',
  'shopping': 'back-to-school clothes.jpg',
  'new clothes': 'back-to-school clothes.jpg',
  'donate clothes': 'donate clothes.jpg',
  'donation': 'donate clothes.jpg',
  'charity': 'donate clothes.jpg',
  'folded clothes': 'folded clothes.jpg',
  'laundry': 'folded clothes.jpg',
  'clothes': 'folded clothes.jpg',
  
  // Entertainment & Social
  'birthday': 'birthdaycupcake.jpg',
  'birthday party': 'birthday cupcake.jpg',
  'party': 'birthday cupcake.jpg',
  'concert': 'concert.jpg',
  'music': 'concert.jpg',
  'performance': 'concert.jpg',
  'scout': 'scouts.jpg',
  'scouts': 'scouts.jpg',
  'boy scouts': 'scouts.jpg',
  'girl scouts': 'scouts.jpg',
  'game night': 'game night.jpg',
  'games': 'game night.jpg',
  'board games': 'game night.jpg',
  'family game': 'game night.jpg',
  'ice cream': 'ice cream.jpg',
  'treat': 'ice cream.jpg',
  'dessert': 'ice cream.jpg',
  'bake sale': 'bake sale cookies.jpg',
  'cookies': 'bake sale cookies.jpg',
  'fundraiser': 'bake sale cookies.jpg',
  'sale': 'bake sale cookies.jpg',
  
  // Transportation & Travel
  'carpool': 'carpool.jpg',
  'pickup': 'carpool.jpg',
  'drop off': 'carpool.jpg',
  'ride': 'carpool.jpg',
  'family vacation': 'family vacation suitcase.jpg',
  'vacation': 'family vacation suitcase.jpg',
  'travel': 'family vacation suitcase.jpg',
  'trip': 'family vacation suitcase.jpg',
  'suitcase': 'family vacation suitcase.jpg',
  'work from home': 'work from home.jpg',
  'remote work': 'work from home.jpg',
  'home office': 'work from home.jpg',
  'wfh': 'work from home.jpg',
  
  // Educational Outings & Museums
  'aquarium': 'aquarium.jpg',
  'fish': 'aquarium.jpg',
  'marine life': 'aquarium.jpg',
  'art museum': 'art museum.jpg',
  'museum': 'art museum.jpg',
  'gallery': 'art museum.jpg',
  'natural history museum': 'natural history museum.jpg',
  'history museum': 'natural history museum.jpg',
  'dinosaurs': 'natural history museum.jpg',
  'nature hike': 'nature hike.jpg',
  'hike': 'nature hike.jpg',
  'hiking': 'nature hike.jpg',
  'nature': 'nature hike.jpg',
  'outdoors': 'nature hike.jpg',
  
  // Zoo Animals
  'zoo': 'zoo bears.jpg',
  'zoo bears': 'zoo bears.jpg',
  'bears': 'zoo bears.jpg',
  'zoo giraffes': 'zoo giraffes.jpg',
  'giraffes': 'zoo giraffes.jpg',
  'zoo red panda': 'zoo red panda.jpg',
  'red panda': 'zoo red panda.jpg',
  'panda': 'zoo red panda.jpg',
  'zoo tiger': 'zoo tiger.jpg',
  'tiger': 'zoo tiger.jpg',
  'animals': 'zoo bears.jpg',
  
  // Default
  'keeper': 'keeper.jpg',
};

const DEFAULT_IMAGE = 'default event.jpg';

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