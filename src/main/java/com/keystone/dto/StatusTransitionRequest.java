package com.keystone.dto;

import com.keystone.entity.enums.WorkOrderStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for transitioning a work order's status.
 */
public record StatusTransitionRequest(
        @NotNull(message = "Target status is required")
        WorkOrderStatus targetStatus,

        String notes
) {}
