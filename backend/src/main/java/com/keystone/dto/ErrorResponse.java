package com.keystone.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Uniform error response returned by GlobalExceptionHandler.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String message,
        List<String> errors
) {
    public ErrorResponse(int status, String message) {
        this(LocalDateTime.now(), status, message, null);
    }

    public ErrorResponse(int status, String message, List<String> errors) {
        this(LocalDateTime.now(), status, message, errors);
    }
}
