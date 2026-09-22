package com.keystone.dto;

/**
 * Summary report DTO returned by the reports endpoint.
 */
public record ReportSummaryResponse(
        long totalWorkOrders,
        long newCount,
        long assignedCount,
        long inProgressCount,
        long onHoldCount,
        long completedCount,
        long closedCount,
        long cancelledCount,
        long overdueCount,
        double slaCompliancePercentage
) {}
