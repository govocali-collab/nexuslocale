'use client';

import { useEffect } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';

export function CalEmbed({ calLink }: { calLink: string }) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal('ui', {
        theme: 'light',
        cssVarsPerTheme: { light: { 'cal-brand': '#5701f3' }, dark: { 'cal-brand': '#5701f3' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    })();
  }, []);

  return (
    <div className="card overflow-hidden" style={{ minHeight: 640 }}>
      <Cal calLink={calLink} style={{ width: '100%', height: '100%', overflow: 'scroll' }} config={{ layout: 'month_view' }} />
    </div>
  );
}
