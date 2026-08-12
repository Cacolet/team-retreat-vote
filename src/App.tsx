import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  ExternalLink,
  Heart,
  Lightbulb,
  MapPin,
  Plus,
  Sparkles,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import { monthLabels, trips, type Duration, type Month, type TripPlan } from './data/trips'
import { hasSupabase, loadVoteCounts, submitSuggestion, submitVote } from './lib/supabase'

const seedVotes: Record<string, number> = {
  '8-1': 18, '8-2': 25, '8-3': 12, '8-4': 31, '8-5': 15, '8-6': 20,
  '9-1': 23, '9-2': 19, '9-3': 11, '9-4': 17, '9-5': 28, '9-6': 14,
  '10-1': 16, '10-2': 13, '10-3': 22, '10-4': 10, '10-5': 26, '10-6': 18,
}

export function App() {
  const [month, setMonth] = useState<Month>(8)
  const [duration, setDuration] = useState<Duration>('1day')
  const [selectedId, setSelectedId] = useState('8-1')
  const [votes, setVotes] = useState(seedVotes)
  const [isSuggestionOpen, setSuggestionOpen] = useState(false)
  const [isVoting, setVoting] = useState(false)
  const [toast, setToast] = useState('')

  const filteredTrips = useMemo(
    () => trips.filter((trip) => trip.month === month && trip.duration === duration),
    [month, duration],
  )
  const selectedTrip = filteredTrips.find((trip) => trip.id === selectedId) || filteredTrips[0]
  const totalVotes = Object.values(votes).reduce((sum, value) => sum + value, 0)

  useEffect(() => {
    const next = filteredTrips[0]
    if (next && !filteredTrips.some((trip) => trip.id === selectedId)) setSelectedId(next.id)
  }, [filteredTrips, selectedId])

  useEffect(() => {
    loadVoteCounts().then((counts) => {
      if (counts) setVotes((current) => ({ ...current, ...counts }))
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function handleVote() {
    if (!selectedTrip || isVoting) return
    setVoting(true)
    const result = await submitVote(selectedTrip.id, selectedTrip.month, selectedTrip.duration)
    if (result.ok) {
      setVotes((current) => ({ ...current, [selectedTrip.id]: (current[selectedTrip.id] || 0) + 1 }))
      setToast('已记录你的投票，感谢参与共创！')
    } else if (result.reason === 'already-voted') {
      setToast('你已经为这个方案投过票啦')
    } else {
      setToast(hasSupabase ? '数据库暂时不可用，请稍后再试' : '当前是演示模式，配置 Supabase 后可同步投票')
    }
    setVoting(false)
  }

  function switchMonth(value: Month) {
    setMonth(value)
    setSelectedId('')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Compass size={18} /></div>
          <div><strong>成都近郊</strong><span>员工团建共创站</span></div>
        </div>
        <div className="topbar-meta"><span className="live-dot" /> 2026 · 8—10 月周末方案 <span className="topbar-divider" /> <span>50 人团队</span></div>
        <a className="text-link" href="#how-it-works">如何使用 <ArrowRight size={14} /></a>
      </header>

      <main>
        <section className="intro-section">
          <div className="eyebrow"><Sparkles size={14} /> 一起决定这次去哪里</div>
          <h1>把团建方案，<em>选成大家都期待的样子。</em></h1>
          <p>按月份和天数筛选，点开任意方案查看完整行程。喜欢就投一票，也可以直接提交你的新想法。</p>
          <div className="intro-stats">
            <div><strong>18</strong><span>套候选方案</span></div>
            <div><strong>{totalVotes}</strong><span>票已收集</span></div>
            <div><strong>2</strong><span>种出行节奏</span></div>
          </div>
        </section>

        <section className="planner-board" aria-label="团建方案筛选与预览">
          <aside className="month-filter">
            <div className="section-kicker">STEP 01</div>
            <h2>先选月份</h2>
            <p>不同月份，玩法和气候都有自己的节奏。</p>
            <div className="month-list">
              {monthLabels.map((item) => (
                <button key={item.value} className={`month-button ${month === item.value ? 'active' : ''}`} onClick={() => switchMonth(item.value)}>
                  <span className="month-number">{item.label}</span>
                  <span>{item.note}</span>
                  {month === item.value && <ChevronRight size={16} />}
                </button>
              ))}
            </div>
            <div className="month-note"><CalendarDays size={16} /><span>已排除中秋、国庆假期及调休工作日</span></div>
          </aside>

          <div className="results-area">
            <div className="duration-row">
              <div><div className="section-kicker">STEP 02</div><h2>选择出行节奏</h2></div>
              <div className="duration-switch" role="tablist">
                <button className={duration === '1day' ? 'active' : ''} onClick={() => { setDuration('1day'); setSelectedId('') }} role="tab" aria-selected={duration === '1day'}><span>1 天</span><small>轻装当天往返</small></button>
                <button className={duration === '2day' ? 'active' : ''} onClick={() => { setDuration('2day'); setSelectedId('') }} role="tab" aria-selected={duration === '2day'}><span>2 天 1 夜</span><small>住下来慢慢玩</small></button>
              </div>
            </div>

            <div className="bottom-grid">
              <section className="trip-list-panel">
                <div className="list-heading"><div><div className="section-kicker">STEP 03</div><h2>候选行程 <span>{filteredTrips.length}</span></h2></div><span className="list-hint">点击查看详情</span></div>
                <div className="trip-list">
                  {filteredTrips.map((trip, index) => <TripListItem key={trip.id} trip={trip} index={index} active={selectedTrip?.id === trip.id} votes={votes[trip.id] || 0} onClick={() => setSelectedId(trip.id)} />)}
                </div>
              </section>

              <section className="detail-panel">
                {selectedTrip ? <TripDetail trip={selectedTrip} votes={votes[selectedTrip.id] || 0} onVote={handleVote} isVoting={isVoting} /> : <div className="empty-detail"><CircleHelp size={32} /><p>选择左侧方案，查看完整行程</p></div>}
              </section>
            </div>
          </div>
        </section>

        <section className="bottom-note" id="how-it-works">
          <div className="note-icon"><Lightbulb size={20} /></div><div><strong>你的声音会影响最终决定</strong><p>每个人可以为一个或多个方案投票；需要补充新路线、预算或活动，也可以点右下角「＋」提交。</p></div><div className="note-rule" /><span className="db-status"><span className={hasSupabase ? 'status-dot connected' : 'status-dot'} /> {hasSupabase ? '投票已连接数据库' : '演示模式 · 待连接数据库'}</span>
        </section>
      </main>

      <button className="floating-add" onClick={() => setSuggestionOpen(true)} aria-label="提交新想法"><Plus size={24} /><span>提想法</span></button>
      {isSuggestionOpen && <SuggestionModal month={month} duration={duration} onClose={() => setSuggestionOpen(false)} onSubmit={(message) => { setSuggestionOpen(false); setToast(message) }} />}
      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
      <footer>成都近郊员工团建共创站 <span>·</span> 方案来源：成都近郊员工团建方案 2026 年 8—10 月</footer>
    </div>
  )
}

function TripListItem({ trip, index, active, votes, onClick }: { trip: TripPlan; index: number; active: boolean; votes: number; onClick: () => void }) {
  return <button className={`trip-item ${active ? 'active' : ''}`} onClick={onClick}>
    <span className={`trip-index accent-${trip.accent}`}>{String(index + 1).padStart(2, '0')}</span>
    <span className="trip-item-main"><strong>{trip.destination}</strong><span>{trip.title}</span><small>{trip.tags.slice(0, 2).join(' · ')}</small></span>
    <span className="trip-item-side"><b>{votes}</b><small>票</small><ChevronRight size={15} /></span>
  </button>
}

function TripDetail({ trip, votes, onVote, isVoting }: { trip: TripPlan; votes: number; onVote: () => void; isVoting: boolean }) {
  return <div className="detail-enter" key={trip.id}>
    <div className={`detail-hero hero-${trip.accent}`}><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="detail-hero-copy"><span className="detail-overline">{trip.month} 月 · {trip.duration === '1day' ? '1 天' : '2 天 1 夜'}</span><h3>{trip.destination}</h3><p>{trip.title}</p></div><div className="hero-ticket"><Ticket size={15} /> {trip.budget}</div></div>
    <div className="detail-content">
      <div className="detail-title-row"><div><div className="detail-meta"><MapPin size={14} /> {trip.travelTime}</div><h2>{trip.title}</h2></div><div className="vote-count"><Heart size={15} fill="currentColor" /> <strong>{votes}</strong><span>票</span></div></div>
      <p className="detail-summary">{trip.summary}</p>
      <div className="tag-row">{trip.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="schedule-heading"><span>行程预览</span><small>可作为最终排期底稿</small></div>
      <div className="schedule-list">{trip.schedule.map((item) => <div className="schedule-item" key={item.time}><time>{item.time}</time><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div>
      <div className="reminder-box"><div><CircleHelp size={16} /><strong>执行提醒</strong></div><ul>{trip.reminders.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <button className="vote-button" onClick={onVote} disabled={isVoting}><Heart size={17} fill="currentColor" /> {isVoting ? '记录中…' : '为这个方案投票'} <span><ArrowRight size={15} /></span></button>
    </div>
  </div>
}

function SuggestionModal({ month, duration, onClose, onSubmit }: { month: Month; duration: Duration; onClose: () => void; onSubmit: (message: string) => void }) {
  const [selectedMonth, setSelectedMonth] = useState<Month>(month)
  const [selectedDuration, setSelectedDuration] = useState<Duration>(duration)
  const [itinerary, setItinerary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!itinerary.trim()) return
    setSubmitting(true)
    const result = await submitSuggestion({ month: selectedMonth, duration: selectedDuration, itinerary: itinerary.trim() })
    setSubmitting(false)
    onSubmit(result.ok ? '已收到你的想法，感谢一起完善团建方案！' : hasSupabase ? '建议提交失败，请稍后再试' : '想法已在本地记录，配置 Supabase 后可同步到数据库')
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="suggestion-modal"><button className="modal-close" onClick={onClose} aria-label="关闭"><X size={18} /></button><div className="modal-icon"><Lightbulb size={20} /></div><div className="section-kicker">OPEN CALL</div><h2>说说你的好想法</h2><p>不一定要完整，目的地、活动、预算或一句吐槽都可以。</p><form onSubmit={handleSubmit}><label>你更倾向哪个月份？<div className="choice-grid">{monthLabels.map((item) => <button type="button" key={item.value} className={selectedMonth === item.value ? 'selected' : ''} onClick={() => setSelectedMonth(item.value)}>{item.label}<small>{item.note}</small></button>)}</div></label><label>出行节奏<div className="radio-row"><button type="button" className={selectedDuration === '1day' ? 'selected' : ''} onClick={() => setSelectedDuration('1day')}><span className="radio-dot" /> 1 天</button><button type="button" className={selectedDuration === '2day' ? 'selected' : ''} onClick={() => setSelectedDuration('2day')}><span className="radio-dot" /> 2 天 1 夜</button></div></label><label>行程规划 / 想去的地方<textarea value={itinerary} onChange={(event) => setItinerary(event.target.value)} placeholder="例如：想去有水的地方，下午安排飞盘和烧烤……" rows={4} required /></label><button className="submit-suggestion" disabled={submitting}>{submitting ? '提交中…' : '提交想法'} <ArrowRight size={16} /></button></form><div className="modal-footnote"><Users size={14} /> 仅用于本次团建方案共创</div></div></div>
}
