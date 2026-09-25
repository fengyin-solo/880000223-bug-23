import { computed } from 'vue'

import {
  restorationBatches,
  restorationEnvironment,
} from '../data/restorationData'
import { useRestorationStore } from '../stores/restorationStore'

export function useRestorationOverview() {
  const { tasks } = useRestorationStore()

  const batchCount = computed(() => restorationBatches.length)
  const highRiskCount = computed(
    () => tasks.filter((item) => item.risk === 'high').length,
  )
  const environmentCount = computed(() => restorationEnvironment.length)
  // 按人员 id 去重，同名不同人不会漏算，同人多次出现不会重复计。
  const ownerCount = computed(
    () => new Set(tasks.map((item) => item.ownerId)).size,
  )

  return {
    batchCount,
    highRiskCount,
    environmentCount,
    ownerCount,
  }
}
