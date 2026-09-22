package com.keystone.controller;

import com.keystone.dto.*;
import com.keystone.entity.enums.Priority;
import com.keystone.entity.enums.WorkOrderStatus;
import com.keystone.service.WorkOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/work-orders")
@Tag(name = "Work Orders", description = "Work order lifecycle, technician assignment, parts & time tracking")
@SecurityRequirement(name = "bearerAuth")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @GetMapping
    @Operation(summary = "Get paginated work orders with optional filtering",
            description = "Supports filtering by status, priority, technician, or customer ID.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved work orders")
    public ResponseEntity<Page<WorkOrderResponse>> getWorkOrders(
            @RequestParam(required = false) WorkOrderStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(workOrderService.getWorkOrders(status, priority, assignedToId, customerId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get work order by ID")
    @ApiResponse(responseCode = "200", description = "Work order found")
    @ApiResponse(responseCode = "404", description = "Work order not found")
    public ResponseEntity<WorkOrderResponse> getWorkOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.getWorkOrderById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DISPATCHER', 'MANAGER', 'CUSTOMER')")
    @Operation(summary = "Create a new work order",
            description = "Creates a work order in NEW status with auto-calculated SLA based on priority.")
    @ApiResponse(responseCode = "201", description = "Work order created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request payload")
    public ResponseEntity<WorkOrderResponse> createWorkOrder(
            @Valid @RequestBody WorkOrderCreateRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        WorkOrderResponse response = workOrderService.createWorkOrder(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('DISPATCHER', 'MANAGER')")
    @Operation(summary = "Assign technician to work order",
            description = "Assigns a technician to a NEW work order and transitions status to ASSIGNED.")
    @ApiResponse(responseCode = "200", description = "Technician assigned successfully")
    @ApiResponse(responseCode = "409", description = "Illegal status transition or invalid role")
    public ResponseEntity<WorkOrderResponse> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody AssignTechnicianRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(workOrderService.assignTechnician(id, request, userEmail));
    }

    @PostMapping("/{id}/status")
    @Operation(summary = "Transition work order status",
            description = "Transitions work order status according to state machine rules and writes an audit log.")
    @ApiResponse(responseCode = "200", description = "Status transitioned successfully")
    @ApiResponse(responseCode = "409", description = "Illegal status transition")
    public ResponseEntity<WorkOrderResponse> transitionStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusTransitionRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(workOrderService.transitionStatus(id, request, userEmail));
    }

    @PostMapping("/{id}/parts")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'MANAGER')")
    @Operation(summary = "Log part usage",
            description = "Deducts parts from stock inventory. Rolls back if stock is insufficient.")
    @ApiResponse(responseCode = "200", description = "Part usage logged and stock updated")
    @ApiResponse(responseCode = "400", description = "Insufficient stock or invalid request")
    public ResponseEntity<Void> logPartUsage(
            @PathVariable Long id,
            @Valid @RequestBody PartUsageRequest request
    ) {
        workOrderService.logPartUsage(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/time")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'MANAGER')")
    @Operation(summary = "Log time spent on work order",
            description = "Records technician minutes spent on a work order.")
    @ApiResponse(responseCode = "200", description = "Time logged successfully")
    public ResponseEntity<Void> logTime(
            @PathVariable Long id,
            @Valid @RequestBody TimeLogRequest request
    ) {
        workOrderService.logTime(id, request);
        return ResponseEntity.ok().build();
    }
}
