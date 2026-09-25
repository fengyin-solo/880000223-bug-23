<script setup>
import { ref } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import TaskTable from '../components/restoration/TaskTable.vue'
import { useRestorationStore } from '../stores/restorationStore'
import { formatChangeTime } from '../utils/restorationFormatters'

const {
  personnel,
  tasksWithOwner,
  ownerCandidates,
  historyRecords,
  changeTaskOwner,
} = useRestorationStore()

const currentOperatorId = ref('p-hanche')
const feedback = ref(null)

function operatorHint(person) {
  if (person.role === 'viewer') return '观看角色'
  if (person.status !== 'active') return '已停用'
  return person.canReassign ? '可变更' : '无变更资格'
}

function handleOwnerChange({ taskId, nextOwnerId }) {
  const result = changeTaskOwner({
    taskId,
    nextOwnerId,
    operatorId: currentOperatorId.value,
  })
  feedback.value = result.ok
    ? { type: 'success', text: '负责人已更新，任务清单与工作台看板同步刷新。' }
    : { type: 'error', text: result.message }
}
</script>

<template>
  <div class="view-stack">
    <PanelSection title="任务清单" badge="按风险排序">
      <div class="operator-bar">
        <label class="operator-label" for="operator-select">当前操作人</label>
        <select
          id="operator-select"
          v-model="currentOperatorId"
          class="operator-select"
        >
          <option
            v-for="person in personnel"
            :key="person.id"
            :value="person.id"
          >
            {{ person.name }}（{{ operatorHint(person) }}）
          </option>
        </select>
        <p v-if="feedback" :class="['feedback', `feedback--${feedback.type}`]">
          {{ feedback.text }}
        </p>
      </div>
      <TaskTable
        :rows="tasksWithOwner"
        :candidates="ownerCandidates"
        @change-owner="handleOwnerChange"
      />
    </PanelSection>

    <PanelSection title="负责人变更记录" badge="原负责人可查">
      <ul class="history-list">
        <li v-for="record in historyRecords" :key="record.id" class="history-item">
          <div class="history-line">
            <span class="history-task">{{ record.taskTitle }}</span>
            <span>{{ record.fromOwnerName }} → {{ record.toOwnerName }}</span>
            <span>操作人 {{ record.operatorName }}</span>
            <time :datetime="record.changedAt">
              {{ formatChangeTime(record.changedAt) }}
            </time>
          </div>
          <p v-if="record.note" class="history-note">{{ record.note }}</p>
        </li>
      </ul>
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.operator-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.operator-label {
  color: #775936;
  font-size: 0.86rem;
}

.operator-select {
  padding: 8px 10px;
  border: 1px solid rgba(79, 57, 32, 0.2);
  border-radius: 10px;
  background: #fffaf0;
  color: #4f3920;
  font: inherit;
}

.feedback {
  margin: 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.86rem;
}

.feedback--success {
  background: #d9ead9;
  color: #366338;
}

.feedback--error {
  background: #efd0c9;
  color: #913d2f;
}

.history-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history-item {
  padding: 12px 16px;
  border: 1px solid rgba(79, 57, 32, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.history-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: #5c4a33;
}

.history-task {
  font-weight: 600;
  color: #4f3920;
}

.history-note {
  margin: 8px 0 0;
  color: #775936;
  font-size: 0.86rem;
}
</style>
