import { useState, useEffect } from 'react';

/**
 * Hook that provides a current timestamp that updates every minute
 * Used to keep waiting-time displays fresh without refetching data
 */
export function useNow(): number {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Update every minute (60000ms)
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return now;
}
