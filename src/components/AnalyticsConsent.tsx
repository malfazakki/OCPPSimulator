import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsAvailable, getAnalyticsConsent, setAnalyticsConsent, trackPage } from '@/lib/analytics';
import { Button } from './ui/button';

export function AnalyticsConsent() {
  const { pathname } = useLocation();
  const [consent, setConsent] = useState(getAnalyticsConsent);
  const [editing, setEditing] = useState(false);
  const available = analyticsAvailable();

  useEffect(() => {
    if (available && consent === 'granted') trackPage(pathname);
  }, [available, consent, pathname]);

  useEffect(() => {
    const sync = () => {
      const value = getAnalyticsConsent();
      if (value === 'denied' || value === null) {
        setAnalyticsConsent('denied');
        // Unload Google's script and listeners after withdrawal in another tab.
        if (consent === 'granted') window.location.reload();
      }
      setConsent(value);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [consent]);

  if (!available) return null;

  const choose = (value: 'granted' | 'denied') => {
    setAnalyticsConsent(value);
    setConsent(value);
    setEditing(false);
    // A reload removes the loaded tag and its automatic collection listeners.
    if (consent === 'granted' && value === 'denied') window.location.reload();
  };

  return (
    <aside aria-label='Analytics preferences' className='fixed bottom-3 right-3 z-50 max-w-[calc(100%-1.5rem)]'>
      {consent === null || editing ? (
        <section aria-labelledby='analytics-title' className='w-96 max-w-full rounded-lg border bg-background p-4 shadow-lg'>
          <h2 id='analytics-title' className='font-semibold'>Help improve OCPP Simulator</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Optional Google Analytics cookies measure visits and feature use. Google receives browser and usage data.
            We do not send CSMS addresses, charge point IDs, credentials or OCPP messages.
            Your choice is saved on this device. You can withdraw consent here anytime.
          </p>
          <a className='mt-2 inline-block text-sm underline' href='https://policies.google.com/privacy' target='_blank' rel='noopener noreferrer'>Google privacy policy</a>
          <div className='mt-3 flex flex-wrap gap-2'>
            <Button variant='outline' onClick={() => choose('denied')}>Reject analytics</Button>
            <Button variant='outline' onClick={() => choose('granted')}>Allow analytics</Button>
            {consent !== null && <Button variant='ghost' onClick={() => setEditing(false)}>Close</Button>}
          </div>
        </section>
      ) : (
        <Button variant='outline' size='sm' className='bg-background' onClick={() => setEditing(true)}>Analytics preferences</Button>
      )}
    </aside>
  );
}
