package com.keystone.dto;

/**
 * JWT authentication response.
 */
public record AuthResponse(String token, UserPayload user) {

    /** Matches the user object read by the frontend AuthContext. */
    public record UserPayload(
            Long id,
            String name,
            String email,
            String role,
            String initials
    ) {}
}
