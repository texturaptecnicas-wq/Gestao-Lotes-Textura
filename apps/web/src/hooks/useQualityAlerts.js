import { useState, useEffect } from 'react';
import { getAllAlerts } from '@/services/qualityService';

let globalAlertsCache = null;
let globalAlertsPromise = null;

export const useQualityAlerts = () => {
  const [alerts, setAlerts] = useState(globalAlertsCache || []);
  const [loading, setLoading] = useState(!globalAlertsCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (globalAlertsCache) {
      setAlerts(globalAlertsCache);
      setLoading(false);
      return;
    }

    if (!globalAlertsPromise) {
      globalAlertsPromise = getAllAlerts().then(data => {
        globalAlertsCache = data;
        return data;
      }).catch(err => {
        globalAlertsPromise = null;
        throw err;
      });
    }

    globalAlertsPromise
      .then(data => {
        if (isMounted) {
          setAlerts(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
          console.error("Error in useQualityAlerts hook:", err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { alerts, loading, error };
};