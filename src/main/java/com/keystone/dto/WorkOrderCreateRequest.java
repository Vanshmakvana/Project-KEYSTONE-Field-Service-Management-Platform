package com.keystone.dto;

import com.keystone.entity.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new work order.
 */
public record WorkOrderCreateRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 300, message = "Title must not exceed 300 characters")
        String title,

        String description,

        @NotNull(message = "Priority is required")
        Priority priority,

        @NotNull(message = "Customer ID is required")
        Long customerId,

        @NotNull(message = "Site ID is required")
        Long siteId
) {}
