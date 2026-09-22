package com.keystone.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for assigning a technician to a work order.
 */
public record AssignTechnicianRequest(
        @NotNull(message = "Technician user ID is required")
        Long technicianId
) {}
