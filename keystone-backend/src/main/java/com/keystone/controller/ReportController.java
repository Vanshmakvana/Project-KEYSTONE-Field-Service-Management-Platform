package com.keystone.controller;

import com.keystone.dto.ReportSummaryResponse;
import com.keystone.service.WorkOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Manager reporting and analytics endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final WorkOrderService workOrderService;

    public ReportController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Get executive summary report",
            description = "Returns counts by status, overdue count, and SLA compliance percentage. Manager access required.")
    @ApiResponse(responseCode = "200", description = "Report generated successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - Manager role required")
    public ResponseEntity<ReportSummaryResponse> getSummaryReport() {
        return ResponseEntity.ok(workOrderService.getReportSummary());
    }
}
