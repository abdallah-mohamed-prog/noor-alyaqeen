import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Closing, FileCard, Group, Header, useLocalState, CopyButton } from './shim';
import { Backup } from './backup';
import { DOORS } from './doors';

type Item = { q: string; a: string; w: string[]; note: string; src: string };
const LISTS: Record<string, Item[]> = {};
const pending: Record<string, Promise<void>> = {};
const loadDoor = (id: string): Promise<void> => {
    if (LISTS[id]) return Promise.resolve();
    if (!pending[id]) pending[id] = fetch('data/' + id + '.json').then((r) => { if (!r.ok) throw new Error('x'); return r.json(); })
        .then((rows: any[]) => { LISTS[id] = rows.map((r) => ({ q: r[0], a: r[1], w: r[2], note: r[3], src: r[4] })); })
        .catch((e) => { delete pending[id]; throw e; });
    return pending[id];
};

const shuffle = <T,>(a: T[]): T[] => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const stat = (p: string, i: number) => p.charAt(i) || '0';
const counts = (p: string, n: number) => { let c = 0, w = 0; for (let i = 0; i < n; i++) { const s = stat(p, i); if (s === '1') c++; else if (s === '2') w++; } return { c, w, left: n - c - w }; };
const withStat = (p: string, i: number, v: string, n: number) => { const a = p.padEnd(n, '0').split(''); a[i] = v; return a.join(''); };

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const TIER = (m: number) => m >= 1000 ? { n: 'زمرد', c: '#2e9e5b' } : m >= 250 ? { n: 'ذهبي', c: '#d4a017' } : m >= 50 ? { n: 'فضي', c: '#8d99a6' } : { n: 'برونزي', c: '#b0713a' };
type Shield = { key: string; label: string; sub: string; color: string; num: string };
function shieldsFor(id: string, name: string, p: string, n: number): { all: Shield[]; earned: Set<string> } {
    const { c, left } = counts(p, n), all: Shield[] = [], earned = new Set<string>();
    MILESTONES.filter((m) => m <= n).forEach((m) => { const t = TIER(m); const s = { key: `${id}-${m}`, label: `${m} إجابة صحيحة`, sub: `${name} - ${t.n}`, color: t.c, num: String(m) }; all.push(s); if (c >= m) earned.add(s.key); });
    const done = { key: `${id}-done`, label: 'إتمام الباب', sub: name, color: '#73a89a', num: '★' }; all.push(done); if (left === 0) earned.add(done.key);
    return { all, earned };
}
function ShieldIcon({ s, on }: { s: Shield; on: boolean }) {
    return <div className={'qz-shield' + (on ? '' : ' qz-off')}>
        <svg viewBox="0 0 64 76" width="52" height="62" aria-hidden="true"><path d="M32 3 L59 13 V37 C59 54 47 66 32 73 C17 66 5 54 5 37 V13 Z" fill={on ? s.color : '#e5e3e4'} stroke={on ? '#251f21' : '#c0bebf'} strokeWidth="2" /><text x="32" y="46" textAnchor="middle" fontSize={s.num.length > 3 ? 17 : 22} fontWeight="700" fill={on ? '#fff' : '#a8a5a6'}>{s.num}</text></svg>
        <b>{s.label}</b><small>{s.sub}</small>
    </div>;
}

type Mode = 'next' | 'rand' | 'exam' | 'wrong';
const ICON: Record<string, string> = { quran: '📖', seerah: '🕌', prophets: '🌙', worship: '🧎', caliphs: '👑', hadith: '📜', mustknow: '📚' };
const PRAISE = (s: number, n: number) => n === 0 ? '' : s / n >= 0.9 ? 'ما شاء الله، ممتاز!' : s / n >= 0.7 ? 'جيد جدًا، استمر.' : s / n >= 0.5 ? 'جيد، وراجع أخطاءك بالأسفل.' : 'لا بأس، المراجعة تثبّت المعلومة.';
const MODE_LABEL: Record<Mode, string> = { next: 'متابعة', rand: 'تدريب عشوائي', exam: 'اختبار', wrong: 'مراجعة أخطائي' };

