package com.keystone.dto;

import com.keystone.entity.enums.Priority;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating an existing work order's mutable fields.
 */
public record WorkOrderUpdateRequest(
        @Size(max = 300, message = "Title must not exceed 300 characters")
        String title,

        String description,

        Priority priority
) {}
