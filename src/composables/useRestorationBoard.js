import { computed, reactive, readonly } from 'vue'

import {
  restorationBatches,
  restorationEnvironment,
  restorationStaff,
  restorationTasks,
} from '../data/restorationData'
import { eligibleForAssignment } from '../utils/restorationFormatters'

// 模块级单例状态：任务列表与工作台看板共用同一份数据，
// 负责人变更在这里统一校验、统一传播，避免两处口径不一致。
const state = reactive({
  staff: restorationStaff.map((member) => ({ ...member })),
  tasks: restorationTasks.map((task) => ({
    ...task,
    ownerHistory: task.ownerHistory.map((entry) => ({ ...entry })),
  })),
  // 正在执行写操作的任务 id，防止同一任务被并发写回
  pendingTaskIds: new Set(),
})

const batches = restorationBatches
const environment = restorationEnvironment

const openTasks = computed(() => state.tasks.filter((task) => !task.closedAt))
const closedTasks = computed(() => state.tasks.filter((task) => task.closedAt))

const activeStaff = computed(() => state.staff.filter((member) => member.active))

// 可承接在办任务的人员：在岗的修复负责人 / 修复师，排除观看角色与停用人员
const assignableStaff = computed(() =>
  state.staff.filter((member) => eligibleForAssignment(member)),
)

// 参与修复师：在办任务的现任负责人去重，停用人员不计入
const participantStaff = computed(() => {
  const byId = new Map()
  for (const task of openTasks.value) {
    const member = state.staff.find((item) => item.id === task.ownerId)
    if (!member || !member.active) continue
    if (eligibleForAssignment(member) && !byId.has(member.id)) {
      byId.set(member.id, member)
    }
  }
  return [...byId.values()]
})

const openTaskCount = computed(() => openTasks.value.length)
const highRiskCount = computed(
  () => openTasks.value.filter((task) => task.risk === 'high').length,
)
const ownerCount = computed(() => participantStaff.value.length)

function findStaff(memberId) {
  return state.staff.find((member) => member.id === memberId) ?? null
}

function findTask(taskId) {
  return state.tasks.find((task) => task.id === taskId) ?? null
}

function waitForWriteTurn() {
  return new Promise((resolve) => {
    // 留出一个宏任务窗口，让并发提交先撞上 in-flight 锁或版本复检
    setTimeout(resolve, 120)
  })
}

const CODE_MESSAGES = {
  OPERATOR_NOT_FOUND: '操作人员不存在，变更已中止。',
  OPERATOR_INACTIVE: '操作人员已停用，不能代办负责人变更。',
  OPERATOR_NOT_QUALIFIED:
    '只有修复负责人才有变更资格，观看角色与修复师不能代改负责人。',
  TASK_NOT_FOUND: '任务不存在，负责人未变更。',
  TASK_CLOSED: '该任务已封存，历史任务负责人不可修改。',
  TASK_INFLIGHT: '该任务正在处理上一次变更，请勿重复提交。',
  TARGET_NOT_FOUND: '目标人员不存在，负责人未变更。',
  TARGET_INACTIVE: '目标人员已停用，不能再被写回为负责人。',
  TARGET_VIEWER: '观看角色不参与任务承接，请改派修复师或修复负责人。',
  TARGET_SAME: '该任务当前已由此人负责，无需重复变更。',
  VERSION_CONFLICT: '负责人已被其他操作更新，请刷新后基于最新负责人再提交。',
  OPERATOR_DISABLED_DURING_WRITE: '操作人员在提交期间被停用，变更已回滚。',
  TARGET_DISABLED_DURING_WRITE: '目标人员在提交期间被停用，变更已回滚。',
}

function fail(code) {
  return { ok: false, code, message: CODE_MESSAGES[code] ?? '变更失败。' }
}

