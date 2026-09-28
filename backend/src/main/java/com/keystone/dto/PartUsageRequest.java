package com.keystone.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for logging part usage against a work order.
 */
public record PartUsageRequest(
        @NotNull(message = "Part ID is required")
        Long partId,

        @NotNull(message = "Quantity used is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        Integer qtyUsed
) {}
