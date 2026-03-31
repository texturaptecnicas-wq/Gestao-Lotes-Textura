
/**
 * Utility to clean up browser storage and cache.
 * 
 * Safe Keys (Required by the app):
 * - 'userRole': Stores the role of the authenticated user.
 * - 'loginType': Stores the type of login session.
 * - 'whatsapp_message_default': Stores custom WhatsApp message template.
 * - 'sb-*': Supabase session tokens and auth data.
 * 
 * All other obsolete keys will be removed.
 */
export const cleanupStorage = () => {
  try {
    const allowedLocalKeys = ['userRole', 'loginType', 'whatsapp_message_default'];
    const keysToRemove = [];

    // Identify obsolete items in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !allowedLocalKeys.includes(key) && !key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }

    // Remove obsolete items
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage completely as it usually holds temporary outdated state
    sessionStorage.clear();
  } catch (err) {
    // Ignore errors in environments where storage access is disabled or restricted
  }
};
