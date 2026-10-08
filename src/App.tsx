import { useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CalendarDays, Check, CheckCircle2, MapPin, Minus, Mountain, Plus, Users } from 'lucide-react'
import { retreat } from './data/retreat'
import { hasSupabase, submitRegistration } from './lib/supabase'

export function App() {
  const [name, setName] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || !name.trim() || submitted) return
    inFlight.current = true
    setSubmitting(true)
    setError('')
    try {
      const result = await submitRegistration({ name: name.trim(), adults, children })
      if (result.ok) {
        setSubmitted(true)
        setName('')
      } else if (result.reason === 'already-registered') {
        setError('当前设备已提交本次报名，如需修改人数，请联系组织者。')
      } else if (result.reason === 'not-configured') {
        setError('报名暂未开放，请联系组织者。')
      } else {
        setError('提交未成功，请稍后重试；如果持续失败，请联系组织者。')
      }
    } catch {
      setError('网络连接异常，请检查网络后重新提交。')
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return <div className="registration-shell">
    <header className="registration-header">
      <a href="#registration" className="registration-brand"><Mountain size={22} /><span>团建报名</span></a>
      <span className="registration-status"><span /> 人数登记中</span>
    </header>
    <main id="registration" className="registration-layout">
      <section className="retreat-brief" aria-labelledby="retreat-title">
        <div className="retreat-eyebrow"><Check size={15} /> 目的地与时间已确定</div>
        <h1 id="retreat-title">{retreat.destination}</h1>
        <p className="retreat-intro">这次，一起出发。<br />登记你和家人的出行人数。</p>
        <div className="retreat-date-card">
          <div className="retreat-date-top"><CalendarDays size={18} /><span>2026 年 10 月</span></div>
          <div className="retreat-date-range"><strong>17</strong><span>—</span><strong>18</strong><small>日</small></div>
          <div className="retreat-date-bottom"><span>周六出发 · 周日返程</span><b>2 天 1 夜</b></div>
        </div>
        <div className="retreat-location"><MapPin size={17} /><span>目的地：{retreat.destination}</span></div>
        <p className="retreat-note">请按实际出行人数填写，方便安排交通和住宿。具体集合与行程安排由组织者另行通知。</p>
      </section>

      <section className="registration-panel" aria-labelledby="registration-title">
        {submitted ? <div className="registration-success" role="status">
          <div className="success-mark"><CheckCircle2 size={34} /></div>
          <span className="panel-eyebrow">报名已提交</span>
          <h2 id="registration-title">人数已登记，期待同行</h2>
          <p>{retreat.destination} · 2026 年 10 月 17–18 日</p>
          <div className="success-counts"><span>大人（含本人）<strong>{adults} 人</strong></span><span>小孩<strong>{children} 人</strong></span></div>
          <p className="success-note">如需调整人数，请联系组织者。</p>
        </div> : <>
          <div className="registration-heading"><span className="panel-eyebrow">确认出行人数</span><h2 id="registration-title">你们一共几位？</h2><p>每位同事填写一次，同行家人一起登记。</p></div>
          <form className="registration-form" onSubmit={handleSubmit}>
            <label className="registration-name" htmlFor="participant-name"><span>姓名 <small>必填</small></span><input id="participant-name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="填写你的姓名" required maxLength={30} autoComplete="off" disabled={submitting} /></label>
            <fieldset className="registration-people"><legend>出行人数</legend><div className="registration-count-grid">
              <NumberStepper label="大人（含本人）" note="本人和同行成人一起计入" value={adults} minimum={1} disabled={submitting} onChange={setAdults} />
              <NumberStepper label="小孩" note="没有同行小孩填写 0" value={children} minimum={0} disabled={submitting} onChange={setChildren} />
            </div></fieldset>
            <div className="registration-total" aria-live="polite"><span><Users size={17} /> 本次登记</span><strong>{adults + children} <small>人</small></strong></div>
            {error && <p className="registration-error" role="alert">{error}</p>}
            <button className="registration-submit" type="submit" disabled={submitting || !name.trim() || !hasSupabase}>{submitting ? '正在提交…' : '提交报名'}<ArrowRight size={18} /></button>
            {!hasSupabase && <p className="registration-error">报名暂未开放，请联系组织者。</p>}
            <p className="registration-footnote">姓名与人数仅用于本次团建安排，页面不展示报名名单和总人数。</p>
          </form>
        </>}
      </section>
    </main>
    <footer className="registration-footer">西岭雪山 · 10 月 17–18 日 · 两天一夜</footer>
  </div>
}

function NumberStepper({ label, note, value, minimum, disabled, onChange }: { label: string; note: string; value: number; minimum: number; disabled: boolean; onChange: (value: number) => void }) {
  return <div className="registration-counter"><span className="counter-label">{label}</span><p>{note}</p><div className="counter-controls">
    <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= minimum} aria-label={`减少${label}`}><Minus size={18} /></button>
    <output aria-label={`${label}人数`} aria-live="polite">{value}</output>
    <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= 20} aria-label={`增加${label}`}><Plus size={18} /></button>
  </div></div>
}
