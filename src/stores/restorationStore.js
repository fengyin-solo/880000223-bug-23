import { computed, reactive } from 'vue'

import {
  restorationOwnerHistory,
  restorationPersonnel,
  restorationTasks,
} from '../data/restorationData'

// 模块级单一数据源：任务清单、看板统计、变更记录都读写同一份响应式状态，
// 跨路由返回时不会出现“列表已改、看板仍旧”的口径分叉。
const state = reactive({
  personnel: restorationPersonnel.map((item) => ({ ...item })),
  tasks: restorationTasks.map((item) => ({ ...item })),
  ownerHistory: restorationOwnerHistory.map((item) => ({ ...item })),
})

export const ownerChangeMessages = {
  TASK_NOT_FOUND: '任务不存在。',
  OPERATOR_NOT_FOUND: '操作人不存在。',
  OPERATOR_DEACTIVATED: '操作人已停用，不能发起变更。',
  OPERATOR_NO_PERMISSION: '未获变更资格，不能代改负责人。',
  NO_CHANGE: '负责人未变化。',
  CANDIDATE_NOT_FOUND: '目标负责人不存在。',
  CANDIDATE_VIEWER: '观看角色不参与任务承接。',
  CANDIDATE_DEACTIVATED: '目标人员已停用，不能写回。',
}

function findPersonnel(personId) {
  return state.personnel.find((item) => item.id === personId) ?? null
}

function fail(code) {
  return { ok: false, code, message: ownerChangeMessages[code] }
}

function changeTaskOwner({ taskId, nextOwnerId, operatorId, note = '' }) {
  const task = state.tasks.find((item) => item.id === taskId)
  if (!task) return fail('TASK_NOT_FOUND')

  const operator = findPersonnel(operatorId)
  if (!operator) return fail('OPERATOR_NOT_FOUND')
  if (operator.status !== 'active') return fail('OPERATOR_DEACTIVATED')
  if (!operator.canReassign) return fail('OPERATOR_NO_PERMISSION')

  if (task.ownerId === nextOwnerId) return fail('NO_CHANGE')

  // 提交时重新读取目标人员的最新状态，而不是沿用打开页面时的快照，
  // 防止“选择之后对方被停用”的并发写回。
  const candidate = findPersonnel(nextOwnerId)
  if (!candidate) return fail('CANDIDATE_NOT_FOUND')
  if (candidate.role === 'viewer') return fail('CANDIDATE_VIEWER')
  if (candidate.status !== 'active') return fail('CANDIDATE_DEACTIVATED')

  // 先留痕再改派，历史任务的原负责人始终可查。
  const record = {
    id: `change-${state.ownerHistory.length + 1}`,
    taskId,
    fromOwnerId: task.ownerId,
    toOwnerId: nextOwnerId,
    operatorId,
    changedAt: new Date().toISOString(),
    note,
  }
  state.ownerHistory.push(record)
  task.ownerId = nextOwnerId

  return { ok: true, record }
}

export function useRestorationStore() {
  const tasksWithOwner = computed(() =>
    state.tasks.map((task) => ({
      ...task,
      ownerName: findPersonnel(task.ownerId)?.name ?? '未指派',
    })),
  )

  const ownerCandidates = computed(() =>
    state.personnel.map((person) => ({
      id: person.id,
      name: person.name,
      disabled: person.role === 'viewer' || person.status !== 'active',
      hint:
        person.role === 'viewer'
          ? '观看角色不参与承接'
          : person.status !== 'active'
            ? '已停用'
            : '',
    })),
  )

  const historyRecords = computed(() =>
    [...state.ownerHistory]
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
      .map((record) => ({
        ...record,
        taskTitle:
          state.tasks.find((task) => task.id === record.taskId)?.title ??
          record.taskId,
        fromOwnerName: findPersonnel(record.fromOwnerId)?.name ?? '未知',
        toOwnerName: findPersonnel(record.toOwnerId)?.name ?? '未知',
        operatorName: findPersonnel(record.operatorId)?.name ?? '未知',
      })),
  )

  return {
    personnel: state.personnel,
    tasks: state.tasks,
    tasksWithOwner,
    ownerCandidates,
    historyRecords,
    changeTaskOwner,
  }
}
