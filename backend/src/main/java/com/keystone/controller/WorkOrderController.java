package com.keystone.controller;

import com.keystone.entity.Customer;
import com.keystone.entity.Site;
import com.keystone.entity.User;
import com.keystone.entity.WorkOrder;
import com.keystone.entity.enums.Priority;
import com.keystone.entity.enums.Role;
import com.keystone.entity.enums.WorkOrderStatus;
import com.keystone.repository.CustomerRepository;
import com.keystone.repository.SiteRepository;
import com.keystone.repository.UserRepository;
import com.keystone.repository.WorkOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Frontend-compatible work-order API. It returns the same field names used by
 * the supplied React mock data, so the existing service module works unchanged.
 */
@RestController
@RequestMapping("/api/work-orders")
@Transactional
public class WorkOrderController {

    private final WorkOrderRepository workOrders;
    private final CustomerRepository customers;
    private final SiteRepository sites;
    private final UserRepository users;

    public WorkOrderController(WorkOrderRepository workOrders,
                               CustomerRepository customers,
                               SiteRepository sites,
                               UserRepository users) {
        this.workOrders = workOrders;
        this.customers = customers;
        this.sites = sites;
        this.users = users;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return workOrders.findAll().stream().map(this::toFrontend).toList();
    }

    @GetMapping("/{code}")
    public Map<String, Object> get(@PathVariable String code) {
        return toFrontend(find(code));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        String customerName = required(body, "customer");
        String location = required(body, "location");
        Customer customer = findOrCreateCustomer(customerName, location);
        Site site = findOrCreateSite(customer, location);

        WorkOrder workOrder = WorkOrder.builder()
                .code(nextCode())
                .title(required(body, "issue"))
                .description(text(body, "description"))
                .priority(priority(text(body, "priority")))
                .status(status(text(body, "status")))
                .slaDueAt(dateTime(text(body, "slaDeadline")))
                .customer(customer)
                .site(site)
                .assignedTo(technician(text(body, "technician")))
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toFrontend(workOrders.save(workOrder)));
    }

    @PutMapping("/{code}")
    public Map<String, Object> update(@PathVariable String code,
                                      @RequestBody Map<String, Object> body) {
        WorkOrder workOrder = find(code);
        if (body.containsKey("issue")) workOrder.setTitle(required(body, "issue"));
        if (body.containsKey("description")) workOrder.setDescription(text(body, "description"));
        if (body.containsKey("priority")) workOrder.setPriority(priority(text(body, "priority")));
        if (body.containsKey("status")) workOrder.setStatus(status(text(body, "status")));
        if (body.containsKey("slaDeadline")) workOrder.setSlaDueAt(dateTime(text(body, "slaDeadline")));
        if (body.containsKey("technician")) workOrder.setAssignedTo(technician(text(body, "technician")));

        if (body.containsKey("customer") || body.containsKey("location")) {
            String customerName = body.containsKey("customer")
                    ? required(body, "customer") : workOrder.getCustomer().getName();
            String location = body.containsKey("location")
                    ? required(body, "location") : workOrder.getSite().getName();
            Customer customer = findOrCreateCustomer(customerName, location);
            workOrder.setCustomer(customer);
            workOrder.setSite(findOrCreateSite(customer, location));
        }
        return toFrontend(workOrders.save(workOrder));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        workOrders.delete(find(code));
        return ResponseEntity.noContent().build();
    }

    private WorkOrder find(String code) {
        return workOrders.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Work order not found: " + code));
    }

    private Customer findOrCreateCustomer(String name, String location) {
        return customers.findAll().stream()
                .filter(customer -> customer.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> customers.save(Customer.builder()
                        .name(name)
                        .contactEmail("frontend-" + safeName(name) + "@example.invalid")
                        .contact("Operations Team")
                        .phone("")
                        .location(location)
                        .build()));
    }

    private Site findOrCreateSite(Customer customer, String name) {
        return sites.findByCustomerId(customer.getId()).stream()
                .filter(site -> site.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> sites.save(Site.builder()
                        .customer(customer)
                        .name(name)
                        .address(name)
                        .build()));
    }

    private User technician(String name) {
        if (name == null || name.isBlank() || "Unassigned".equalsIgnoreCase(name)) return null;
        return users.findFirstByNameIgnoreCaseAndRole(name, Role.TECHNICIAN).orElse(null);
    }

    private String nextCode() {
        String prefix = "WO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        return prefix + String.format("%03d", workOrders.countByCodePrefix(prefix) + 1);
    }

    private Map<String, Object> toFrontend(WorkOrder order) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", order.getCode());
        result.put("customer", order.getCustomer().getName());
        result.put("location", order.getSite().getName());
        result.put("issue", order.getTitle());
        result.put("description", order.getDescription() == null ? "" : order.getDescription());
        result.put("technician", order.getAssignedTo() == null ? "Unassigned" : order.getAssignedTo().getName());
        result.put("priority", title(order.getPriority().name()));
        result.put("status", frontendStatus(order.getStatus()));
        result.put("slaDeadline", order.getSlaDueAt());
        result.put("createdAt", order.getCreatedAt());
        result.put("timeSpentHrs", 0);
        result.put("parts", List.of());
        return result;
    }

    private Priority priority(String value) {
        if (value == null || value.isBlank()) return Priority.MEDIUM;
        return Priority.valueOf(value.trim().replace(' ', '_').toUpperCase(Locale.ROOT));
    }

    private WorkOrderStatus status(String value) {
        if (value == null || value.isBlank()) return WorkOrderStatus.NEW;
        return switch (value.trim().toUpperCase(Locale.ROOT)) {
            case "PENDING", "NEW" -> WorkOrderStatus.NEW;
            case "IN PROGRESS", "IN_PROGRESS" -> WorkOrderStatus.IN_PROGRESS;
            case "SLA AT RISK", "SLA_AT_RISK", "ON HOLD", "ON_HOLD" -> WorkOrderStatus.ON_HOLD;
            case "COMPLETED" -> WorkOrderStatus.COMPLETED;
            case "CLOSED" -> WorkOrderStatus.CLOSED;
            case "CANCELLED" -> WorkOrderStatus.CANCELLED;
            case "ASSIGNED" -> WorkOrderStatus.ASSIGNED;
            default -> throw new IllegalArgumentException("Unsupported work-order status: " + value);
        };
    }

    private String frontendStatus(WorkOrderStatus status) {
        return switch (status) {
            case NEW, ASSIGNED -> "Pending";
            case IN_PROGRESS -> "In Progress";
            case ON_HOLD -> "SLA At Risk";
            case COMPLETED, CLOSED -> "Completed";
            case CANCELLED -> "Cancelled";
        };
    }

    private LocalDateTime dateTime(String value) {
        return value == null || value.isBlank()
                ? LocalDateTime.now().plusHours(24) : LocalDateTime.parse(value);
    }

    private String required(Map<String, Object> body, String key) {
        String value = text(body, key);
        if (value == null || value.isBlank()) throw new IllegalArgumentException(key + " is required");
        return value.trim();
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private String title(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private String safeName(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
