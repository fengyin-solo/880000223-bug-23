<script setup>
import { riskMeta } from '../../utils/restorationFormatters'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  candidates: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['change-owner'])

function onOwnerChange(taskId, event) {
  emit('change-owner', { taskId, nextOwnerId: event.target.value })
  // 若变更被规则拒绝，父级不会更新 ownerId，这里把选择器重置回当前负责人。
  const current = props.rows.find((row) => row.id === taskId)
  event.target.value = current?.ownerId ?? ''
}
</script>

<template>
  <div class="task-table">
    <div class="task-row task-head">
      <span>对象</span>
      <span>阶段</span>
      <span>风险</span>
      <span>负责人</span>
      <span>说明</span>
    </div>
    <div v-for="row in rows" :key="row.id" class="task-row">
      <span>{{ row.title }}</span>
      <span>{{ row.stage }}</span>
      <span :class="['risk-tag', `risk-tag--${riskMeta(row.risk).tone}`]">
        {{ riskMeta(row.risk).label }}
      </span>
      <span class="owner-cell">
        <select
          class="owner-select"
          :value="row.ownerId"
          :aria-label="`${row.title} 负责人`"
          @change="onOwnerChange(row.id, $event)"
        >
          <option
            v-for="candidate in candidates"
            :key="candidate.id"
            :value="candidate.id"
            :disabled="candidate.disabled"
          >
            {{ candidate.name }}{{ candidate.hint ? `（${candidate.hint}）` : '' }}
          </option>
        </select>
      </span>
      <span>{{ row.note }}</span>
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
  grid-template-columns: 1.2fr 0.8fr 0.6fr 0.7fr 1.3fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.72);
}

.task-row + .task-row {
  border-top: 1px solid rgba(79, 57, 32, 0.08);
}

.task-head {
  background: #efe1c6;
  color: #775936;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
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

.owner-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid rgba(79, 57, 32, 0.2);
  border-radius: 10px;
  background: #fffaf0;
  color: #4f3920;
  font: inherit;
}

.owner-select:focus-visible {
  outline: 2px solid #b98a3c;
  outline-offset: 1px;
}

@media (max-width: 900px) {
  .task-table {
    overflow-x: auto;
  }

  .task-row {
    min-width: 780px;
  }
}
</style>
