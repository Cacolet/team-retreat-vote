import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  ExternalLink,
  Heart,
  Lightbulb,
  MapPin,
  MessageSquareText,
  Search,
  Send,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import { monthLabels, trips, type Duration, type Month, type TripPlan } from './data/trips'
import { hasSupabase, loadVoteCounts, submitSuggestion, submitVote } from './lib/supabase'

type Workspace = 'opinions' | 'final'
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
  const [workspace, setWorkspace] = useState<Workspace>('opinions')
  const [month, setMonth] = useState<Month>(8)
  const [selectedId, setSelectedId] = useState('8-1')
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [isVoteOpen, setVoteOpen] = useState(false)
  const [toast, setToast] = useState('')

  const monthTrips = useMemo(() => trips.filter((trip) => trip.month === month), [month])
  const oneDayTrips = useMemo(() => monthTrips.filter((trip) => trip.duration === '1day'), [monthTrips])
  const overnightTrips = useMemo(() => monthTrips.filter((trip) => trip.duration === '2day'), [monthTrips])
  const selectedTrip = monthTrips.find((trip) => trip.id === selectedId) || monthTrips[0]

  useEffect(() => {
    const next = monthTrips[0]
    if (next && !monthTrips.some((trip) => trip.id === selectedId)) setSelectedId(next.id)
  }, [monthTrips, selectedId])

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

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#workspace" aria-label="团建方案投票">
          <div className="brand-mark"><Compass size={19} /></div>
          <div><strong>团建共创</strong><span>成都近郊 · 2026 年 8—10 月</span></div>
        </a>
        <nav className="workspace-tabs" aria-label="团建流程">
          <button className={workspace === 'opinions' ? 'active' : ''} onClick={() => setWorkspace('opinions')}><MessageSquareText size={16} />意见收集 <small>进行中</small></button>
          <button className={workspace === 'final' ? 'active' : ''} onClick={() => setWorkspace('final')}><CalendarCheck size={16} />最终敲定 <small>待开启</small></button>
        </nav>
        <span className="db-status"><span className={hasSupabase ? 'status-dot connected' : 'status-dot'} /> {hasSupabase ? '实时数据已连接' : '演示数据模式'}</span>
      </header>

      <main id="workspace">
        {workspace === 'opinions' ? (
          <OpinionCollection onSubmit={setToast} onViewFinal={() => setWorkspace('final')} />
        ) : (
          <section className="final-workspace" aria-label="最终敲定">
            <div className="final-phase-banner">
              <div><span><Lightbulb size={14} /> AI 参考说明</span><strong>以下方案与行程资料均由 AI 提供，仅供参考</strong><p>如果有心仪选项，可提前填写意向并投票；每一票都会提高该方案在最终敲定时的权重。</p></div>
              <button onClick={() => setWorkspace('opinions')}>继续提交意见 <ArrowRight size={15} /></button>
            </div>
            <section className="planner-board" id="planner" aria-label="团建方案筛选与投票">
              <aside className="control-rail" aria-label="行程筛选">
                <div className="rail-title"><span>筛选条件</span><small>选择出行月份</small></div>
                <div className="cascade-step"><div className="cascade-label"><span>01</span><strong>出行月份</strong></div><div className="month-picker">{monthLabels.map((item) => <button key={item.value} className={month === item.value ? 'active' : ''} onClick={() => setMonthAndReset(item.value)}><strong>{item.label}</strong><small>{item.note}</small><ChevronRight size={15} /></button>)}</div></div>
                <div className="cascade-summary"><CalendarCheck size={18} /><span>当前月份</span><strong>{month} 月 · {monthTrips.length} 个方案</strong></div>
              </aside>
              <div className="results-area">
                <div className="planner-heading"><div><p>最终敲定 · 方案库</p><h1>选择最想去的团建方案</h1></div><span>{monthTrips.length} 个方案</span></div>
                <div className="bottom-grid">
                  <section className="trip-list-panel">
                    <div className="list-heading"><div><h2>候选方案</h2><p>按行程时长分组，点击方案查看详情</p></div></div>
                    <TripGroup label="1 天 · 当天往返" note="轻装出发，周六或周日均可投票" trips={oneDayTrips} activeId={selectedTrip?.id} votes={votes} onSelect={setSelectedId} />
                    <TripGroup label="2 天 1 夜 · 住下来慢慢玩" note="选择完整周末，周六入住、周日返程" trips={overnightTrips} activeId={selectedTrip?.id} votes={votes} onSelect={setSelectedId} />
                  </section>
                  <section className="detail-panel">{selectedTrip ? <TripDetail trip={selectedTrip} votes={votes[selectedTrip.id] || 0} onVote={() => setVoteOpen(true)} /> : <div className="empty-detail"><CircleHelp size={32} /><p>选择左侧方案，查看完整行程</p></div>}</section>
                </div>
              </div>
            </section>
          </section>
        )}
      </main>

      {isVoteOpen && selectedTrip && <VoteModal trip={selectedTrip} onClose={() => setVoteOpen(false)} onSuccess={() => { setVotes((current) => ({ ...current, [selectedTrip.id]: (current[selectedTrip.id] || 0) + 1 })); setVoteOpen(false); setToast('投票已提交，感谢你的时间意向！') }} onFailure={setToast} />}
      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      <footer>团建共创 · 最终方案将在意见收集截止后统一敲定</footer>
    </div>
  )
}

