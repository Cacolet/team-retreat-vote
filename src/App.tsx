import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  ExternalLink,
  Heart,
  Lightbulb,
  MapPin,
  Plus,
  Search,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import { monthLabels, trips, type Duration, type Month, type TripPlan } from './data/trips'
import { hasSupabase, loadVoteCounts, submitSuggestion, submitVote } from './lib/supabase'

type Weekend = { start: string; end: string; label: string }
type AttendanceDate = { value: string; label: string; weekday: '周六' | '周日'; weekend: Weekend }

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function availableWeekends(month: Month): Weekend[] {
  const today = new Date()
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const year = currentDay.getFullYear()
  const weekends: Weekend[] = []

  for (let day = 1; day <= new Date(year, month, 0).getDate(); day += 1) {
    const saturday = new Date(year, month - 1, day)
    if (saturday.getDay() !== 6) continue
    const sunday = new Date(year, month - 1, day + 1)
    if (sunday.getMonth() !== month - 1 || sunday < currentDay) continue
    weekends.push({
      start: `${year}-${pad(month)}-${pad(day)}`,
      end: `${year}-${pad(month)}-${pad(day + 1)}`,
      label: `${month} 月 ${day} 日 — ${day + 1} 日`,
    })
  }
  return weekends
}

function attendanceDates(weekends: Weekend[]): AttendanceDate[] {
  return weekends.flatMap((weekend) => {
    const start = new Date(`${weekend.start}T00:00:00`)
    const end = new Date(`${weekend.end}T00:00:00`)
    return [
      { value: weekend.start, label: `${start.getMonth() + 1} 月 ${start.getDate()} 日`, weekday: '周六' as const, weekend },
      { value: weekend.end, label: `${end.getMonth() + 1} 月 ${end.getDate()} 日`, weekday: '周日' as const, weekend },
    ]
  })
}

