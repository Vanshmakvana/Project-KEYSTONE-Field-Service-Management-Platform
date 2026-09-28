package com.keystone.controller;

import com.keystone.entity.enums.WorkOrderStatus;
import com.keystone.repository.ServiceRequestRepository;
import com.keystone.repository.WorkOrderRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/** Report field names match src/services/reportService.js in the React project. */
@RestController
@RequestMapping("/api/reports")
@Transactional(readOnly = true)
public class ReportController {

    private final WorkOrderRepository workOrders;
    private final ServiceRequestRepository serviceRequests;

    public ReportController(WorkOrderRepository workOrders,
                            ServiceRequestRepository serviceRequests) {
        this.workOrders = workOrders;
        this.serviceRequests = serviceRequests;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('MANAGER')")
    public Map<String, Object> summary() {
        long completed = workOrders.countByStatus(WorkOrderStatus.COMPLETED)
                + workOrders.countByStatus(WorkOrderStatus.CLOSED);
        long pending = workOrders.countByStatus(WorkOrderStatus.NEW)
                + workOrders.countByStatus(WorkOrderStatus.ASSIGNED)
                + workOrders.countByStatus(WorkOrderStatus.IN_PROGRESS)
                + workOrders.countByStatus(WorkOrderStatus.ON_HOLD);
        long closed = workOrders.countClosed();
        long compliant = workOrders.countSlaCompliant();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalWorkOrders", workOrders.count());
        result.put("completed", completed);
        result.put("pending", pending);
        result.put("overdue", workOrders.countOverdue(LocalDateTime.now()));
        result.put("slaCompliance", closed == 0 ? 100.0 : Math.round((compliant * 10000.0 / closed)) / 100.0);
        result.put("totalRequests", serviceRequests.count());
        return result;
    }
}
