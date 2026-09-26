/**
 * LOCAL & BACKEND STORAGE SERVICE
 * Handles persistent client state & backend data syncing.
 */

export const StorageService = {
  LOCAL_CALCS_KEY: 'elevate_bfsi_recent_calculations',
  USER_PROFILE_KEY: 'elevate_bfsi_user_profile',

  // Save calculation entry
  async saveCalculation(data) {
    try {
      // 1. Save to localStorage array
      const existing = this.getRecentCalculations();
      const newRecord = {
        id: 'CALC-' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
        ...data
      };

      existing.unshift(newRecord);
      const trimmed = existing.slice(0, 25);
      localStorage.setItem(this.LOCAL_CALCS_KEY, JSON.stringify(trimmed));

      // 2. Post to backend server endpoint
      fetch('/api/save-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(err => console.warn('Backend storage sync warning:', err.message));

      return newRecord;
    } catch (e) {
      console.error('Failed to save calculation to storage:', e);
      return null;
    }
  },

  getRecentCalculations() {
    try {
      const raw = localStorage.getItem(this.LOCAL_CALCS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  getUserProfile() {
    try {
      const raw = localStorage.getItem(this.USER_PROFILE_KEY);
      return raw ? JSON.parse(raw) : { name: 'Priya Adsul', email: 'priya.adsul@bfsi.com' };
    } catch (e) {
      return { name: 'Priya Adsul' };
    }
  },

  setUserProfile(profile) {
    try {
      localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save user profile:', e);
    }
  }
};
