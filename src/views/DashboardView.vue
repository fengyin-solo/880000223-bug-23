<script setup>
import { computed } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import StatCard from '../components/common/StatCard.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import EnvironmentCards from '../components/restoration/EnvironmentCards.vue'
import HeroBanner from '../components/restoration/HeroBanner.vue'
import { restorationHero, restorationSteps } from '../data/restorationData'
import { useRestorationOverview } from '../composables/useRestorationOverview'
import { useRestorationBoard } from '../composables/useRestorationBoard'
import {
  roleMeta,
  statusMeta,
} from '../utils/restorationFormatters'

const {
  batchCount,
  openTaskCount,
  environmentCount,
  highRiskCount,
  ownerCount,
} = useRestorationOverview()

const { participantStaff, openTasks } = useRestorationBoard()

// 保持响应式：从任务列表返回看板时数量与负责人同步刷新
const statCards = computed(() => [
  { label: '在册批次', value: batchCount.value },
  { label: '在办任务', value: openTaskCount.value },
  { label: '高风险任务', value: highRiskCount.value },
  { label: '环境指标', value: environmentCount.value },
  { label: '参与修复师', value: ownerCount.value },
])

const participantRows = computed(() =>
  participantStaff.value.map((member) => {
    const owned = openTasks.value.filter((task) => task.ownerId === member.id)
    return {
      ...member,
      taskTitles: owned.map((task) => task.title),
      taskCount: owned.length,
    }
  }),
)
</script>

<template>
  <div class="view-stack">
    <HeroBanner :hero="restorationHero" />

    <section class="stats-grid">
      <StatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
      />
    </section>

    <PanelSection
      title="在办任务负责人"
      :badge="`参与修复师 ${ownerCount} 人 · 与任务清单同源`"
    >
      <div class="owner-grid">
        <article v-for="row in participantRows" :key="row.id" class="owner-card">
          <div class="owner-head">
            <strong>{{ row.name }}</strong>
            <span :class="['role-pill', `role-pill--${roleMeta(row.role).tone}`]">
              {{ roleMeta(row.role).label }}
            </span>
          </div>
          <p class="owner-meta">
            {{ statusMeta(row.active).label }} · 在办 {{ row.taskCount }} 项
          </p>
          <p v-for="title in row.taskTitles" :key="title" class="owner-task">
            {{ title }}
          </p>
        </article>
      </div>
    </PanelSection>

    <section class="two-column">
      <PanelSection title="重点批次" badge="优先处理">
        <BatchGrid :items="restorationBatches" />
      </PanelSection>

      <PanelSection title="当日工序" badge="修复流程">
        <ol class="step-list">
          <li v-for="step in restorationSteps" :key="step">{{ step }}</li>
        </ol>
      </PanelSection>
    </section>

    <PanelSection title="环境参数" badge="修复室 2">
      <EnvironmentCards :items="restorationEnvironment" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.owner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.owner-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: #f4ebda;
  border: 1px solid rgba(109, 80, 40, 0.08);
}

.owner-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.owner-head strong {
  font-size: 1.02rem;
}

.owner-meta,
.owner-task {
  margin: 8px 0 0;
  color: #6a5439;
  font-size: 0.84rem;
}

.owner-task {
  position: relative;
  padding-left: 14px;
}

.owner-task::before {
  content: '·';
  position: absolute;
  left: 4px;
}

.role-pill {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.74rem;
  white-space: nowrap;
}

.role-pill--high {
  background: #efd0c9;
  color: #913d2f;
}

.role-pill--medium {
  background: #f6e5b9;
  color: #8b6314;
}

.role-pill--low {
  background: #d9ead9;
  color: #366338;
}

.two-column {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
}

.step-list {
  margin: 0;
  padding-left: 20px;
  color: #5c4a33;
}

.step-list li + li {
  margin-top: 12px;
}

@media (max-width: 980px) {
  .two-column {
    grid-template-columns: 1fr;
  }
}
</style>
