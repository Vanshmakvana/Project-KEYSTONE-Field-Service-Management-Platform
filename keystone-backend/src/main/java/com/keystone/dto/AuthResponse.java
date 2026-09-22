package com.keystone.dto;

/**
 * JWT authentication response.
 */
public record AuthResponse(
        String token,
        String email,
        String role
) {}
