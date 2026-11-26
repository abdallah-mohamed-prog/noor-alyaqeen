import React, { useState, useCallback } from 'react';
export const FileCard = ({ children, lang, dir }: any) => <main className="card" lang={lang} dir={dir}>{children}</main>;
export const Header = ({ title, fact, intro }: any) => <header><h1>{title}</h1><p className="fact">{fact}</p><p>{intro}</p></header>;
export const Group = ({ label, children }: any) => <section><h2>{label}</h2>{children}</section>;
export const Closing = ({ children }: any) => <footer>{children}</footer>;
export function useLocalState(key: string, init: string) {
  const [v, setV] = useState<string>(() => { try { const r = localStorage.getItem('iq.' + key); return r === null ? init : (JSON.parse(r) as string); } catch { return init; } });
  const [msg, setMsg] = useState('');
  const set = useCallback((n: string) => { setV(n); try { localStorage.setItem('iq.' + key, JSON.stringify(n)); } catch { setMsg('تعذر حفظ التقدم على هذا المتصفح'); } }, [key]);
  return [v, set, { ready: true, message: msg }] as const;
}
export function CopyButton({ text, label }: any) {
  const [s, setS] = useState('');
  const go = () => {
    const fb = () => { try { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); document.body.removeChild(t); setS(ok ? 'تم النسخ' : 'تعذر النسخ، حدد الكود وانسخه يدويًا'); } catch { setS('تعذر النسخ، حدد الكود وانسخه يدويًا'); } };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => setS('تم النسخ'), fb); else fb(); } catch { fb(); }
  };
  return <button type="button" className="qz-btn" onClick={go}>{s || label || 'نسخ'}</button>;
}