function Play({ id, name, mode, prog, setProg, onExit, onAgain }: { id: string; name: string; mode: Mode; prog: string; setProg: (v: string) => void; onExit: () => void; onAgain: () => void }) {
    const list = LISTS[id], n = list.length;
    const [startP] = useState(prog);
    const [ids] = useState<number[]>(() => {
        const all = list.map((_, i) => i);
        if (mode === 'next') return shuffle(all.filter((i) => stat(prog, i) === '0')).slice(0, 10);
        if (mode === 'wrong') return shuffle(all.filter((i) => stat(prog, i) === '2')).slice(0, 10);
        return shuffle(all).slice(0, mode === 'exam' ? 30 : 10);
    });
    const [k, setK] = useState(0);
    const [score, setScore] = useState(0);
    const [pick, setPick] = useState<string | null>(null);
    const [wrongIds, setWrongIds] = useState<number[]>([]);
    const cur = ids[k] !== undefined ? list[ids[k]] : undefined;
    const opts = useMemo(() => (cur ? shuffle([cur.a, ...cur.w]) : []), [cur]);
    const answer = (o: string) => { if (!cur || pick !== null) return; const ok = o === cur.a; setPick(o); if (ok) setScore(score + 1); else setWrongIds([...wrongIds, ids[k]]); setProg(withStat(prog, ids[k], ok ? '1' : '2', n)); };
    const answered = pick !== null;
    const expRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (answered && expRef.current) expRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [answered]);
    if (k >= ids.length) {
        const c = counts(prog, n), d = shieldsFor(id, name, prog, n), before = shieldsFor(id, name, startP, n).earned;
        const fresh = d.all.filter((s) => d.earned.has(s.key) && !before.has(s.key));
        return <Group label={name} heading>
            <div className="qz-score">{score} من {ids.length}</div>
            <p className="qz-msg"><strong>{PRAISE(score, ids.length)}</strong></p>
            <p className="qz-msg">تقدمك في الباب: {c.c + c.w} من {n} سؤال، الصحيح {c.c}</p>
            {fresh.length > 0 && <div className="qz-new"><strong>🏅 حصلت على {fresh.length > 1 ? 'دروع جديدة' : 'درع جديد'}</strong><div className="qz-shields">{fresh.map((s) => <ShieldIcon key={s.key} s={s} on />)}</div><p className="qz-msg">أضيفت إلى ملفك الشخصي.</p></div>}
            {wrongIds.length > 0 && <><h3 className="qz-h">راجع أخطاءك</h3>{wrongIds.map((i) => <div className="qz-rev" key={i}><p className="qz-q2">{list[i].q}</p><strong>الصواب: {list[i].a}</strong><div>{list[i].note}</div><div className="qz-src">المصدر: {list[i].src}</div></div>)}</>}
            <button type="button" className="qz-btn qz-primary" onClick={onAgain}>{mode === 'next' && c.left > 0 ? 'تابع 10 أسئلة أخرى' : 'جولة جديدة'}</button>
            <button type="button" className="qz-btn" onClick={onExit}>قائمة الباب</button>
        </Group>;
    }
    return <Group label={`${MODE_LABEL[mode]} - ${name}`} heading>
        <button type="button" className="qz-btn qz-exit" onClick={onExit}>✕ خروج (تقدمك محفوظ)</button>
        <div className="qz-top"><span>السؤال {k + 1} من {ids.length}</span><span>الصحيح: {score}</span></div>
        <div className="qz-bar"><i style={{ width: `${(k / ids.length) * 100}%` }} /></div>
        <p className="qz-q">{cur!.q}</p>
        <div className="qz-opts">
            {opts.map((o) => { const cls = !answered ? '' : o === cur!.a ? ' qz-ok' : o === pick ? ' qz-bad' : ''; return <button key={o} type="button" disabled={answered} className={'qz-btn qz-opt' + cls} onClick={() => answer(o)}>{o}</button>; })}
        </div>
        {answered && <div className={'qz-exp ' + (pick === cur!.a ? 'qz-exp-ok' : 'qz-exp-bad')} ref={expRef}><strong>{pick === cur!.a ? 'إجابة صحيحة. ' : `إجابة خاطئة. الصواب: ${cur!.a}. `}</strong>{cur!.note}<div className="qz-src">المصدر: {cur!.src}</div></div>}
        {answered && <button type="button" className="qz-btn qz-primary qz-next" onClick={() => { setK(k + 1); setPick(null); window.scrollTo({ top: 0 }); }}>{k + 1 === ids.length ? 'عرض النتيجة' : 'السؤال التالي'}</button>}
        <button type="button" className="qz-btn qz-out" onClick={onExit}>✕ خروج إلى قائمة الباب</button>
    </Group>;
}

