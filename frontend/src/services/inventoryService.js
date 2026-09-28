import { createResourceService } from './createResourceService'
import { inventory } from '../data/mockData'

// Future endpoints: GET/POST /api/inventory, PUT/DELETE /api/inventory/{id}
export const inventoryService = createResourceService('inventory', inventory)