function OpinionCollection({ onSubmit, onViewFinal }: { onSubmit: (message: string) => void; onViewFinal: () => void }) {
  const [selectedMonth, setSelectedMonth] = useState<Month>(8)
  const [selectedDuration, setSelectedDuration] = useState<Duration>('1day')
  const [itinerary, setItinerary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!itinerary.trim()) return
    setSubmitting(true)
    const result = await submitSuggestion({ month: selectedMonth, duration: selectedDuration, itinerary: itinerary.trim() })
    setSubmitting(false)
    if (result.ok) {
      setItinerary('')
      onSubmit('意见已提交，感谢一起完善这次团建！')
    } else {
      onSubmit(hasSupabase ? '意见提交失败，请稍后再试' : '请先配置数据库连接，再提交意见')
    }
  }

  return <section className="opinion-workspace" aria-label="意见收集">
    <aside className="opinion-brief">
      <div className="phase-label"><span>当前阶段</span><i /> 意见收集</div>
      <h1>先把想法<br />说清楚。</h1>
      <p>现在不需要选定方案。告诉大家你对出行月份、行程时长和目的地的真实偏好，21 日后再统一进入最终敲定。</p>
      <div className="deadline-card"><div className="deadline-icon"><Clock3 size={24} /></div><div><span>意见收集截止</span><strong>8 月 21 日</strong><small>截止后开放方案投票与周末排期</small></div></div>
      <button className="brief-link" onClick={onViewFinal}>查看最终敲定方案库 <ArrowRight size={15} /></button>
    </aside>
    <section className="opinion-form-panel">
      <div className="form-panel-heading"><div><span>OPEN INPUT</span><h2>你的团建意见</h2><p>目的地、活动、预算或顾虑都可以写下来。请先选择你更倾向的时间。</p></div><div className="form-number">01</div></div>
      <form className="opinion-form" onSubmit={handleSubmit}>
        <fieldset><legend>更倾向哪个月份？</legend><div className="opinion-month-grid">{monthLabels.map((item) => <button type="button" key={item.value} className={selectedMonth === item.value ? 'selected' : ''} onClick={() => setSelectedMonth(item.value)}><strong>{item.label}</strong><small>{item.note}</small><Check size={15} /></button>)}</div></fieldset>
        <fieldset><legend>更适合哪种节奏？</legend><div className="duration-options"><button type="button" className={selectedDuration === '1day' ? 'selected' : ''} onClick={() => setSelectedDuration('1day')}><span>1 天</span><strong>当天往返</strong><small>时间好协调，轻装出发</small><Check size={16} /></button><button type="button" className={selectedDuration === '2day' ? 'selected' : ''} onClick={() => setSelectedDuration('2day')}><span>2 天 1 夜</span><strong>住下来慢慢玩</strong><small>适合安排更完整的团建</small><Check size={16} /></button></div></fieldset>
        <label className="opinion-textarea"><span>你想补充什么？</span><textarea value={itinerary} onChange={(event) => setItinerary(event.target.value)} placeholder="写下你的偏好、目的地、节奏或预算顾虑…" rows={5} required /></label>
        <div className="opinion-example"><span>参考写法</span><p>9 月、乐山、2 天 1 夜、以自由玩耍为主、吃喝自由发挥、想去乐山大佛的可以去乐山大佛，想吃逛街的可以吃逛街；主打随意。</p></div>
        <div className="form-submit-row"><span><Lightbulb size={15} /> 提交后会进入本次团建共创池</span><button className="submit-opinion" disabled={submitting}>{submitting ? '提交中…' : '提交我的意见'} <Send size={16} /></button></div>
      </form>
    </section>
  </section>
}

