/**
 * Format location string to title case with special handling for common patterns
 */
export function formatLocationToTitleCase(location: string): string {
  if (!location) return '';
  
  // Common abbreviations that should stay uppercase
  const uppercase = ['NE', 'NW', 'SE', 'SW', 'N', 'S', 'E', 'W', 'USA', 'US', 'UK'];
  
  // Common words that should stay lowercase (unless first word)
  const lowercase = ['a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];
  
  // Common street suffixes that should be properly capitalized
  const streetSuffixes = ['St', 'Ave', 'Rd', 'Dr', 'Blvd', 'Ln', 'Ct', 'Pl', 'Way', 'Pkwy', 'Hwy'];
  
  return location
    .split(' ')
    .map((word, index) => {
      // Skip empty strings
      if (!word) return word;
      
      // Check if it's an uppercase abbreviation
      if (uppercase.includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      
      // Check if it's a lowercase word (but not first word)
      if (index > 0 && lowercase.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      // Check if it's a street suffix
      const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      if (streetSuffixes.includes(capitalizedWord)) {
        return capitalizedWord;
      }
      
      // Default: capitalize first letter, lowercase rest
      return capitalizedWord;
    })
    .join(' ')
    .trim();
} 