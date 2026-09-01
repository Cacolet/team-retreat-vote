export type Duration = '2day'

export type TripPlan = {
  id: string
  duration: Duration
  destination: string
  title: string
  budget: string
  travelTime: string
  tags: string[]
  summary: string
  accent: string
  schedule: { time: string; title: string; detail: string }[]
  reminders: string[]
}

const day = (time: string, title: string, detail: string) => ({ time, title, detail })

// 根据意见收集结果，18 个初始方案收敛为以下 3 个两天一夜最终候选。
export const trips: TripPlan[] = [
  {
    id: 'pujiang-xilai', duration: '2day', destination: '蒲江 · 西来营地', title: '自然手作与营地慢游', budget: '¥380–560 / 人', travelTime: '成都出发约 1.5h', tags: ['古镇慢游', '自由活动', '家庭友好'], summary: '古镇、自然手作和营地晚会留出足够自由时间，适合把吃喝、闲逛和轻团建分开安排。', accent: 'terracotta',
    schedule: [day('D1 09:00', '古镇集合', '抵达后午餐与分组签到，不安排高强度破冰。'), day('D1 14:00', '自由活动 + 轻手作', '古镇闲逛、自然手作和草坪活动可自由选择。'), day('D1 18:00', '营地晚餐', '晚餐、分享与自由聊天，保留家庭活动空间。'), day('D2 09:00', '轻户外返程', '早餐后自由活动，午餐后返回成都。')],
    reminders: ['确认雨天手作空间和住宿配置', '按家庭组合提前核对房型'],
  },
  {
    id: 'xiling-anren', duration: '2day', destination: '西岭雪山＋安仁', title: '森野秋景与文博慢行', budget: '¥500–750 / 人', travelTime: '成都出发约 2h', tags: ['秋景', '轻徒步', '自由节奏'], summary: '森林秋景与安仁文博串联，景色更强；可将轻徒步、休闲拍照和古镇慢游分开选择。', accent: 'pine',
    schedule: [day('D1 08:00', '前往西岭', '大巴出发，抵达后轻徒步与观景。'), day('D1 18:00', '山野晚餐', '入住、晚餐与团队分享。'), day('D2 09:00', '森林漫游', '早餐后自由活动与团队合影。'), day('D2 13:30', '安仁返程', '可选文博短停，下午返回成都。')],
    reminders: ['确认索道、天气与高海拔适应情况', '该方案预算较高，需提前确认团队报价'],
  },
  {
    id: 'leshan-freeplay', duration: '2day', destination: '乐山 · 大佛＋老城', title: '自由玩耍与吃喝漫游', budget: '¥420–680 / 人', travelTime: '成都出发约 2.5h', tags: ['自由安排', '美食', '亲子可选'], summary: '以自由玩耍和吃喝体验为主：想看乐山大佛的可自行前往，想逛街、吃美食的可在老城慢慢逛。', accent: 'rose',
    schedule: [day('D1 09:00', '出发前往乐山', '途中说明住宿与自由活动集合时间。'), day('D1 13:00', '自由玩耍', '可选大佛游览、老城逛吃或酒店休闲。'), day('D1 18:30', '自由晚餐', '按小组或家庭自由选择餐厅，预留集体碰面点。'), day('D2 09:30', '慢游与返程', '早餐后继续自由活动，午餐后返回成都。')],
    reminders: ['大佛游览需根据实际预约与客流安排', '提前确认住宿区域、停车与家庭房数量'],
  },
]
