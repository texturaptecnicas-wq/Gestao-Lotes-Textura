
import { useState, useEffect } from 'react';
import { getAlertsByClient } from '@/services/qualityService';

export const useQualityAlerts = (clientName) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      if (!clientName) {
        if (isMounted) {
          setAlerts([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const data = await getAlertsByClient(clientName);
        if (isMounted) {
          setAlerts(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          console.error("Error in useQualityAlerts hook:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAlerts();

    return () => {
      isMounted = false;
    };
  }, [clientName]);

  return { alerts, loading, error };
};