function TripGroup({ label, note, trips: groupTrips, activeId, votes, onSelect }: { label: string; note: string; trips: TripPlan[]; activeId?: string; votes: Record<string, number>; onSelect: (id: string) => void }) {
  return <section className="trip-group"><div className="trip-group-heading"><div><strong>{label}</strong><small>{note}</small></div><span>{groupTrips.length}</span></div><div className="trip-list">{groupTrips.map((trip, index) => <TripListItem key={trip.id} trip={trip} index={index} active={activeId === trip.id} votes={votes[trip.id] || 0} onClick={() => onSelect(trip.id)} />)}</div></section>
}

function TripListItem({ trip, index, active, votes, onClick }: { trip: TripPlan; index: number; active: boolean; votes: number; onClick: () => void }) {
  return <button className={`trip-item duration-${trip.duration} ${active ? 'active' : ''}`} onClick={onClick}><span className="trip-index">{String(index + 1).padStart(2, '0')}</span><span className="trip-item-main"><strong>{trip.destination}</strong><span>{trip.title}</span><small>{trip.tags.slice(0, 2).join(' · ')}</small></span><span className="trip-item-side"><b>{votes}</b><small>票</small><ChevronRight size={16} /></span></button>
}

function TripDetail({ trip, votes, onVote }: { trip: TripPlan; votes: number; onVote: () => void }) {
  return <div className="detail-enter" key={trip.id}>
    <div className={`detail-hero duration-${trip.duration}`}><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="detail-hero-copy"><span className="detail-overline">{trip.month} 月 · {trip.duration === '1day' ? '1 天' : '2 天 1 夜'}</span><h3>{trip.destination}</h3><p>{trip.title}</p></div><div className="hero-ticket"><Ticket size={15} /> {trip.budget}</div></div>
    <div className="detail-content"><div className="detail-title-row"><div><div className="detail-meta"><MapPin size={15} /> {trip.travelTime}</div><h2>{trip.title}</h2></div><div className="vote-count"><Heart size={16} fill="currentColor" /> <strong>{votes}</strong><span>票</span></div></div><p className="detail-summary">{trip.summary}</p><div className="tag-row">{trip.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><CommunitySources trip={trip} /><div className="schedule-heading"><span>行程预览</span><small>组织前请以场地实时信息为准</small></div><div className="schedule-list">{trip.schedule.map((item) => <div className="schedule-item" key={item.time}><time>{item.time}</time><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div><div className="reminder-box"><div><CircleHelp size={17} /><strong>执行提醒</strong></div><ul>{trip.reminders.map((item) => <li key={item}>{item}</li>)}</ul></div><button className="vote-button" onClick={onVote}><Heart size={17} fill="currentColor" /> 提前投票，提高方案权重 <span><ArrowRight size={15} /></span></button></div>
  </div>
}

function CommunitySources({ trip }: { trip: TripPlan }) {
  const keyword = `${trip.destination.replace(' · ', ' ')} ${trip.tags[0]} 攻略`
  const xhsUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`
  const douyinUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}`
  return <section className="community-sources" aria-label="社区内容参考"><div><Search size={15} /><strong>查看近期社区内容</strong><small>不展示虚构热度；打开平台查看最新笔记、视频与评论。</small></div><div className="source-actions"><a href={xhsUrl} target="_blank" rel="noreferrer">小红书搜索 <ExternalLink size={12} /></a><a href={douyinUrl} target="_blank" rel="noreferrer">抖音搜索 <ExternalLink size={12} /></a></div></section>
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
