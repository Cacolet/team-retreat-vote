import { useRef, useState, type FormEvent } from 'react'
import { Bus, Car, Clock3, LockKeyhole, Mountain, RefreshCw, Users } from 'lucide-react'
import { retreat } from '../data/retreat'
import { hasSupabase } from '../lib/supabase'
import { loadRegistrationStats, summarizeRegistrations, type RegistrationRow } from '../lib/registrationStats'

const displayTime = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value))

export function RegistrationStatsPage() {
  const [password, setPassword] = useState('')
  const [rows, setRows] = useState<RegistrationRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshedAt, setRefreshedAt] = useState('')
  const credential = useRef('')
  const requestId = useRef(0)
  const inFlight = useRef(false)

  async function fetchRows(secret: string) {
    if (inFlight.current) return
    inFlight.current = true
    const currentRequest = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const result = await loadRegistrationStats(secret)
      if (currentRequest !== requestId.current) return
      if (result.ok) {
        credential.current = secret
        setPassword('')
        setRows(result.rows)
        setRefreshedAt(new Date().toISOString())
      } else if (result.reason === 'denied') {
        credential.current = ''
        setRows(null)
        setError('管理员口令不正确，请重新输入。')
      } else {
        setError(result.reason === 'not-configured' ? '数据库尚未配置。' : result.reason === 'permission' ? '统计接口权限不足，请检查数据库统计功能的授权配置。' : '统计数据暂时无法读取，请确认已启用统计功能后重试。')
      }
    } catch {
      if (currentRequest === requestId.current) setError('网络连接异常，请稍后重试。')
    } finally {
      if (currentRequest === requestId.current) {
        inFlight.current = false
        setLoading(false)
      }
    }
  }

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.trim()) void fetchRows(password.trim())
  }

  function lock() {
    requestId.current += 1
    inFlight.current = false
    credential.current = ''
    setRows(null)
    setPassword('')
    setError('')
    setLoading(false)
    setRefreshedAt('')
  }

  const summary = rows ? summarizeRegistrations(rows) : null
  return <div className="registration-shell stats-shell">
    <header className="registration-header stats-header"><div className="registration-brand"><Mountain size={22} /><span>团建数据统计</span></div>{rows && <button type="button" className="stats-tool" onClick={lock}><LockKeyhole size={15} />锁定页面</button>}</header>
    <main className="stats-main">
      {!rows ? <section className="stats-gate" aria-labelledby="stats-title">
        <div className="stats-lock-icon"><LockKeyhole size={25} /></div>
        <span className="panel-eyebrow">仅组织者查看</span><h1 id="stats-title">报名数据</h1><p>{retreat.destination} · 2026 年 10 月 17–18 日</p>
        <form className="registration-form" onSubmit={unlock}><label className="registration-name"><span>管理员口令</span><input type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={256} required disabled={loading} placeholder="输入口令查看统计" /></label>
          {error && <p className="registration-error" role="alert">{error}</p>}
          <button type="submit" className="registration-submit" disabled={loading || !password || !hasSupabase}>{loading ? '验证中…' : '查看数据'}</button>
          {!hasSupabase && <p className="registration-error">数据库尚未配置。</p>}
        </form>
      </section> : <>
        <div className="stats-heading"><div><span className="panel-eyebrow">确认报名 · 交通安排</span><h1>{retreat.destination} · 人数统计</h1><p>2026 年 10 月 17–18 日 · 最近读取：{displayTime(refreshedAt)}</p></div><button type="button" className="stats-tool" disabled={loading} onClick={() => void fetchRows(credential.current)}><RefreshCw size={16} />{loading ? '刷新中…' : '刷新数据'}</button></div>
        {error && <p className="registration-error stats-error" role="alert">{error} 下方保留上次成功读取的数据。</p>}
        <section className="stats-cards" aria-label="人数汇总">{summary && [
          { key: 'all' as const, label: '总参与人数', icon: Users },
          { key: 'bus' as const, label: '乘坐大巴', icon: Bus },
          { key: 'self_drive' as const, label: '自行开车', icon: Car },
          { key: 'pending' as const, label: '出行方式待确认', icon: Clock3 },
        ].map(({ key, label, icon: Icon }) => <article className={`stats-card stats-${key}`} key={key}><span><Icon size={17} />{label}</span><strong>{summary[key].total}<small>人</small></strong><p>大人 {summary[key].adults} · 小孩 {summary[key].children}</p><small>{summary[key].registrations} 份报名</small></article>)}</section>
        <section className="stats-details"><div className="stats-table-heading"><h2>报名明细</h2><span>{rows.length} 份报名</span></div><div className="stats-table-scroll"><table><thead><tr><th scope="col">姓名</th><th scope="col">大人（含本人）</th><th scope="col">小孩</th><th scope="col">合计</th><th scope="col">出行方式</th><th scope="col">最近登记时间</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.participant_name}</td><td>{row.adult_count}</td><td>{row.child_count}</td><td>{row.adult_count + row.child_count}</td><td><span className={`stats-mode mode-${row.transport_mode || 'pending'}`}>{row.transport_mode === 'bus' ? '乘坐大巴' : row.transport_mode === 'self_drive' ? '自行开车' : '待确认'}</span></td><td>{displayTime(row.updated_at || row.created_at)}</td></tr>)}</tbody></table></div>{!rows.length && <p className="stats-empty">目前还没有确认报名数据。</p>}</section>
        <p className="stats-note">大人包含报名者本人。待确认人数未计入大巴人数；自驾报名份数不等于车辆数。同一浏览器更新报名只保留一份记录。</p>
      </>}
    </main>
  </div>
}
