import { createResourceService } from './createResourceService'
import { customers } from '../data/mockData'

// Future endpoints: GET/POST /api/customers, PUT/DELETE /api/customers/{id}
export const customerService = createResourceService('customers', customers)