/**
 * 统一的负责人变更入口。
 * 规则：
 * - 仅修复负责人（lead）可发起；观看角色不能代改；
 * - 目标必须是在岗的修复负责人 / 修复师，观看角色不承接任务，停用人员不可写回；
 * - 已封存的历史任务只读；
 * - 同一任务串行写入（in-flight 锁 + version 乐观锁），并发提交会被拒绝；
 * - 历任负责人写入 ownerHistory 永久保留，停用后姓名仍可查。
 */
export async function changeTaskOwner({
  taskId,
  operatorId,
  targetId,
  expectedVersion,
  reason = '负责人变更',
}) {
  const operator = findStaff(operatorId)
  if (!operator) return fail('OPERATOR_NOT_FOUND')
  if (!operator.active) return fail('OPERATOR_INACTIVE')
  if (operator.role !== 'lead') return fail('OPERATOR_NOT_QUALIFIED')

  if (state.pendingTaskIds.has(taskId)) return fail('TASK_INFLIGHT')

  const task = findTask(taskId)
  if (!task) return fail('TASK_NOT_FOUND')
  if (task.closedAt) return fail('TASK_CLOSED')

  const target = findStaff(targetId)
  if (!target) return fail('TARGET_NOT_FOUND')
  if (!target.active) return fail('TARGET_INACTIVE')
  if (target.role === 'viewer') return fail('TARGET_VIEWER')
  if (target.id === task.ownerId) return fail('TARGET_SAME')

  if (typeof expectedVersion === 'number' && task.version !== expectedVersion) {
    return fail('VERSION_CONFLICT')
  }

  state.pendingTaskIds.add(taskId)
  try {
    await waitForWriteTurn()

    // 写入窗口后复检，覆盖等待期间发生的停用、并发改派
    if (!findStaff(operatorId)?.active) {
      return fail('OPERATOR_DISABLED_DURING_WRITE')
    }
    const latestTask = findTask(taskId)
    if (!latestTask || latestTask.closedAt) return fail('TASK_CLOSED')
    if (latestTask.version !== expectedVersion) {
      return fail('VERSION_CONFLICT')
    }
    const latestTarget = findStaff(targetId)
    if (!latestTarget) return fail('TARGET_NOT_FOUND')
    if (!latestTarget.active) return fail('TARGET_DISABLED_DURING_WRITE')
    if (latestTarget.role === 'viewer') return fail('TARGET_VIEWER')

    latestTask.ownerId = latestTarget.id
    latestTask.ownerName = latestTarget.name
    latestTask.version += 1
    latestTask.ownerHistory.push({
      ownerId: latestTarget.id,
      ownerName: latestTarget.name,
      changedAt: new Date().toISOString(),
      changedByName: operator.name,
      reason: reason.trim() || '负责人变更',
    })

    return {
      ok: true,
      taskId: latestTask.id,
      ownerName: latestTask.ownerName,
      version: latestTask.version,
      message: `「${latestTask.title}」负责人已变更为 ${latestTarget.name}。`,
    }
  } finally {
    state.pendingTaskIds.delete(taskId)
  }
}

function cloneSeed() {
  return {
    staff: restorationStaff.map((member) => ({ ...member })),
    tasks: restorationTasks.map((task) => ({
      ...task,
      ownerHistory: task.ownerHistory.map((entry) => ({ ...entry })),
    })),
  }
}

// 供演示/测试回到初始口径
export function resetRestorationBoard() {
  const seed = cloneSeed()
  state.staff.splice(0, state.staff.length, ...seed.staff)
  state.tasks.splice(0, state.tasks.length, ...seed.tasks)
  state.pendingTaskIds.clear()
}

export function useRestorationBoard() {
  const readonlyState = readonly(state)

  return {
    state: readonlyState,
    batches,
    environment,
    staff: computed(() => readonlyState.staff),
    tasks: computed(() => readonlyState.tasks),
    openTasks,
    closedTasks,
    activeStaff,
    assignableStaff,
    participantStaff,
    openTaskCount,
    highRiskCount,
    ownerCount,
    findStaff,
    changeTaskOwner,
  }
}
