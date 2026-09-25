<script setup>
import { reactive, watch } from 'vue'

import {
  eligibleForAssignment,
  formatHistoryDate,
  riskMeta,
  roleMeta,
  statusMeta,
} from '../../utils/restorationFormatters'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  staff: {
    type: Array,
    required: true,
  },
  assignableStaff: {
    type: Array,
    default: () => [],
  },
  pendingTaskIds: {
    type: Object,
    default: () => new Set(),
  },
  readonlyRows: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['reassign'])

// 每行各自记住改派目标；任务负责人变化后同步回最新负责人
const picks = reactive({})
watch(
  () => props.rows,
  (rows) => {
    for (const row of rows) {
      if (!picks[row.id]) picks[row.id] = row.ownerId
    }
  },
  { immediate: true, deep: true },
)

function previousOwners(row) {
  return row.ownerHistory.slice(0, -1)
}

function ownerMember(row) {
  return props.staff.find((member) => member.id === row.ownerId) ?? null
}

function ownerFlag(row) {
  const member = ownerMember(row)
  if (!member || eligibleForAssignment(member)) return ''
  return `（${statusMeta(member.active).label}）`
}

function isPending(row) {
  return props.pendingTaskIds.has(row.id)
}

function canSubmit(row) {
  return (
    !isPending(row) &&
    picks[row.id] &&
    picks[row.id] !== row.ownerId &&
    !!props.assignableStaff.find((member) => member.id === picks[row.id])
  )
}

function submitReassign(row) {
  emit('reassign', {
    taskId: row.id,
    targetId: picks[row.id],
    expectedVersion: row.version,
  })
}
</script>

<template>
  <div class="task-table">
    <div v-if="readonlyRows" class="task-row task-head task-grid--closed">
      <span>对象</span>
      <span>阶段</span>
      <span>风险</span>
      <span>负责人</span>
      <span>历任记录</span>
      <span>说明</span>
    </div>
    <div v-else class="task-row task-head task-grid--open">
      <span>对象</span>
      <span>阶段</span>
      <span>风险</span>
      <span>负责人</span>
      <span>说明</span>
      <span>变更负责人</span>
    </div>

    <div
      v-for="row in rows"
      :key="row.id"
      :class="[
        'task-row',
        readonlyRows ? 'task-grid--closed' : 'task-grid--open',
        { 'task-row--closed': readonlyRows },
      ]"
    >
      <span class="cell-title">{{ row.title }}</span>

      <span>
        {{ row.stage }}
        <small v-if="row.closedAt" class="closed-mark">
          封存于 {{ formatHistoryDate(row.closedAt) }}
        </small>
      </span>

      <span :class="['risk-tag', `risk-tag--${riskMeta(row.risk).tone}`]">
        {{ riskMeta(row.risk).label }}
      </span>

      <span class="cell-owner">
        <strong>{{ row.ownerName }}</strong>
        <small v-if="ownerFlag(row)" class="owner-flag">
          {{ ownerFlag(row) }}
        </small>
        <ul v-if="previousOwners(row).length" class="history-list">
          <li
            v-for="(entry, index) in previousOwners(row)"
            :key="`${row.id}-history-${index}`"
          >
            历任：{{ entry.ownerName }}｜{{ formatHistoryDate(entry.changedAt)
            }}｜{{ entry.reason }}（{{ entry.changedByName }}）
          </li>
        </ul>
      </span>

      <span class="cell-note">{{ row.note }}</span>

      <span v-if="readonlyRows" class="cell-readonly">
        <span class="seal-tag">已封存 · 只读</span>
      </span>

      <span v-else class="cell-action">
        <select v-model="picks[row.id]" :disabled="isPending(row)">
          <option
            v-for="member in assignableStaff"
            :key="member.id"
            :value="member.id"
          >
            {{ member.name }}（{{ roleMeta(member.role).label }}）
          </option>
        </select>
        <button
          type="button"
          class="reassign-btn"
          :disabled="!canSubmit(row)"
          @click="submitReassign(row)"
        >
          {{ isPending(row) ? '提交中…' : '变更' }}
        </button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.task-table {
  overflow: hidden;
  border: 1px solid rgba(79, 57, 32, 0.1);
  border-radius: 18px;
}

.task-row {
  display: grid;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.72);
  color: #5c4a33;
  font-size: 0.92rem;
}

.task-grid--open {
  grid-template-columns: 1.1fr 0.8fr 0.5fr 0.95fr 1.1fr 1.35fr;
}

.task-grid--closed {
  grid-template-columns: 1.1fr 0.8fr 0.5fr 0.8fr 1.6fr 1.1fr;
}

.task-row + .task-row {
  border-top: 1px solid rgba(79, 57, 32, 0.08);
}

.task-row--closed {
  background: rgba(244, 235, 218, 0.55);
}

.task-head {
  background: #efe1c6;
  color: #775936;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}

.cell-title {
  font-weight: 600;
}

.cell-owner strong {
  font-weight: 600;
}

.owner-flag {
  color: #913d2f;
}

.history-list {
  margin: 6px 0 0;
  padding-left: 16px;
  color: #82684b;
  font-size: 0.78rem;
  line-height: 1.5;
}

.closed-mark {
  display: block;
  margin-top: 4px;
  color: #82684b;
  font-size: 0.76rem;
}

.cell-action {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cell-action select {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid rgba(79, 57, 32, 0.18);
  border-radius: 10px;
  background: #fffaf0;
  color: #5c4a33;
  font-size: 0.86rem;
}

.reassign-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  background: #5d4322;
  color: #fff8eb;
  font-size: 0.86rem;
  cursor: pointer;
  white-space: nowrap;
}

.reassign-btn:disabled {
  background: rgba(93, 67, 34, 0.32);
  cursor: not-allowed;
}

.seal-tag {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e7ddca;
  color: #7e6038;
  font-size: 0.76rem;
  white-space: nowrap;
}

.risk-tag {
  display: inline-flex;
  justify-content: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
}

.risk-tag--high {
  background: #efd0c9;
  color: #913d2f;
}

.risk-tag--medium {
  background: #f6e5b9;
  color: #8b6314;
}

.risk-tag--low {
  background: #d9ead9;
  color: #366338;
}

@media (max-width: 1000px) {
  .task-table {
    overflow-x: auto;
  }

  .task-row {
    min-width: 920px;
  }
}
</style>