export function App() {
  const [month, setMonth] = useState<Month>(8)
  const [duration, setDuration] = useState<Duration>('1day')
  const [selectedId, setSelectedId] = useState('8-1')
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [isSuggestionOpen, setSuggestionOpen] = useState(false)
  const [isVoteOpen, setVoteOpen] = useState(false)
  const [toast, setToast] = useState('')

  const filteredTrips = useMemo(() => trips.filter((trip) => trip.month === month && trip.duration === duration), [month, duration])
  const selectedTrip = filteredTrips.find((trip) => trip.id === selectedId) || filteredTrips[0]

  useEffect(() => {
    const next = filteredTrips[0]
    if (next && !filteredTrips.some((trip) => trip.id === selectedId)) setSelectedId(next.id)
  }, [filteredTrips, selectedId])

  useEffect(() => {
    loadVoteCounts().then((counts) => { if (counts) setVotes(counts) })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  function setMonthAndReset(value: Month) {
    setMonth(value)
    setSelectedId('')
  }

  function setDurationAndReset(value: Duration) {
    setDuration(value)
    setSelectedId('')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#planner" aria-label="团建方案投票">
          <div className="brand-mark"><Compass size={17} /></div>
          <div><strong>团建方案投票</strong><span>成都近郊 · 2026 年 8—10 月</span></div>
        </a>
        <span className="db-status"><span className={hasSupabase ? 'status-dot connected' : 'status-dot'} /> {hasSupabase ? '实时数据已连接' : '演示数据模式'}</span>
      </header>

      <main>
        <section className="planner-board" id="planner" aria-label="团建方案筛选与投票">
          <div className="results-area">
            <div className="planner-heading"><div><p>先选时间，再比较方案</p><h1>选择最想去的团建方案</h1></div><span>共 {filteredTrips.length} 个可选方案</span></div>

            <section className="filter-cascade" aria-label="行程筛选">
              <div className="cascade-step"><div className="cascade-label"><span>1</span><strong>出行月份</strong></div><div className="month-picker">{monthLabels.map((item) => <button key={item.value} className={month === item.value ? 'active' : ''} onClick={() => setMonthAndReset(item.value)}><strong>{item.label}</strong><small>{item.note}</small></button>)}</div></div>
              <ChevronRight className="cascade-arrow" size={18} aria-hidden="true" />
              <div className="cascade-step"><div className="cascade-label"><span>2</span><strong>行程时长</strong></div><div className="duration-switch" role="tablist" aria-label="出行时长"><button className={duration === '1day' ? 'active' : ''} onClick={() => setDurationAndReset('1day')} role="tab" aria-selected={duration === '1day'}><span>1 天</span><small>当天往返</small></button><button className={duration === '2day' ? 'active' : ''} onClick={() => setDurationAndReset('2day')} role="tab" aria-selected={duration === '2day'}><span>2 天 1 夜</span><small>住下来慢慢玩</small></button></div></div>
              <ChevronRight className="cascade-arrow" size={18} aria-hidden="true" />
              <div className="cascade-summary"><CalendarCheck size={17} /><span>正在查看</span><strong>{month} 月 · {duration === '1day' ? '1 天方案' : '2 天 1 夜方案'}</strong></div>
            </section>

            <div className="bottom-grid">
              <section className="trip-list-panel">
                <div className="list-heading"><div><h2>候选方案</h2><p>点击左侧方案查看详情与社区参考</p></div></div>
                <div className="trip-list">{filteredTrips.map((trip, index) => <TripListItem key={trip.id} trip={trip} index={index} active={selectedTrip?.id === trip.id} votes={votes[trip.id] || 0} onClick={() => setSelectedId(trip.id)} />)}</div>
              </section>
              <section className="detail-panel">{selectedTrip ? <TripDetail trip={selectedTrip} votes={votes[selectedTrip.id] || 0} onVote={() => setVoteOpen(true)} /> : <div className="empty-detail"><CircleHelp size={32} /><p>选择左侧方案，查看完整行程</p></div>}</section>
            </div>
          </div>
        </section>
      </main>

      <button className="floating-add" onClick={() => setSuggestionOpen(true)} aria-label="提交新想法"><Plus size={22} /><span>提想法</span></button>
      {isVoteOpen && selectedTrip && <VoteModal trip={selectedTrip} onClose={() => setVoteOpen(false)} onSuccess={() => { setVotes((current) => ({ ...current, [selectedTrip.id]: (current[selectedTrip.id] || 0) + 1 })); setVoteOpen(false); setToast('投票已提交，感谢你的时间意向！') }} onFailure={setToast} />}
      {isSuggestionOpen && <SuggestionModal month={month} duration={duration} onClose={() => setSuggestionOpen(false)} onSubmit={(message) => { setSuggestionOpen(false); setToast(message) }} />}
      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
      <footer>团建方案投票 · 所有社区内容需以平台最新笔记与视频为准</footer>
    </div>
  )
}

function TripListItem({ trip, index, active, votes, onClick }: { trip: TripPlan; index: number; active: boolean; votes: number; onClick: () => void }) {
  return <button className={`trip-item ${active ? 'active' : ''}`} onClick={onClick}><span className={`trip-index accent-${trip.accent}`}>{String(index + 1).padStart(2, '0')}</span><span className="trip-item-main"><strong>{trip.destination}</strong><span>{trip.title}</span><small>{trip.tags.slice(0, 2).join(' · ')}</small></span><span className="trip-item-side"><b>{votes}</b><small>票</small><ChevronRight size={15} /></span></button>
}

function TripDetail({ trip, votes, onVote }: { trip: TripPlan; votes: number; onVote: () => void }) {
  return <div className="detail-enter" key={trip.id}>
    <div className={`detail-hero hero-${trip.accent}`}><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="detail-hero-copy"><span className="detail-overline">{trip.month} 月 · {trip.duration === '1day' ? '1 天' : '2 天 1 夜'}</span><h3>{trip.destination}</h3><p>{trip.title}</p></div><div className="hero-ticket"><Ticket size={15} /> {trip.budget}</div></div>
    <div className="detail-content"><div className="detail-title-row"><div><div className="detail-meta"><MapPin size={14} /> {trip.travelTime}</div><h2>{trip.title}</h2></div><div className="vote-count"><Heart size={15} fill="currentColor" /> <strong>{votes}</strong><span>票</span></div></div><p className="detail-summary">{trip.summary}</p><div className="tag-row">{trip.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><CommunitySources trip={trip} /><div className="schedule-heading"><span>行程预览</span><small>组织前请以场地实时信息为准</small></div><div className="schedule-list">{trip.schedule.map((item) => <div className="schedule-item" key={item.time}><time>{item.time}</time><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div><div className="reminder-box"><div><CircleHelp size={16} /><strong>执行提醒</strong></div><ul>{trip.reminders.map((item) => <li key={item}>{item}</li>)}</ul></div><button className="vote-button" onClick={onVote}><Heart size={17} fill="currentColor" /> 填写意向并投票 <span><ArrowRight size={15} /></span></button></div>
  </div>
}

function CommunitySources({ trip }: { trip: TripPlan }) {
  const keyword = `${trip.destination.replace(' · ', ' ')} ${trip.tags[0]} 攻略`
  const xhsUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`
  const douyinUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}`
  return <section className="community-sources" aria-label="社区内容参考"><div><Search size={14} /><strong>查看近期社区内容</strong><small>不展示虚构热度；打开平台查看最新笔记、视频与评论。</small></div><div className="source-actions"><a href={xhsUrl} target="_blank" rel="noreferrer">小红书搜索 <ExternalLink size={12} /></a><a href={douyinUrl} target="_blank" rel="noreferrer">抖音搜索 <ExternalLink size={12} /></a></div></section>
}

function VoteModal({ trip, onClose, onSuccess, onFailure }: { trip: TripPlan; onClose: () => void; onSuccess: () => void; onFailure: (message: string) => void }) {
  const weekends = useMemo(() => availableWeekends(trip.month), [trip.month])
  const dates = useMemo(() => attendanceDates(weekends), [weekends])
  const [name, setName] = useState('')
  const [selectedDate, setSelectedDate] = useState(dates[0]?.value || '')
  const [selectedWeekend, setSelectedWeekend] = useState(weekends[0]?.start || '')
  const [submitting, setSubmitting] = useState(false)
  const isOneDay = trip.duration === '1day'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const attendance = isOneDay ? dates.find((item) => item.value === selectedDate) : undefined
    const weekend = isOneDay ? attendance?.weekend : weekends.find((item) => item.start === selectedWeekend)
    const attendanceDate = isOneDay ? attendance?.value : weekend?.start
    if (!name.trim() || !weekend || !attendanceDate) return
    setSubmitting(true)
    const result = await submitVote({ tripId: trip.id, month: trip.month, duration: trip.duration, voterName: name.trim(), weekendStart: weekend.start, weekendEnd: weekend.end, attendanceDate })
    setSubmitting(false)
    if (result.ok) onSuccess()
    else if (result.reason === 'already-voted') onFailure('该姓名已为这个方案的该日期投过票')
    else onFailure(hasSupabase ? '数据库暂时不可用，请稍后再试' : '请先配置数据库连接，再提交真实投票')
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="vote-modal"><button className="modal-close" onClick={onClose} aria-label="关闭"><X size={18} /></button><div className="modal-icon"><Heart size={20} /></div><div className="section-kicker">YOUR AVAILABILITY</div><h2>提交你的投票意向</h2><p className="modal-lead">{trip.destination} · {trip.title}</p><form onSubmit={handleSubmit}><label>你的姓名<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：王小明" maxLength={30} required autoFocus /></label><fieldset><legend>{isOneDay ? '你能参加哪一天？' : '你能参加哪个完整周末？'}</legend>{weekends.length ? isOneDay ? <div className="attendance-grid">{dates.map((date) => <label className={`attendance-option ${selectedDate === date.value ? 'selected' : ''}`} key={date.value}><input type="radio" name="attendance-date" value={date.value} checked={selectedDate === date.value} onChange={() => setSelectedDate(date.value)} /><span><strong>{date.label}</strong><small>{date.weekday} · {date.weekend.label}</small></span><Check size={16} /></label>)}</div> : <div className="weekend-list">{weekends.map((weekend) => <label className={`weekend-option ${selectedWeekend === weekend.start ? 'selected' : ''}`} key={weekend.start}><input type="radio" name="weekend" value={weekend.start} checked={selectedWeekend === weekend.start} onChange={() => setSelectedWeekend(weekend.start)} /><span><strong>{weekend.label}</strong><small>周六入住，周日返程</small></span><Check size={16} /></label>)}</div> : <p className="no-weekends">这个月份已经没有从今天起可选择的日期了，请选择其他月份。</p>}</fieldset><button className="submit-suggestion" disabled={submitting || !weekends.length}>{submitting ? '提交中…' : '确认并投票'} <ArrowRight size={16} /></button></form><div className="modal-footnote"><Users size={14} /> 姓名与日期仅用于本次团建排期</div></div></div>
}

function SuggestionModal({ month, duration, onClose, onSubmit }: { month: Month; duration: Duration; onClose: () => void; onSubmit: (message: string) => void }) {
  const [selectedMonth, setSelectedMonth] = useState<Month>(month)
  const [selectedDuration, setSelectedDuration] = useState<Duration>(duration)
  const [itinerary, setItinerary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event: FormEvent) { event.preventDefault(); if (!itinerary.trim()) return; setSubmitting(true); const result = await submitSuggestion({ month: selectedMonth, duration: selectedDuration, itinerary: itinerary.trim() }); setSubmitting(false); onSubmit(result.ok ? '已收到你的想法，感谢一起完善团建方案！' : hasSupabase ? '建议提交失败，请稍后再试' : '请先配置数据库连接，再提交建议') }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="suggestion-modal"><button className="modal-close" onClick={onClose} aria-label="关闭"><X size={18} /></button><div className="modal-icon"><Lightbulb size={20} /></div><div className="section-kicker">OPEN CALL</div><h2>说说你的好想法</h2><p>不一定要完整，目的地、活动、预算或一句吐槽都可以。</p><form onSubmit={handleSubmit}><label>你更倾向哪个月份？<div className="choice-grid">{monthLabels.map((item) => <button type="button" key={item.value} className={selectedMonth === item.value ? 'selected' : ''} onClick={() => setSelectedMonth(item.value)}>{item.label}<small>{item.note}</small></button>)}</div></label><label>出行时长<div className="radio-row"><button type="button" className={selectedDuration === '1day' ? 'selected' : ''} onClick={() => setSelectedDuration('1day')}><span className="radio-dot" /> 1 天</button><button type="button" className={selectedDuration === '2day' ? 'selected' : ''} onClick={() => setSelectedDuration('2day')}><span className="radio-dot" /> 2 天 1 夜</button></div></label><label>行程规划 / 想去的地方<textarea value={itinerary} onChange={(event) => setItinerary(event.target.value)} placeholder="例如：想去有水的地方，下午安排飞盘和烧烤……" rows={4} required /></label><button className="submit-suggestion" disabled={submitting}>{submitting ? '提交中…' : '提交想法'} <ArrowRight size={16} /></button></form><div className="modal-footnote"><Users size={14} /> 仅用于本次团建方案共创</div></div></div>
}
