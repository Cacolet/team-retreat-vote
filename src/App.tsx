import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CalendarCheck, Check, ChevronRight, CircleHelp, Compass, ExternalLink, Heart, Lightbulb, MapPin, Minus, Plus, Search, Star, Ticket, Users, X } from 'lucide-react'
import { trips, type TripPlan } from './data/trips'
import { officialCalendar } from './data/holidayCalendar'
import { hasSupabase, submitVote } from './lib/supabase'

type Weekend = { start: string; end: string; label: string }

const votingMonths = [9, 10]
const excludedWeekendStarts = new Set(['2026-09-05'])

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function isSelectableRestDay(date: Date, today: Date) {
  const calendar = officialCalendar[date.getFullYear()]
  const key = dateKey(date)
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  return isWeekend && date >= today && !calendar?.holidays.includes(key) && !calendar?.makeupWorkdays.includes(key)
}

function availableWeekends(): Weekend[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const year = today.getFullYear()
  const weekends: Weekend[] = []

  for (const month of votingMonths) {
    for (let day = 1; day <= new Date(year, month, 0).getDate(); day += 1) {
      const saturday = new Date(year, month - 1, day)
      if (saturday.getDay() !== 6) continue
      const sunday = new Date(year, month - 1, day + 1)
      const start = dateKey(saturday)
      if (sunday.getMonth() !== month - 1 || excludedWeekendStarts.has(start) || !isSelectableRestDay(saturday, today) || !isSelectableRestDay(sunday, today)) continue
      weekends.push({ start, end: dateKey(sunday), label: `${month} 月 ${day} 日 — ${day + 1} 日` })
    }
  }
  return weekends
}

