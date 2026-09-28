import { createResourceService } from './createResourceService'
import { technicians } from '../data/mockData'

// Future endpoints: GET/POST /api/technicians, PUT/DELETE /api/technicians/{id}
export const technicianService = createResourceService('technicians', technicians)
