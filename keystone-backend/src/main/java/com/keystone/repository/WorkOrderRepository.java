package com.keystone.repository;

import com.keystone.entity.WorkOrder;
import com.keystone.entity.enums.Priority;
import com.keystone.entity.enums.WorkOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    /**
     * Paginated search with optional filters for status, priority, and assigned technician.
     */
    @Query("""
            SELECT wo FROM WorkOrder wo
            WHERE (:status IS NULL OR wo.status = :status)
              AND (:priority IS NULL OR wo.priority = :priority)
              AND (:assignedToId IS NULL OR wo.assignedTo.id = :assignedToId)
              AND (:customerId IS NULL OR wo.customer.id = :customerId)
            """)
    Page<WorkOrder> findWithFilters(
            @Param("status") WorkOrderStatus status,
            @Param("priority") Priority priority,
            @Param("assignedToId") Long assignedToId,
            @Param("customerId") Long customerId,
            Pageable pageable
    );

    long countByStatus(WorkOrderStatus status);

    @Query("SELECT COUNT(wo) FROM WorkOrder wo WHERE wo.slaDueAt < :now AND wo.status NOT IN ('CLOSED', 'CANCELLED')")
    long countOverdue(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(wo) FROM WorkOrder wo WHERE wo.status = 'CLOSED' AND wo.slaDueAt >= wo.updatedAt")
    long countSlaCompliant();

    @Query("SELECT COUNT(wo) FROM WorkOrder wo WHERE wo.status = 'CLOSED'")
    long countClosed();

    /**
     * Generates the next sequential work order code for today's date prefix.
     */
    @Query("SELECT COUNT(wo) FROM WorkOrder wo WHERE wo.code LIKE :prefix%")
    long countByCodePrefix(@Param("prefix") String prefix);
}
