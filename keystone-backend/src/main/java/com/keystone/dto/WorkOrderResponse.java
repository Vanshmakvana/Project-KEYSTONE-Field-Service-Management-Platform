package com.keystone.dto;

import com.keystone.entity.enums.Priority;
import com.keystone.entity.enums.WorkOrderStatus;

import java.time.LocalDateTime;

/**
 * Response DTO for work order data.
 */
public record WorkOrderResponse(
        Long id,
        String code,
        String title,
        String description,
        Priority priority,
        WorkOrderStatus status,
        LocalDateTime slaDueAt,
        Long customerId,
        String customerName,
        Long siteId,
        String siteName,
        Long assignedToUserId,
        String assignedToUserName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
