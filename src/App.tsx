import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Bus, CalendarDays, Car, Check, CheckCircle2, MapPin, Minus, Mountain, Plus, Users } from 'lucide-react'
import { retreat } from './data/retreat'
import { hasSupabase, loadRegistration, submitRegistration, type TransportMode } from './lib/supabase'

export function App() {
  const [name, setName] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [transport, setTransport] = useState<TransportMode | ''>('')
  const [existing, setExisting] = useState(false)
  const [loading, setLoading] = useState(hasSupabase)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)

  useEffect(() => {
    let active = true
    if (!hasSupabase) return
    async function restoreRegistration() {
      try {
        const result = await loadRegistration()
        if (!active) return
        if (result.ok && result.registration) {
          const registration = result.registration
          setName(registration.name)
          setAdults(registration.adults)
          setChildren(registration.children)
          setTransport(registration.transport || '')
          setExisting(true)
        } else if (!result.ok) {
          setError('暂时无法读取原报名。请稍后刷新重试，或重新填写并保存；同一浏览器会更新原记录。')
        }
      } catch {
        if (active) setError('读取报名时网络异常，请检查网络后刷新页面。')
      } finally {
        if (active) setLoading(false)
      }
    }
    void restoreRegistration()
    return () => { active = false }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || !name.trim() || !transport || submitted || loading) return
    inFlight.current = true
    setSubmitting(true)
    setError('')
    try {
      const result = await submitRegistration({ name: name.trim(), adults, children, transport })
      if (result.ok) {
        setSubmitted(true)
        setExisting(true)
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
          <span className="panel-eyebrow">报名信息已保存</span>
          <h2 id="registration-title">出行已确认，期待同行</h2>
          <p>{retreat.destination} · 2026 年 10 月 17–18 日</p>
          <div className="success-counts"><span>大人（含本人）<strong>{adults} 人</strong></span><span>小孩<strong>{children} 人</strong></span></div>
          <p className="success-transport">{transport === 'bus' ? <Bus size={18} /> : <Car size={18} />}{transport === 'bus' ? '乘坐大巴' : '自行开车'}</p>
          <p className="success-note">再次保存会更新这份报名，人数只统计一次。</p>
          <button type="button" className="registration-edit" onClick={() => { setSubmitted(false); setError('') }}>修改 / 补充报名信息<ArrowRight size={16} /></button>
        </div> : <>
          <div className="registration-heading"><span className="panel-eyebrow">{existing ? '补充出行安排' : '确认出行人数'}</span><h2 id="registration-title">{existing ? '确认你们的出行方式' : '你们一共几位？'}</h2><p>{existing ? '已带入原报名信息，保存后会更新这份记录。' : '同行家人一起登记，之后可用同一浏览器补充或修改。'}</p></div>
          {loading && <p className="registration-loading" role="status">正在检查本浏览器的报名信息…</p>}
          <form className="registration-form" onSubmit={handleSubmit}>
            <label className="registration-name" htmlFor="participant-name"><span>姓名 <small>必填</small></span><input id="participant-name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="填写你的姓名" required maxLength={30} autoComplete="off" disabled={submitting || loading} /></label>
            <fieldset className="registration-people"><legend>出行人数</legend><div className="registration-count-grid">
              <NumberStepper label="大人（含本人）" note="本人和同行成人一起计入" value={adults} minimum={1} disabled={submitting || loading} onChange={setAdults} />
              <NumberStepper label="小孩" note="没有同行小孩填写 0" value={children} minimum={0} disabled={submitting || loading} onChange={setChildren} />
            </div></fieldset>
            <fieldset className="registration-transport" disabled={submitting || loading}>
              <legend>出行方式 <small>必填</small></legend>
              <p>适用于本人及本次登记的所有同行家人。</p>
              <div className="transport-options">
                <label className={`transport-option ${transport === 'bus' ? 'selected' : ''}`}><input type="radio" name="transport" value="bus" checked={transport === 'bus'} onChange={() => setTransport('bus')} required /><Bus size={21} /><span><strong>乘坐大巴</strong><small>跟随团队统一出发</small></span></label>
                <label className={`transport-option ${transport === 'self_drive' ? 'selected' : ''}`}><input type="radio" name="transport" value="self_drive" checked={transport === 'self_drive'} onChange={() => setTransport('self_drive')} required /><Car size={21} /><span><strong>自行开车</strong><small>自行前往，不占大巴座位</small></span></label>
              </div>
            </fieldset>
            <div className="registration-total" aria-live="polite"><span><Users size={17} /> 本次登记</span><strong>{adults + children} <small>人</small></strong></div>
            {error && <p className="registration-error" role="alert">{error}</p>}
            <button className="registration-submit" type="submit" disabled={submitting || loading || !transport || !name.trim() || !hasSupabase}>{submitting ? '正在保存…' : existing ? '保存补充信息' : '提交报名'}<ArrowRight size={18} /></button>
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
