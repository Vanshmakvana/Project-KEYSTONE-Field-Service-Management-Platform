import { USE_REAL_API, api, mockDelay } from './api'
import { workOrders, serviceRequests, technicianPerformance, workOrderTrend } from '../data/mockData'

// Future endpoint: GET /api/reports/summary
async function summaryMock() {
  await mockDelay(400)
  const completed = workOrders.filter((w) => w.status === 'Completed').length
  const pending = workOrders.filter((w) => w.status === 'Pending' || w.status === 'In Progress').length
  const overdue = workOrders.filter((w) => w.status === 'SLA At Risk').length
  return {
    totalWorkOrders: workOrders.length,
    completed,
    pending,
    overdue,
    slaCompliance: 94.8,
    totalRequests: serviceRequests.length,
    technicianPerformance,
    workOrderTrend,
  }
}

export const reportService = {
  summary: () => (USE_REAL_API ? api.get('/reports/summary') : summaryMock()),
}
