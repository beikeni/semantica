/**
 * Level to Agent ID mapping
 * Maps level identifiers to OpenAI Assistant IDs
 */
export const LEVEL_AGENT_MAP: Record<string, string> = {
  'level-1': 'asst_nLCxt5TFX55eUkmz0HPnmuEx',
  'level-2': 'asst_0POmM4TlwqH1ZwrpHhfi4ter',
  'level-3': 'asst_dHRfJMKIZK8uXjryLuhNiSCb'
};

/**
 * Get agent ID for a given level
 */
export function getAgentForLevel(level: string): string {
  return LEVEL_AGENT_MAP[level] ?? '';
}

/**
 * API endpoint for form submission
 */
export const API_ENDPOINT = 'https://hook.us2.make.com/5romqcao8vwbfz7bqv1vuf1bctc61g83';

/**
 * Mode options for the form
 */
export const MODE_OPTIONS = [
  { value: 'conversation', label: 'Conversation' },
  { value: 'comprehension', label: 'Comprehension' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'grammar', label: 'Grammar' }
];

/**
 * Last client status options
 * Note: Using '__none__' instead of empty string because Radix UI Select 
 * doesn't allow empty string values
 */
export const LAST_CLIENT_STATUS_OPTIONS = [
  { value: '__none__', label: 'None' },
  { value: 'Dialogue Reading complete', label: 'Dialogue Reading complete' }
];

