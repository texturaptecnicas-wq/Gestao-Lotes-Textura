import React, { useEffect, useState } from 'react';
import { acceptAllCookies, rejectOptionalCookies, saveConsent, hasConsentDecision, isConsentGranted, CookieConsentCategory, onCookiePreferencesRequested, openCookiePreferences } from '@/lib/cookieConsent';

export default function CookieBanner() {
  const [open, setOpen] = useState(() => !hasConsentDecision());
  const [custom, setCustom] = useState(false);
  const [choices, setChoices] = useState({ analytics: false, marketing: false, platformAnalytics: false });
  useEffect(() => onCookiePreferencesRequested(() => {
    setChoices({ analytics: isConsentGranted(CookieConsentCategory.Analytics), marketing: isConsentGranted(CookieConsentCategory.Marketing), platformAnalytics: isConsentGranted(CookieConsentCategory.PlatformAnalytics) });
    setCustom(true);
    setOpen(true);
  }), []);
  const decide = action => { action(); setOpen(false); setCustom(false); };
  return <>
    <footer className="px-4 py-4 text-center text-xs text-slate-300"><button className="underline min-h-[44px]" onClick={openCookiePreferences}>Preferências de cookies</button></footer>
    {open && <section role="dialog" aria-label="Preferências de cookies" className="fixed bottom-4 left-4 right-4 z-[110] mx-auto max-w-2xl rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-xl text-sm text-slate-100">
      <h2 className="font-bold mb-2">Cookies e privacidade</h2>
      <p>Usamos cookies necessários ao funcionamento do sistema. Cookies opcionais dependem da sua autorização.</p>
      {custom && <fieldset className="my-4 space-y-3"><legend className="font-semibold mb-2">Escolha as categorias opcionais</legend>
        {[
          ['analytics', 'Estatísticas do site', 'Medição de visitas e uso do site.'],
          ['marketing', 'Marketing', 'Medição de anúncios e publicidade personalizada.'],
          ['platformAnalytics', 'Estatísticas da plataforma', 'A Hostinger usa o Amplitude para melhorar a plataforma, sem identificar você diretamente.'],
        ].map(([key, label, description]) => <label key={key} className="flex gap-3 items-start"><input type="checkbox" checked={choices[key]} onChange={event => setChoices(value => ({ ...value, [key]: event.target.checked }))} className="mt-1" /><span><strong>{label}</strong><br />{description}</span></label>)}
      </fieldset>}
      <div className="flex flex-wrap gap-2 mt-4">
        <button className="border border-slate-500 px-4 py-3 rounded-lg" onClick={() => decide(rejectOptionalCookies)}>Rejeitar opcionais</button>
        <button className="border border-slate-500 px-4 py-3 rounded-lg" onClick={() => custom ? decide(() => saveConsent(choices)) : setCustom(true)}>{custom ? 'Salvar escolhas' : 'Personalizar'}</button>
        <button className="border border-slate-500 px-4 py-3 rounded-lg" onClick={() => decide(acceptAllCookies)}>Aceitar todos</button>
      </div>
    </section>}
  </>;
}
