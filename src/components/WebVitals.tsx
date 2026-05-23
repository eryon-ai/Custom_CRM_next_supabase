'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'production') {
      const body = JSON.stringify({
        name: metric.name,
        value: Math.round(metric.value),
        rating: metric.rating,
        page: window.location.pathname,
      });
      navigator.sendBeacon('/api/analytics/web-vitals', body);
    }
  });
  return null;
}