export function App() {
    const [p0, s0, v0] = useLocalState('p-quran.v1', '');
    const [p1, s1, v1] = useLocalState('p-seerah.v1', '');
    const [p2, s2, v2] = useLocalState('p-prophets.v1', '');
    const [p3, s3, v3] = useLocalState('p-worship.v1', '');
    const [p4, s4, v4] = useLocalState('p-caliphs.v1', '');
    const [p5, s5, v5] = useLocalState('p-hadith.v1', '');
    const [p6, s6, v6] = useLocalState('p-mustknow.v1', '');
    const P: Record<string, string> = { quran: p0, seerah: p1, prophets: p2, worship: p3, caliphs: p4, hadith: p5, mustknow: p6 };
    const S: Record<string, (v: string) => void> = { quran: s0, seerah: s1, prophets: s2, worship: s3, caliphs: s4, hadith: s5, mustknow: s6 };
    const ready = v0.ready && v1.ready && v2.ready && v3.ready && v4.ready && v5.ready && v6.ready;
    const msg = [v0, v1, v2, v3, v4, v5, v6].map((v) => v.message).find((m) => m);
    const [door, setDoor] = useState<string | null>(null);
    const [play, setPlay] = useState<{ mode: Mode; round: number } | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [bye, setBye] = useState(false);
    const quit = () => { const w: any = window; try { if (w.Android && w.Android.exitApp) { w.Android.exitApp(); return; } } catch (e) { /* ignore */ } try { w.close(); } catch (e) { /* ignore */ } setBye(true); };
    const [NC, setNC] = useState<Record<string, number> | null>(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    useEffect(() => { fetch('data/index.json').then((r) => r.json()).then(setNC).catch(() => setErr('تعذر تحميل الأسئلة، تأكد من الاتصال ثم أعد فتح التطبيق.')); }, []);
    if (!NC) return <FileCard lang="ar" dir="rtl"><Header title="نور اليقين" fact={err || 'جارٍ التحميل...'} intro="" /></FileCard>;
    const total = DOORS.reduce((a, d) => a + (NC[d.id] || 0), 0);
    const allShields = DOORS.map((d) => shieldsFor(d.id, d.name.replace('باب ', ''), P[d.id], NC[d.id] || 0));
    const earnedCount = allShields.reduce((a, s) => a + s.earned.size, 0), shieldTotal = allShields.reduce((a, s) => a + s.all.length, 0);
    const d = door ? DOORS.find((x) => x.id === door)! : null;

    let body: React.ReactNode;
    if (d && play) {
        body = <Play key={play.round} id={d.id} name={d.name.replace('باب ', '')} mode={play.mode} prog={P[d.id]} setProg={S[d.id]} onExit={() => setPlay(null)} onAgain={() => setPlay({ mode: play.mode, round: play.round + 1 })} />;
    } else if (d) {
        const n = NC[d.id] || 0, c = counts(P[d.id], n), sh = shieldsFor(d.id, d.name.replace('باب ', ''), P[d.id], n);
        const go = (mode: Mode) => { setBusy(true); setErr(''); loadDoor(d.id).then(() => { setBusy(false); setPlay({ mode, round: Date.now() }); }).catch(() => { setBusy(false); setErr('تعذر تحميل أسئلة هذا الباب، تأكد من الاتصال وحاول مرة أخرى.'); }); };
        body = <Group label={d.name} heading>
            <button type="button" className="qz-btn qz-back" onClick={() => { setDoor(null); setConfirmReset(false); }}>← رجوع إلى كل الأبواب</button>
            <div className="qz-stats"><div><b>{c.c}</b>صحيح</div><div><b>{c.w}</b>خطأ</div><div><b>{c.left}</b>متبقي</div></div>
            <div className="qz-bar"><i style={{ width: `${((c.c + c.w) / n) * 100}%` }} /></div>
            <button type="button" className="qz-btn qz-primary" disabled={!ready || c.left === 0} onClick={() => go('next')}>▶ تابع من حيث وقفت (10 أسئلة)</button>
            <button type="button" className="qz-btn qz-primary" disabled={!ready} onClick={() => go('rand')}>🎲 تدريب عشوائي (10)</button>
            <button type="button" className="qz-btn qz-primary" disabled={!ready} onClick={() => go('exam')}>📝 اختبار ({Math.min(30, n)} سؤال)</button>
            <button type="button" className="qz-btn qz-primary" disabled={!ready || c.w === 0} onClick={() => go('wrong')}>🔁 أعد أسئلتي الخاطئة ({c.w})</button>
            <h3 className="qz-h">دروع هذا الباب ({sh.earned.size} من {sh.all.length})</h3>
            <div className="qz-shields">{sh.all.map((s) => <ShieldIcon key={s.key} s={s} on={sh.earned.has(s.key)} />)}</div>
            {!confirmReset ? <button type="button" className="qz-btn qz-danger" onClick={() => setConfirmReset(true)}>↺ إعادة الباب من الأول</button>
                : <><p className="qz-msg">سيُمسح تقدمك في هذا الباب (الدروع التي حصلت عليها ستُقفل حتى تعيد الإنجاز). متأكد؟</p>
                    <button type="button" className="qz-btn qz-primary" onClick={() => { S[d.id](''); setConfirmReset(false); }}>نعم، امسح وابدأ من جديد</button>
                    <button type="button" className="qz-btn" onClick={() => setConfirmReset(false)}>إلغاء</button></>}
            <button type="button" className="qz-btn qz-out" onClick={() => { setDoor(null); setConfirmReset(false); }}>← رجوع للأبواب</button>
        </Group>;
    } else {
        body = <>
            <Group label="اختر الباب" heading>
                <div className="qz-doors">
                    {DOORS.map((x) => { const n = NC[x.id] || 0, c = counts(P[x.id], n); return <button key={x.id} type="button" className="qz-btn qz-door" onClick={() => setDoor(x.id)}><span className="qz-dn"><em>{ICON[x.id]}</em>{x.name}</span><small>{n} سؤال · أنجزت {c.c + c.w} · صحيح {c.c} · {n ? Math.round(((c.c + c.w) / n) * 100) : 0}%</small><div className="qz-bar"><i style={{ width: `${((c.c + c.w) / n) * 100}%` }} /></div></button>; })}
                </div>
            </Group>
            <Group label={`ملفي الشخصي: ${earnedCount} من ${shieldTotal} درعًا`} heading>
                {earnedCount === 0 ? <p className="qz-msg">أجب على أسئلة لتحصل على أول درع.</p> : <div className="qz-shields">{DOORS.flatMap((x, i) => allShields[i].all.filter((s) => allShields[i].earned.has(s.key)).map((s) => <ShieldIcon key={s.key} s={s} on />))}</div>}
                <button type="button" className="qz-btn qz-link" onClick={() => setShowAll(!showAll)}>{showAll ? 'إخفاء كل الدروع' : 'عرض كل الدروع (المقفلة أيضًا)'}</button>
                {showAll && DOORS.map((x, i) => <div key={x.id}><h3 className="qz-h">{x.name}</h3><div className="qz-shields">{allShields[i].all.map((s) => <ShieldIcon key={s.key} s={s} on={allShields[i].earned.has(s.key)} />)}</div></div>)}
            </Group>
            <Group label="نسخة احتياطية لتقدمك" heading>
                <Backup ids={DOORS.map((x) => x.id)} names={Object.fromEntries(DOORS.map((x) => [x.id, x.name]))} P={P} S={S} Copy={CopyButton} />
            </Group>
            <button type="button" className="qz-btn qz-out" onClick={quit}>⏻ خروج من اللعبة</button>
            {bye && <p className="qz-msg">تقدمك محفوظ. يمكنك إغلاق التطبيق الآن من زر الرجوع أو الصفحة الرئيسية في هاتفك.</p>}
        </>;
    }
    return <FileCard lang="ar" dir="rtl">
        <div className="qz-logo"><img alt="" width="84" height="84" src="logo.svg" /></div>
        <Header title="نور اليقين" fact={`${total} سؤالًا في ${DOORS.length} أبواب`} intro="اختر بابًا وابدأ. بعد كل إجابة يظهر الصواب مع مصدره، ويحفظ تقدمك ودروعك تلقائيًا على هذا الجهاز." />
        {msg && <p className="qz-src">{msg}</p>}
        {err && <p className="qz-src">{err}</p>}
        {busy && <p className="qz-msg">جارٍ تحميل الأسئلة...</p>}
        {body}
        <Closing>الأسئلة مبنية على نص المصحف (رواية حفص) وصحيح البخاري على sunnah.com وفتاوى ابن باز على binbaz.org.sa وفتاوى ابن عثيمين على old.binothaimeen.net وتصنيف السور على alquran.cloud وعلى مصادر مذكورة تحت كل سؤال، ولم تُراجع من عالم متخصص. ارجع لأهل العلم في أي مسألة شرعية.<br />إعداد: Abdallah Ghareeb</Closing>
    </FileCard>;
}
