<script setup>
import { computed, reactive } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import TaskTable from '../components/restoration/TaskTable.vue'
import { useRestorationBoard } from '../composables/useRestorationBoard'
import {
  roleMeta,
  statusMeta,
} from '../utils/restorationFormatters'

const {
  state,
  staff,
  openTasks,
  closedTasks,
  assignableStaff,
  findStaff,
  changeTaskOwner,
} = useRestorationBoard()

const form = reactive({
  operatorId: 'S-01',
  reason: '',
})

const feedback = reactive({ visible: false, ok: false, message: '' })

const pendingTaskIds = computed(() => state.pendingTaskIds ?? new Set())

const operator = computed(() => findStaff(form.operatorId))

const operatorHint = computed(() => {
  const member = operator.value
  if (!member) return ''
  if (!member.active) return statusMeta(false).label + '人员不能发起变更。'
  if (member.role !== 'lead') return roleMeta(member.role).label + '没有变更资格，仅修复负责人可改派。'
  return roleMeta(member.role).label + '在岗，可发起负责人变更。'
})

async function handleReassign({ taskId, targetId, expectedVersion }) {
  const result = await changeTaskOwner({
    taskId,
    operatorId: form.operatorId,
    targetId,
    expectedVersion,
    reason: form.reason,
  })

  feedback.visible = true
  feedback.ok = result.ok
  feedback.message = result.message
}
</script>

<template>
  <div class="view-stack">
    <PanelSection title="变更工作台" badge="统一传播规则">
      <div class="reassign-bar">
        <label class="bar-field">
          <span>当前操作人</span>
          <select v-model="form.operatorId">
            <option v-for="member in staff" :key="member.id" :value="member.id">
              {{ member.name }}（{{ roleMeta(member.role).label }}·{{
                statusMeta(member.active).label
              }}）
            </option>
          </select>
        </label>
        <label class="bar-field bar-field--reason">
          <span>交接事由</span>
          <input
            v-model="form.reason"
            type="text"
            placeholder="如：休假交接、工序调整"
          />
        </label>
        <p
          :class="[
            'bar-hint',
            operator?.role === 'lead' && operator?.active
              ? 'bar-hint--ok'
              : 'bar-hint--block',
          ]"
        >
          {{ operatorHint }}
        </p>
      </div>
      <p v-if="feedback.visible" :class="['feedback', feedback.ok ? 'feedback--ok' : 'feedback--error']">
        {{ feedback.message }}
      </p>
    </PanelSection>

    <PanelSection title="在办任务" :badge="`共 ${openTasks.length} 项`">
      <TaskTable
        :rows="openTasks"
        :staff="staff"
        :assignable-staff="assignableStaff"
        :pending-task-ids="pendingTaskIds"
        @reassign="handleReassign"
      />
    </PanelSection>

    <PanelSection title="历史任务" :badge="`已封存 ${closedTasks.length} 项 · 只读`">
      <TaskTable
        :rows="closedTasks"
        :staff="staff"
        :assignable-staff="assignableStaff"
        :pending-task-ids="pendingTaskIds"
        readonly-rows
      />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.reassign-bar {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(220px, 1.2fr);
  gap: 14px 18px;
  align-items: end;
}

.bar-field {
  display: grid;
  gap: 8px;
  color: #775936;
  font-size: 0.82rem;
}

.bar-field select,
.bar-field input {
  padding: 10px 12px;
  border: 1px solid rgba(79, 57, 32, 0.18);
  border-radius: 12px;
  background: #fffaf0;
  color: #5c4a33;
  font-size: 0.9rem;
}

.bar-hint {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.84rem;
}

.bar-hint--ok {
  color: #366338;
}

.bar-hint--block {
  color: #913d2f;
}

.feedback {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 0.88rem;
}

.feedback--ok {
  background: #d9ead9;
  color: #366338;
}

.feedback--error {
  background: #efd0c9;
  color: #913d2f;
}

@media (max-width: 720px) {
  .reassign-bar {
    grid-template-columns: 1fr;
  }
}
</style>
