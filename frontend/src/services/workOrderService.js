import { createResourceService } from './createResourceService'
import { workOrders } from '../data/mockData'

// Future endpoints: GET/POST /api/work-orders, PUT/DELETE /api/work-orders/{id}
export const workOrderService = createResourceService('work-orders', workOrders)
