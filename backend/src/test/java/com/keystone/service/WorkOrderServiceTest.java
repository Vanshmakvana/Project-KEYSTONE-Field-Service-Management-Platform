package com.keystone.service;

import com.keystone.dto.AssignTechnicianRequest;
import com.keystone.dto.StatusTransitionRequest;
import com.keystone.dto.WorkOrderResponse;
import com.keystone.entity.Customer;
import com.keystone.entity.Site;
import com.keystone.entity.User;
import com.keystone.entity.WorkOrder;
import com.keystone.entity.WorkOrderStatusHistory;
import com.keystone.entity.enums.Priority;
import com.keystone.entity.enums.Role;
import com.keystone.entity.enums.WorkOrderStatus;
import com.keystone.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkOrderServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;
    @Mock
    private WorkOrderStatusHistoryRepository statusHistoryRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private SiteRepository siteRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PartRepository partRepository;
    @Mock
    private PartUsageRepository partUsageRepository;
    @Mock
    private TimeLogRepository timeLogRepository;

    @InjectMocks
    private WorkOrderService workOrderService;

    private WorkOrder sampleWorkOrder;
    private Customer sampleCustomer;
    private Site sampleSite;
    private User sampleTechnician;

    @BeforeEach
    void setUp() {
        sampleCustomer = Customer.builder()
                .id(1L)
                .name("Wayne Enterprises")
                .contactEmail("contact@wayne-ent.com")
                .build();

        sampleSite = Site.builder()
                .id(1L)
                .name("Wayne Tower")
                .address("Gotham City")
                .customer(sampleCustomer)
                .build();

        sampleTechnician = User.builder()
                .id(2L)
                .name("Tony Stark")
                .email("tech@keystone.io")
                .role(Role.TECHNICIAN)
                .build();

        sampleWorkOrder = WorkOrder.builder()
                .id(100L)
                .code("WO-20260922-001")
                .title("Fix HVAC")
                .description("Air conditioning breakdown")
                .priority(Priority.HIGH)
                .status(WorkOrderStatus.NEW)
                .customer(sampleCustomer)
                .site(sampleSite)
                .slaDueAt(LocalDateTime.now().plusHours(4))
                .build();
    }

    @Test
    @DisplayName("Illegal transition (NEW -> COMPLETED) should throw IllegalStateException")
    void testIllegalTransition_ThrowsException() {
        // Arrange
        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(sampleWorkOrder));

        StatusTransitionRequest request = new StatusTransitionRequest(WorkOrderStatus.COMPLETED, "Trying illegal jump");

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                workOrderService.transitionStatus(100L, request, "dispatcher@keystone.io")
        );

        assertTrue(exception.getMessage().contains("Illegal status transition"));
        verify(workOrderRepository, never()).save(any(WorkOrder.class));
        verify(statusHistoryRepository, never()).save(any(WorkOrderStatusHistory.class));
    }

    @Test
    @DisplayName("Legal transition (NEW -> ASSIGNED) via assignTechnician should succeed and write audit history")
    void testLegalTransition_AssignTechnician_SucceedsAndWritesAuditLog() {
        // Arrange
        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(sampleWorkOrder));
        when(userRepository.findByIdAndRole(2L, Role.TECHNICIAN)).thenReturn(Optional.of(sampleTechnician));
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(i -> i.getArgument(0));

        AssignTechnicianRequest request = new AssignTechnicianRequest(2L);

        // Act
        WorkOrderResponse response = workOrderService.assignTechnician(100L, request, "dispatcher@keystone.io");

        // Assert
        assertNotNull(response);
        assertEquals(WorkOrderStatus.ASSIGNED, response.status());
        assertEquals(2L, response.assignedToUserId());
        assertEquals("Tony Stark", response.assignedToUserName());

        // Verify status audit history was written
        ArgumentCaptor<WorkOrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(WorkOrderStatusHistory.class);
        verify(statusHistoryRepository).save(historyCaptor.capture());

        WorkOrderStatusHistory savedHistory = historyCaptor.getValue();
        assertEquals("NEW", savedHistory.getFromStatus());
        assertEquals("ASSIGNED", savedHistory.getToStatus());
        assertEquals("dispatcher@keystone.io", savedHistory.getChangedBy());
        assertTrue(savedHistory.getNotes().contains("Assigned to technician: Tony Stark"));
    }

    @Test
    @DisplayName("Legal transition (ASSIGNED -> IN_PROGRESS -> COMPLETED -> CLOSED) state machine sequence")
    void testLegalTransition_Sequence_Succeeds() {
        // Start from ASSIGNED
        sampleWorkOrder.setStatus(WorkOrderStatus.ASSIGNED);
        sampleWorkOrder.setAssignedTo(sampleTechnician);

        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(sampleWorkOrder));
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(i -> i.getArgument(0));

        // ASSIGNED -> IN_PROGRESS
        StatusTransitionRequest toInProgress = new StatusTransitionRequest(WorkOrderStatus.IN_PROGRESS, "Started work");
        WorkOrderResponse resp1 = workOrderService.transitionStatus(100L, toInProgress, "tech@keystone.io");
        assertEquals(WorkOrderStatus.IN_PROGRESS, resp1.status());

        // IN_PROGRESS -> COMPLETED
        StatusTransitionRequest toCompleted = new StatusTransitionRequest(WorkOrderStatus.COMPLETED, "Work done");
        WorkOrderResponse resp2 = workOrderService.transitionStatus(100L, toCompleted, "tech@keystone.io");
        assertEquals(WorkOrderStatus.COMPLETED, resp2.status());

        // COMPLETED -> CLOSED
        StatusTransitionRequest toClosed = new StatusTransitionRequest(WorkOrderStatus.CLOSED, "Manager approved");
        WorkOrderResponse resp3 = workOrderService.transitionStatus(100L, toClosed, "manager@keystone.io");
        assertEquals(WorkOrderStatus.CLOSED, resp3.status());

        verify(statusHistoryRepository, times(3)).save(any(WorkOrderStatusHistory.class));
    }

    @Test
    @DisplayName("Terminal state (CLOSED) cannot transition further")
    void testTerminalState_CannotTransition() {
        sampleWorkOrder.setStatus(WorkOrderStatus.CLOSED);
        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(sampleWorkOrder));

        StatusTransitionRequest request = new StatusTransitionRequest(WorkOrderStatus.IN_PROGRESS, "Reopen");

        assertThrows(IllegalStateException.class, () ->
                workOrderService.transitionStatus(100L, request, "manager@keystone.io")
        );
    }
}
