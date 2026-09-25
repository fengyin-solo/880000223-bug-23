import { computed } from 'vue'

import {
  restorationBatches,
  restorationEnvironment,
} from '../data/restorationData'
import { useRestorationBoard } from './useRestorationBoard'

export function useRestorationOverview() {
  const { openTaskCount, highRiskCount, ownerCount } = useRestorationBoard()

  const batchCount = computed(() => restorationBatches.length)
  const environmentCount = computed(() => restorationEnvironment.length)

  return {
    batchCount,
    openTaskCount,
    highRiskCount,
    environmentCount,
    ownerCount,
  }
}
