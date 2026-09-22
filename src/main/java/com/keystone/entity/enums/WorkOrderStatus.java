package com.keystone.entity.enums;

import java.util.List;
import java.util.Map;

/**
 * Work-order lifecycle states with a built-in transition map.
 *
 * <p>Allowed transitions:
 * <pre>
 *   NEW        → ASSIGNED | CANCELLED
 *   ASSIGNED   → IN_PROGRESS | CANCELLED
 *   IN_PROGRESS↔ ON_HOLD
 *   IN_PROGRESS→ COMPLETED
 *   COMPLETED  → CLOSED
 *   CLOSED     → (terminal)
 *   CANCELLED  → (terminal)
 * </pre>
 */
public enum WorkOrderStatus {

    NEW,
    ASSIGNED,
    IN_PROGRESS,
    ON_HOLD,
    COMPLETED,
    CLOSED,
    CANCELLED;

    /**
     * Defines which states each status is allowed to transition to.
     */
    private static final Map<WorkOrderStatus, List<WorkOrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            NEW,         List.of(ASSIGNED, CANCELLED),
            ASSIGNED,    List.of(IN_PROGRESS, CANCELLED),
            IN_PROGRESS, List.of(ON_HOLD, COMPLETED),
            ON_HOLD,     List.of(IN_PROGRESS),
            COMPLETED,   List.of(CLOSED),
            CLOSED,      List.of(),
            CANCELLED,   List.of()
    );

    /**
     * Returns {@code true} if this status can legally transition to {@code target}.
     */
    public boolean canTransitionTo(WorkOrderStatus target) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, List.of()).contains(target);
    }

    /**
     * Returns the list of states reachable from this status.
     */
    public List<WorkOrderStatus> allowedNextStates() {
        return ALLOWED_TRANSITIONS.getOrDefault(this, List.of());
    }

    /**
     * Returns {@code true} if this is a terminal state (CLOSED or CANCELLED).
     */
    public boolean isTerminal() {
        return this == CLOSED || this == CANCELLED;
    }
}
