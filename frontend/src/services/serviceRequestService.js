import { createResourceService } from './createResourceService'
import { serviceRequests } from '../data/mockData'

// Future endpoints: GET/POST /api/service-requests, PUT/DELETE /api/service-requests/{id}
export const serviceRequestService = createResourceService('service-requests', serviceRequests)
