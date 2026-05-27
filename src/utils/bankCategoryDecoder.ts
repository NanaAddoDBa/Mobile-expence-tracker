import { Category, CategorizationRule } from '../types';

/**
 * Intelligent transaction decoder.
 * Uses custom rules provided by the user + a strong pre-configured standard dictionary
 * to map raw merchant lines/payment descriptions into appropriate structured Categories.
 */
export function decodeTransactionCategory(
  description: string,
  customRules: CategorizationRule[] = []
): Category {
  const norm = description.toLowerCase().trim();

  // 1. Check custom user-defined rules first
  for (const rule of customRules) {
    if (norm.includes(rule.keyword.toLowerCase())) {
      return rule.category;
    }
  }

  // 2. Pre-configured comprehensive rule dictionary
  
  // Income Sources
  if (
    norm.includes('salary') ||
    norm.includes('wage') ||
    norm.includes('paycheck') ||
    norm.includes('google inc') ||
    norm.includes('freelance') ||
    norm.includes('consulting') ||
    norm.includes('stripe') ||
    norm.includes('dividend') ||
    norm.includes('cashback') ||
    norm.includes('refund') ||
    norm.includes('settlement') ||
    norm.includes('upwork')
  ) {
    return 'Income';
  }

  // Food & Dining
  if (
    norm.includes('starbucks') ||
    norm.includes('mcdonald') ||
    norm.includes('burger') ||
    norm.includes('whole foods') ||
    norm.includes('costco') ||
    norm.includes('grocery') ||
    norm.includes('groceries') ||
    norm.includes('restaurant') ||
    norm.includes('dining') ||
    norm.includes('pizza') ||
    norm.includes('cafe') ||
    norm.includes('baking') ||
    norm.includes('kfc') ||
    norm.includes('subway') ||
    norm.includes('ramen') ||
    norm.includes('bistro') ||
    norm.includes('sushi') ||
    norm.includes('doordash') ||
    norm.includes('ubereats') ||
    norm.includes('grubhub') ||
    norm.includes('pub') ||
    norm.includes('starb') ||
    norm.includes('barist')
  ) {
    return 'Food & Dining';
  }

  // Transport
  if (
    norm.includes('uber') ||
    norm.includes('lyft') ||
    norm.includes('taxi') ||
    norm.includes('transit') ||
    norm.includes('metro') ||
    norm.includes('rail') ||
    norm.includes('train') ||
    norm.includes('bus') ||
    norm.includes('shell') ||
    norm.includes('chevron') ||
    norm.includes('gas station') ||
    norm.includes('fuel') ||
    norm.includes('esso') ||
    norm.includes('texaco') ||
    norm.includes('petrol') ||
    norm.includes('tollway') ||
    norm.includes('flight') ||
    norm.includes('commute')
  ) {
    return 'Transport';
  }

  // Utilities
  if (
    norm.includes('comcast') ||
    norm.includes('verizon') ||
    norm.includes('broadband') ||
    norm.includes('at&t') ||
    norm.includes('t-mobile') ||
    norm.includes('water bill') ||
    norm.includes('electric') ||
    norm.includes('power & light') ||
    norm.includes('gas company') ||
    norm.includes('sewer') ||
    norm.includes('aws') ||
    norm.includes('cloud') ||
    norm.includes('hosting') ||
    norm.includes('hostinger') ||
    norm.includes('utility') ||
    norm.includes('wireless') ||
    norm.includes('energy') ||
    norm.includes('internet')
  ) {
    return 'Utilities';
  }

  // Entertainment
  if (
    norm.includes('netflix') ||
    norm.includes('spotify') ||
    norm.includes('steam') ||
    norm.includes('hulu') ||
    norm.includes('disney') ||
    norm.includes('hbomax') ||
    norm.includes('hbo') ||
    norm.includes('crunchyroll') ||
    norm.includes('cinema') ||
    norm.includes('movie') ||
    norm.includes('concert') ||
    norm.includes('theatre') ||
    norm.includes('ticketmaster') ||
    norm.includes('nintendo') ||
    norm.includes('playstation') ||
    norm.includes('xbox') ||
    norm.includes('gaming') ||
    norm.includes('audible') ||
    norm.includes('streaming') ||
    norm.includes('showtime')
  ) {
    return 'Entertainment';
  }

  // Healthcare
  if (
    norm.includes('cvs') ||
    norm.includes('walgreens') ||
    norm.includes('pharmacy') ||
    norm.includes('medical') ||
    norm.includes('clinic') ||
    norm.includes('hospital') ||
    norm.includes('dentist') ||
    norm.includes('dental') ||
    norm.includes('doctor') ||
    norm.includes('health') ||
    norm.includes('physio') ||
    norm.includes('chiropractor') ||
    norm.includes('insurance') ||
    norm.includes('fitness') ||
    norm.includes('gym') ||
    norm.includes('wellness') ||
    norm.includes('prescription')
  ) {
    return 'Healthcare';
  }

  // Education
  if (
    norm.includes('udemy') ||
    norm.includes('coursera') ||
    norm.includes('bookstore') ||
    norm.includes('tuition') ||
    norm.includes('college') ||
    norm.includes('university') ||
    norm.includes('school') ||
    norm.includes('educate') ||
    norm.includes('class') ||
    norm.includes('seminar') ||
    norm.includes('textbook') ||
    norm.includes('edx') ||
    norm.includes('skillshare')
  ) {
    return 'Education';
  }

  // Travel
  if (
    norm.includes('airbnb') ||
    norm.includes('hotel') ||
    norm.includes('hostel') ||
    norm.includes('delta air') ||
    norm.includes('american air') ||
    norm.includes('united air') ||
    norm.includes('booking.com') ||
    norm.includes('expedia') ||
    norm.includes('luggage') ||
    norm.includes('trip') ||
    norm.includes('resort') ||
    norm.includes('boarding')
  ) {
    return 'Travel';
  }

  // Shopping
  if (
    norm.includes('amazon') ||
    norm.includes('ebay') ||
    norm.includes('target') ||
    norm.includes('walmart') ||
    norm.includes('apple') ||
    norm.includes('best buy') ||
    norm.includes('keyboard') ||
    norm.includes('clothing') ||
    norm.includes('apparel') ||
    norm.includes('zara') ||
    norm.includes('h&m') ||
    norm.includes('nike') ||
    norm.includes('adidas') ||
    norm.includes('furniture') ||
    norm.includes('mall') ||
    norm.includes('boutique') ||
    norm.includes('shoes') ||
    norm.includes('tech')
  ) {
    return 'Shopping';
  }

  return 'Other';
}
