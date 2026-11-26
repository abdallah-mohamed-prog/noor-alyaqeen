import React, { useState } from 'react';

const A = 'abc';
const rle = (s: string) => { s = s.replace(/0+$/, ''); let o = ''; for (let i = 0; i < s.length;) { let j = i; while (j < s.length && s[j] === s[i]) j++; o += A[+s[i]] + (j - i); i = j; } return o; };
const unrle = (s: string) => { let o = ''; const re = /([abc])(\d+)/g; let m: RegExpExecArray | null; while ((m = re.exec(s))) o += String(A.indexOf(m[1])).repeat(+m[2]); return o; };
const chk = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 65521; return h.toString(16).padStart(4, '0'); };

export function makeCode(ids: string[], P: Record<string, string>): string {
    const body = ids.map((id) => id + ':' + rle(P[id] || '')).join(';');
    return 'NQ1.' + body + '.' + chk(body);
}
export function parseCode(raw: string, ids: string[]): Record<string, string> | string {
    const t = raw.replace(/\s+/g, '');
    const m = /^NQ1\.([a-z]+:[abc0-9]*(?:;[a-z]+:[abc0-9]*)*)\.([0-9a-f]{4})$/.exec(t);
    if (!m) return 'الكود غير صحيح. انسخه كاملًا من أوله (يبدأ بـ NQ1) إلى آخره.';
    if (chk(m[1]) !== m[2]) return 'الكود ناقص أو متغير. انسخه مرة أخرى كاملًا.';
    const out: Record<string, string> = {};
    m[1].split(';').forEach((part) => { const k = part.indexOf(':'); const id = part.slice(0, k); if (ids.includes(id)) out[id] = unrle(part.slice(k + 1)); });
    return out;
}

export function Backup({ ids, names, P, S, Copy }: { ids: string[]; names: Record<string, string>; P: Record<string, string>; S: Record<string, (v: string) => void>; Copy: React.ComponentType<any> }) {
    const [code, setCode] = useState('');
    const [paste, setPaste] = useState('');
    const [msg, setMsg] = useState('');
    const [ask, setAsk] = useState<Record<string, string> | null>(null);
    const done = (p: string) => { let n = 0; for (const ch of p) if (ch !== '0') n++; return n; };
    const apply = () => { if (!ask) return; ids.forEach((id) => { if (id in ask) S[id](ask[id]); }); const total = Object.values(ask).reduce((a, p) => a + done(p), 0); setMsg(`تمت الاستعادة: ${total} سؤالًا مُجابًا في ${Object.keys(ask).length} أبواب.`); setAsk(null); setPaste(''); };
    const check = () => { const r = parseCode(paste, ids); if (typeof r === 'string') { setMsg(r); setAsk(null); } else { setMsg(''); setAsk(r); } };
    return <>
        <button type="button" className="qz-btn qz-primary" onClick={() => setCode(makeCode(ids, P))}>إنشاء كود النسخة الاحتياطية</button>
        {code && <div className="qz-bk">
            <p className="qz-msg">انسخ هذا الكود واحفظه (في ملاحظات أو رسالة لنفسك). بعد إعادة تثبيت التطبيق الصقه هنا في خانة الاستعادة.</p>
            <textarea className="qz-ta" readOnly value={code} rows={4} dir="ltr" onFocus={(e) => e.currentTarget.select()} />
            <Copy text={code} label="نسخ الكود" />
        </div>}
        <p className="qz-msg">لاستعادة تقدمك: الصق الكود هنا.</p>
        <textarea className="qz-ta" value={paste} rows={4} dir="ltr" placeholder="NQ1...." onChange={(e) => { setPaste(e.target.value); setAsk(null); setMsg(''); }} />
        {!ask ? <button type="button" className="qz-btn" disabled={!paste.trim()} onClick={check}>استعادة التقدم من الكود</button>
            : <div className="qz-bk"><p className="qz-msg">الكود سليم ويحتوي على: {ids.filter((id) => id in ask).map((id) => `${names[id]} (${done(ask[id])})`).join('، ')}. سيحل محل تقدمك الحالي في هذه الأبواب. متأكد؟</p>
                <button type="button" className="qz-btn qz-primary" onClick={apply}>نعم، استعد التقدم</button>
                <button type="button" className="qz-btn" onClick={() => setAsk(null)}>إلغاء</button></div>}
        {msg && <p className="qz-msg"><strong>{msg}</strong></p>}
    </>;
}
