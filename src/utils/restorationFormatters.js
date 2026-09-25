export function riskMeta(risk) {
  const map = {
    high: {
      label: '高',
      tone: 'high',
    },
    medium: {
      label: '中',
      tone: 'medium',
    },
    low: {
      label: '低',
      tone: 'low',
    },
  }

  return map[risk] ?? map.low
}

export function roleMeta(role) {
  const map = {
    lead: { label: '修复负责人', tone: 'high' },
    restorer: { label: '修复师', tone: 'medium' },
    viewer: { label: '观看', tone: 'low' },
  }

  return map[role] ?? { label: role, tone: 'low' }
}

export function statusMeta(active) {
  return active
    ? { label: '在岗', tone: 'low' }
    : { label: '已停用', tone: 'high' }
}

// 有资格承接在办任务：修复负责人与在岗修复师，观看角色不参与
export function eligibleForAssignment(member) {
  if (!member || !member.active) return false
  return member.role === 'lead' || member.role === 'restorer'
}

export function formatHistoryDate(value) {
  if (!value) return ''
  return value.slice(0, 10)
}