export function App() {
  const [selectedId, setSelectedId] = useState(trips[0].id)
  const [isVoteOpen, setVoteOpen] = useState(false)
  const [toast, setToast] = useState('')
  const selectedTrip = trips.find((trip) => trip.id === selectedId) || trips[0]

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  return <div className="app-shell">
    <header className="topbar final-topbar">
      <a className="brand-lockup" href="#final" aria-label="团建最终敲定">
        <div className="brand-mark"><Compass size={19} /></div>
        <div><strong>团建最终敲定</strong><span>3 个两天一夜候选方案</span></div>
      </a>
      <div className="final-status"><CalendarCheck size={16} /><span>最终投票进行中</span></div>
      <span className="db-status"><span className={hasSupabase ? 'status-dot connected' : 'status-dot'} /> {hasSupabase ? '实时数据已连接' : '演示数据模式'}</span>
    </header>

    <main id="final">
      <section className="final-workspace" aria-label="最终敲定">
        <div className="final-phase-banner">
          <div><span><Lightbulb size={14} /> 最终候选</span><strong>只保留蒲江、西岭雪山、乐山 3 个两天一夜方案</strong><p>请选择完整可休周末，并填写同行的成人与儿童人数。行程资料由 AI 提供，仅供参考。</p></div>
          <div className="shortlist-count"><strong>3</strong><span>个候选方案</span></div>
        </div>
        <section className="planner-board final-board" aria-label="最终团建方案投票">
          <div className="results-area">
            <div className="planner-heading"><div><p>FINAL DECISION</p><h1>选择最想去的团建方案</h1></div><span>日期可多选 · 全部为 2 天 1 夜</span></div>
            <div className="bottom-grid">
              <section className="trip-list-panel">
                <div className="list-heading"><div><h2>最终候选</h2><p>点击方案查看详情并选择所有可参加日期</p></div></div>
                <TripGroup trips={trips} activeId={selectedTrip.id} onSelect={setSelectedId} />
              </section>
              <section className="detail-panel"><TripDetail trip={selectedTrip} onVote={() => setVoteOpen(true)} /></section>
            </div>
          </div>
        </section>
      </section>
    </main>

    {isVoteOpen && <VoteModal trip={selectedTrip} onClose={() => setVoteOpen(false)} onSuccess={() => { setVoteOpen(false); setToast('投票已提交，已记录你的日期与人数。') }} onFailure={setToast} />}
    {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    <footer>团建最终敲定 · 请以场地实时信息与最终团队报价为准</footer>
  </div>
}

function TripGroup({ trips: groupTrips, activeId, onSelect }: { trips: TripPlan[]; activeId: string; onSelect: (id: string) => void }) {
  return <section className="trip-group"><div className="trip-group-heading"><div><strong>2 天 1 夜 · 最终候选</strong><small>轻松自由、吃喝体验与家庭参与优先</small></div><span>{groupTrips.length}</span></div><div className="trip-list">{groupTrips.map((trip, index) => <TripListItem key={trip.id} trip={trip} index={index} active={activeId === trip.id} onClick={() => onSelect(trip.id)} />)}</div></section>
}

function TripListItem({ trip, index, active, onClick }: { trip: TripPlan; index: number; active: boolean; onClick: () => void }) {
  return <button className={`trip-item duration-2day ${active ? 'active' : ''}`} onClick={onClick}><span className="trip-index">{String(index + 1).padStart(2, '0')}</span><span className="trip-item-main"><strong>{trip.destination}</strong><span>{trip.title}</span><small>{trip.tags.slice(0, 2).join(' · ')}</small></span><ChevronRight size={16} aria-hidden="true" /></button>
}

function TripDetail({ trip, onVote }: { trip: TripPlan; onVote: () => void }) {
  return <div className="detail-enter" key={trip.id}>
    <div className="detail-hero duration-2day"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="detail-hero-copy"><span className="detail-overline">2 天 1 夜 · 最终候选</span><h3>{trip.destination}</h3><p>{trip.title}</p></div><div className="hero-ticket"><Ticket size={15} /> {trip.budget}</div></div>
    <div className="detail-content"><div className="detail-title-row"><div><div className="detail-meta"><MapPin size={15} /> {trip.travelTime}</div><h2>{trip.title}</h2></div></div><p className="detail-summary">{trip.summary}</p><div className="tag-row">{trip.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><CommunitySources trip={trip} /><div className="schedule-heading"><span>行程预览</span><small>组织前请以场地实时信息为准</small></div><div className="schedule-list">{trip.schedule.map((item) => <div className="schedule-item" key={item.time}><time>{item.time}</time><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div><div className="reminder-box"><div><CircleHelp size={17} /><strong>执行提醒</strong></div><ul>{trip.reminders.map((item) => <li key={item}>{item}</li>)}</ul></div><button className="vote-button" onClick={onVote}><Heart size={17} fill="currentColor" /> 选择可参加日期与人数 <span><ArrowRight size={15} /></span></button></div>
  </div>
}

function CommunitySources({ trip }: { trip: TripPlan }) {
  const keyword = `${trip.destination.replace(' · ', ' ')} ${trip.tags[0]} 攻略`
  const xhsUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`
  const douyinUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}`
  return <section className="community-sources" aria-label="社区内容参考"><div><Search size={15} /><strong>查看近期社区内容</strong><small>不展示虚构热度；打开平台查看最新笔记、视频与评论。</small></div><div className="source-actions"><a href={xhsUrl} target="_blank" rel="noreferrer">小红书搜索 <ExternalLink size={12} /></a><a href={douyinUrl} target="_blank" rel="noreferrer">抖音搜索 <ExternalLink size={12} /></a></div></section>
}

function VoteModal({ trip, onClose, onSuccess, onFailure }: { trip: TripPlan; onClose: () => void; onSuccess: () => void; onFailure: (message: string) => void }) {
  const weekends = useMemo(() => availableWeekends(), [])
  const [selectedWeekendStarts, setSelectedWeekendStarts] = useState<string[]>([])
  const [priorityWeekendStarts, setPriorityWeekendStarts] = useState<string[]>([])
  const [voterName, setVoterName] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const selectedWeekends = weekends.filter((item) => selectedWeekendStarts.includes(item.start))
    const name = voterName.trim()
    if (!name || !selectedWeekends.length || adults + children < 1) return
    setSubmitting(true)
    const result = await submitVote({ tripId: trip.id, voterName: name, duration: trip.duration, adults, children, weekends: selectedWeekends.map((weekend) => ({ ...weekend, month: new Date(`${weekend.start}T00:00:00`).getMonth() + 1, isPriority: priorityWeekendStarts.includes(weekend.start) })) })
    setSubmitting(false)
    if (result.ok) onSuccess()
    else if (result.reason === 'already-voted') onFailure('所选日期中有已提交记录，请取消该日期后重试')
    else onFailure(hasSupabase ? '数据库暂时不可用，请稍后再试' : '请先配置数据库连接，再提交真实投票')
  }

  function toggleWeekend(weekendStart: string) {
    const isSelected = selectedWeekendStarts.includes(weekendStart)
    setSelectedWeekendStarts((current) => isSelected ? current.filter((item) => item !== weekendStart) : [...current, weekendStart])
    if (isSelected) setPriorityWeekendStarts((current) => current.filter((item) => item !== weekendStart))
  }

  function togglePriority(weekendStart: string) {
    setPriorityWeekendStarts((current) => {
      if (current.includes(weekendStart)) return current.filter((item) => item !== weekendStart)
      return current.length < 2 ? [...current, weekendStart] : current
    })
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="vote-modal"><button className="modal-close" onClick={onClose} aria-label="关闭"><X size={18} /></button><div className="modal-icon"><Users size={20} /></div><div className="section-kicker">FINAL VOTE</div><h2>选择日期与同行人数</h2><p className="modal-lead">{trip.destination} · {trip.title}</p><form onSubmit={handleSubmit}><fieldset className="voter-name-field"><legend>你的姓名</legend><label><span className="sr-only">姓名</span><input type="text" value={voterName} onChange={(event) => setVoterName(event.target.value)} placeholder="请填写姓名，方便汇总" maxLength={30} autoComplete="off" required /></label><small>仅用于本次投票汇总，关闭后不会保存在浏览器中。</small></fieldset><fieldset><legend>选择日期 <span className="multi-select-label">可多选</span></legend><p className="calendar-rule">勾选所有你能参加的完整周末，最终将选择大家都合适的时间；已排除法定节假日和周末调休上班日</p>{weekends.length ? <div className="weekend-list">{weekends.map((weekend) => { const isSelected = selectedWeekendStarts.includes(weekend.start); const isPriority = priorityWeekendStarts.includes(weekend.start); return <div className={`weekend-choice ${isSelected ? 'selected' : ''}`} key={weekend.start}><label className="weekend-option"><input type="checkbox" name="weekend" value={weekend.start} checked={isSelected} onChange={() => toggleWeekend(weekend.start)} /><span><strong>{weekend.label}</strong><small>周六入住，周日返程</small></span><Check size={16} /></label>{isSelected && <button type="button" className={`priority-toggle ${isPriority ? 'active' : ''}`} onClick={() => togglePriority(weekend.start)} aria-pressed={isPriority} disabled={!isPriority && priorityWeekendStarts.length >= 2}><Star size={13} fill={isPriority ? 'currentColor' : 'none'} /> {isPriority ? '优先' : '设为优先'}</button>}</div> })}</div> : <p className="no-weekends">目前没有符合条件的完整周末。</p>}<p className="priority-hint"><Star size={12} /> 可选：最多标记 2 个更希望选的日期；未标记不会影响投票。</p></fieldset><fieldset><legend>同行人数</legend><div className="participant-grid"><NumberStepper label="大人" note="成人" value={adults} minimum={0} onChange={setAdults} /><NumberStepper label="小孩" note="儿童" value={children} minimum={0} onChange={setChildren} /></div></fieldset><button className="submit-suggestion" disabled={submitting || !voterName.trim() || !selectedWeekendStarts.length || adults + children < 1}>{submitting ? '提交中…' : `确认 ${selectedWeekendStarts.length} 个日期并投票`} <ArrowRight size={16} /></button></form><div className="modal-footnote"><Users size={14} /> 可参加人数是主要依据；优先日期只用于辅助选择最合适的时间</div></div></div>
}

function NumberStepper({ label, note, value, minimum, onChange }: { label: string; note: string; value: number; minimum: number; onChange: (value: number) => void }) {
  return <div className="participant-stepper"><div><strong>{label}</strong><small>{note}</small></div><div className="stepper-controls"><button type="button" onClick={() => onChange(Math.max(minimum, value - 1))} disabled={value === minimum} aria-label={`减少${label}`}><Minus size={15} /></button><output>{value}</output><button type="button" onClick={() => onChange(Math.min(20, value + 1))} aria-label={`增加${label}`}><Plus size={15} /></button></div></div>
}
