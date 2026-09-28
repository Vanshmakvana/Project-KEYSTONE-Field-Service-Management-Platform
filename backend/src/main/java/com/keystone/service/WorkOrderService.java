package com.keystone.service;

import com.keystone.dto.*;
import com.keystone.entity.*;
import com.keystone.entity.enums.Priority;
import com.keystone.entity.enums.Role;
import com.keystone.entity.enums.WorkOrderStatus;
import com.keystone.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Core business logic for work-order lifecycle management.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Create work orders with auto-generated code and SLA</li>
 *   <li>State machine transitions with audit trail</li>
 *   <li>Technician assignment</li>
 *   <li>Transactional part usage with stock deduction</li>
 *   <li>Time logging</li>
 * </ul>
 */
@Service
@Transactional
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository statusHistoryRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final PartRepository partRepository;
    private final PartUsageRepository partUsageRepository;
    private final TimeLogRepository timeLogRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                            WorkOrderStatusHistoryRepository statusHistoryRepository,
                            CustomerRepository customerRepository,
                            SiteRepository siteRepository,
                            UserRepository userRepository,
                            PartRepository partRepository,
                            PartUsageRepository partUsageRepository,
                            TimeLogRepository timeLogRepository) {
        this.workOrderRepository = workOrderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.userRepository = userRepository;
        this.partRepository = partRepository;
        this.partUsageRepository = partUsageRepository;
        this.timeLogRepository = timeLogRepository;
    }

    // ═══════════════════════════════════════════════════════════
    //  CREATE
    // ═══════════════════════════════════════════════════════════

    /**
     * Creates a new work order with auto-generated code (WO-YYYYMMDD-NNN) and
     * SLA deadline based on priority.
     */
    public WorkOrderResponse createWorkOrder(WorkOrderCreateRequest request, String createdByEmail) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer not found: " + request.customerId()));

        Site site = siteRepository.findById(request.siteId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Site not found: " + request.siteId()));

        String code = generateWorkOrderCode();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime slaDueAt = calculateSla(request.priority(), now);

        WorkOrder workOrder = WorkOrder.builder()
                .code(code)
                .title(request.title())
                .description(request.description())
                .priority(request.priority())
                .status(WorkOrderStatus.NEW)
                .slaDueAt(slaDueAt)
                .customer(customer)
                .site(site)
                .build();

        workOrder = workOrderRepository.save(workOrder);

        // Record initial status in audit trail
        recordStatusChange(workOrder, null, WorkOrderStatus.NEW, createdByEmail,
                "Work order created");

        return toResponse(workOrder);
    }

    // ═══════════════════════════════════════════════════════════
    //  STATE MACHINE — TRANSITION STATUS
    // ═══════════════════════════════════════════════════════════

    /**
     * Transitions a work order to the given target status.
     *
     * @throws IllegalStateException if the transition is not allowed
     *         (results in HTTP 409 Conflict via GlobalExceptionHandler)
     */
    public WorkOrderResponse transitionStatus(Long workOrderId,
                                               StatusTransitionRequest request,
                                               String changedByEmail) {
        WorkOrder workOrder = findWorkOrderOrThrow(workOrderId);
        WorkOrderStatus currentStatus = workOrder.getStatus();
        WorkOrderStatus targetStatus = request.targetStatus();

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(String.format(
                    "Illegal status transition: %s → %s. Allowed transitions from %s: %s",
                    currentStatus, targetStatus, currentStatus,
                    currentStatus.allowedNextStates()));
        }

        workOrder.setStatus(targetStatus);
        workOrder = workOrderRepository.save(workOrder);

        recordStatusChange(workOrder, currentStatus, targetStatus,
                changedByEmail, request.notes());

        return toResponse(workOrder);
    }

    // ═══════════════════════════════════════════════════════════
    //  ASSIGN TECHNICIAN
    // ═══════════════════════════════════════════════════════════

    /**
     * Assigns a technician to a work order and transitions status to ASSIGNED.
     */
    public WorkOrderResponse assignTechnician(Long workOrderId,
                                               AssignTechnicianRequest request,
                                               String assignedByEmail) {
        WorkOrder workOrder = findWorkOrderOrThrow(workOrderId);

        User technician = userRepository.findByIdAndRole(request.technicianId(), Role.TECHNICIAN)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Technician not found with ID: " + request.technicianId()));

        WorkOrderStatus currentStatus = workOrder.getStatus();
        WorkOrderStatus targetStatus = WorkOrderStatus.ASSIGNED;

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(String.format(
                    "Cannot assign technician: work order is in %s status. " +
                    "Only work orders in NEW status can be assigned.", currentStatus));
        }

        workOrder.setAssignedTo(technician);
        workOrder.setStatus(targetStatus);
        workOrder = workOrderRepository.save(workOrder);

        recordStatusChange(workOrder, currentStatus, targetStatus, assignedByEmail,
                "Assigned to technician: " + technician.getName());

        return toResponse(workOrder);
    }

    // ═══════════════════════════════════════════════════════════
    //  PART USAGE (TRANSACTIONAL STOCK DEDUCTION)
    // ═══════════════════════════════════════════════════════════

    /**
     * Logs part usage and deducts from inventory.
     * If stock is insufficient, the entire transaction rolls back.
     */
    @Transactional
    public void logPartUsage(Long workOrderId, PartUsageRequest request) {
        WorkOrder workOrder = findWorkOrderOrThrow(workOrderId);

        Part part = partRepository.findById(request.partId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Part not found: " + request.partId()));

        if (part.getStockQty() < request.qtyUsed()) {
            throw new RuntimeException(String.format(
                    "Insufficient stock for part '%s' (SKU: %s). " +
                    "Available: %d, Requested: %d",
                    part.getName(), part.getSku(),
                    part.getStockQty(), request.qtyUsed()));
        }

        // Deduct stock
        part.setStockQty(part.getStockQty() - request.qtyUsed());
        partRepository.save(part);

        // Record usage
        PartUsage usage = PartUsage.builder()
                .workOrder(workOrder)
                .part(part)
                .qtyUsed(request.qtyUsed())
                .build();
        partUsageRepository.save(usage);
    }

    // ═══════════════════════════════════════════════════════════
    //  TIME LOGGING
    // ═══════════════════════════════════════════════════════════

    /**
     * Logs time worked by a technician on a work order.
     */
    public void logTime(Long workOrderId, TimeLogRequest request) {
        WorkOrder workOrder = findWorkOrderOrThrow(workOrderId);

        User technician = userRepository.findByIdAndRole(request.technicianId(), Role.TECHNICIAN)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Technician not found: " + request.technicianId()));

        TimeLog timeLog = TimeLog.builder()
                .workOrder(workOrder)
                .technician(technician)
                .minutes(request.minutes())
                .note(request.note())
                .build();
        timeLogRepository.save(timeLog);
    }

    // ═══════════════════════════════════════════════════════════
    //  QUERIES
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Page<WorkOrderResponse> getWorkOrders(WorkOrderStatus status,
                                                  Priority priority,
                                                  Long assignedToId,
                                                  Long customerId,
                                                  Pageable pageable) {
        return workOrderRepository
                .findWithFilters(status, priority, assignedToId, customerId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public WorkOrderResponse getWorkOrderById(Long id) {
        return toResponse(findWorkOrderOrThrow(id));
    }

    @Transactional(readOnly = true)
    public ReportSummaryResponse getReportSummary() {
        LocalDateTime now = LocalDateTime.now();

        long total = workOrderRepository.count();
        long newCount = workOrderRepository.countByStatus(WorkOrderStatus.NEW);
        long assignedCount = workOrderRepository.countByStatus(WorkOrderStatus.ASSIGNED);
        long inProgressCount = workOrderRepository.countByStatus(WorkOrderStatus.IN_PROGRESS);
        long onHoldCount = workOrderRepository.countByStatus(WorkOrderStatus.ON_HOLD);
        long completedCount = workOrderRepository.countByStatus(WorkOrderStatus.COMPLETED);
        long closedCount = workOrderRepository.countByStatus(WorkOrderStatus.CLOSED);
        long cancelledCount = workOrderRepository.countByStatus(WorkOrderStatus.CANCELLED);
        long overdueCount = workOrderRepository.countOverdue(now);

        long totalClosed = workOrderRepository.countClosed();
        long slaCompliant = workOrderRepository.countSlaCompliant();
        double slaCompliancePercentage = totalClosed > 0
                ? (slaCompliant * 100.0) / totalClosed
                : 100.0;

        return new ReportSummaryResponse(
                total, newCount, assignedCount, inProgressCount, onHoldCount,
                completedCount, closedCount, cancelledCount, overdueCount,
                Math.round(slaCompliancePercentage * 100.0) / 100.0
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════

    private WorkOrder findWorkOrderOrThrow(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Work order not found: " + id));
    }

    /**
     * Generates a unique work order code: WO-YYYYMMDD-NNN
     */
    private String generateWorkOrderCode() {
        String datePrefix = "WO-" + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        long seq = workOrderRepository.countByCodePrefix(datePrefix) + 1;
        return datePrefix + String.format("%03d", seq);
    }

    /**
     * Calculates the SLA deadline based on priority.
     * CRITICAL = 2h, HIGH = 4h, MEDIUM = 24h, LOW = 48h.
     */
    private LocalDateTime calculateSla(Priority priority, LocalDateTime createdAt) {
        return switch (priority) {
            case CRITICAL -> createdAt.plusHours(2);
            case HIGH     -> createdAt.plusHours(4);
            case MEDIUM   -> createdAt.plusHours(24);
            case LOW      -> createdAt.plusHours(48);
        };
    }

    /**
     * Appends an audit row to the status history table.
     */
    private void recordStatusChange(WorkOrder workOrder,
                                     WorkOrderStatus fromStatus,
                                     WorkOrderStatus toStatus,
                                     String changedBy,
                                     String notes) {
        WorkOrderStatusHistory history = WorkOrderStatusHistory.builder()
                .workOrder(workOrder)
                .fromStatus(fromStatus != null ? fromStatus.name() : null)
                .toStatus(toStatus.name())
                .changedBy(changedBy)
                .changedAt(LocalDateTime.now())
                .notes(notes)
                .build();
        statusHistoryRepository.save(history);
    }

    /**
     * Maps a WorkOrder entity to its response DTO.
     */
    private WorkOrderResponse toResponse(WorkOrder wo) {
        return new WorkOrderResponse(
                wo.getId(),
                wo.getCode(),
                wo.getTitle(),
                wo.getDescription(),
                wo.getPriority(),
                wo.getStatus(),
                wo.getSlaDueAt(),
                wo.getCustomer().getId(),
                wo.getCustomer().getName(),
                wo.getSite().getId(),
                wo.getSite().getName(),
                wo.getAssignedTo() != null ? wo.getAssignedTo().getId() : null,
                wo.getAssignedTo() != null ? wo.getAssignedTo().getName() : null,
                wo.getCreatedAt(),
                wo.getUpdatedAt()
        );
    }
}
