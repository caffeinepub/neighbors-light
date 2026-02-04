const STORAGE_KEY = 'bedTrackingPreferences_v1';

export interface BedTrackingPreferences {
  programFilter: string;
  statusFilter: string;
  showArchived: boolean;
}

const DEFAULT_PREFERENCES: BedTrackingPreferences = {
  programFilter: 'all',
  statusFilter: 'available',
  showArchived: false,
};

/**
 * Load bed tracking preferences from localStorage with safe fallback
 */
export function loadBedTrackingPreferences(): BedTrackingPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(stored);
    
    // Validate and normalize stored values
    const programFilter = ['all', 'medicalStepDown', 'workforceHousing'].includes(parsed.programFilter)
      ? parsed.programFilter
      : DEFAULT_PREFERENCES.programFilter;
    
    const statusFilter = ['all', 'available', 'occupied'].includes(parsed.statusFilter)
      ? parsed.statusFilter
      : DEFAULT_PREFERENCES.statusFilter;
    
    const showArchived = typeof parsed.showArchived === 'boolean'
      ? parsed.showArchived
      : DEFAULT_PREFERENCES.showArchived;

    return {
      programFilter,
      statusFilter,
      showArchived,
    };
  } catch (error) {
    console.warn('Failed to load bed tracking preferences, using defaults:', error);
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Save bed tracking preferences to localStorage
 */
export function saveBedTrackingPreferences(preferences: BedTrackingPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save bed tracking preferences:', error);
  }
}

/**
 * Clear bed tracking preferences from localStorage
 */
export function clearBedTrackingPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear bed tracking preferences:', error);
  }
}

/**
 * Get default preferences
 */
export function getDefaultPreferences(): BedTrackingPreferences {
  return { ...DEFAULT_PREFERENCES };
}
