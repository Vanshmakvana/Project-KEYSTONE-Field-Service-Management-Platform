package com.keystone.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for customer data.
 */
public record CustomerResponse(
        Long id,
        String name,
        String contactEmail,
        LocalDateTime createdAt
) {}
