package com.keystone.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for site data.
 */
public record SiteResponse(
        Long id,
        Long customerId,
        String customerName,
        String name,
        String address,
        LocalDateTime createdAt
) {}
