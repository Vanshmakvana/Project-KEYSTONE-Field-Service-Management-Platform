package com.keystone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating / updating a customer.
 */
public record CustomerRequest(
        @NotBlank(message = "Customer name is required")
        @Size(max = 200, message = "Name must not exceed 200 characters")
        String name,

        @NotBlank(message = "Contact email is required")
        @Email(message = "Must be a valid email address")
        String contactEmail
) {}
