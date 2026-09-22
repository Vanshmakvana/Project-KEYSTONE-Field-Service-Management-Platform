package com.keystone.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for logging technician time against a work order.
 */
public record TimeLogRequest(
        @NotNull(message = "Technician ID is required")
        Long technicianId,

        @NotNull(message = "Minutes is required")
        @Min(value = 1, message = "Minutes must be at least 1")
        Integer minutes,

        String note
) {}
