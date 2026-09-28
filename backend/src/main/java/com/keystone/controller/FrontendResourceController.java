package com.keystone.controller;

import com.keystone.entity.Customer;
import com.keystone.entity.Part;
import com.keystone.entity.ServiceRequest;
import com.keystone.entity.User;
import com.keystone.entity.WorkOrder;
import com.keystone.entity.enums.Role;
import com.keystone.entity.enums.WorkOrderStatus;
import com.keystone.repository.CustomerRepository;
import com.keystone.repository.PartRepository;
import com.keystone.repository.ServiceRequestRepository;
import com.keystone.repository.UserRepository;
import com.keystone.repository.WorkOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** REST resources used by the generic React createResourceService helper. */
@RestController
@RequestMapping("/api")
@Transactional
public class FrontendResourceController {

    private final CustomerRepository customers;
    private final PartRepository parts;
    private final ServiceRequestRepository serviceRequests;
    private final UserRepository users;
    private final WorkOrderRepository workOrders;

    public FrontendResourceController(CustomerRepository customers,
                                      PartRepository parts,
                                      ServiceRequestRepository serviceRequests,
                                      UserRepository users,
                                      WorkOrderRepository workOrders) {
        this.customers = customers;
        this.parts = parts;
        this.serviceRequests = serviceRequests;
        this.users = users;
        this.workOrders = workOrders;
    }

    @GetMapping("/customers")
    public List<Map<String, Object>> customers() {
        return customers.findAll().stream().map(this::customerView).toList();
    }

    @PostMapping("/customers")
    public ResponseEntity<Map<String, Object>> createCustomer(@RequestBody Map<String, Object> body) {
        Customer customer = Customer.builder()
                .name(required(body, "name"))
                .contactEmail(required(body, "email"))
                .contact(text(body, "contact", ""))
                .phone(text(body, "phone", ""))
                .location(text(body, "location", ""))
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(customerView(customers.save(customer)));
    }

    @PutMapping("/customers/{id}")
    public Map<String, Object> updateCustomer(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Customer customer = customer(id);
        if (body.containsKey("name")) customer.setName(required(body, "name"));
        if (body.containsKey("email")) customer.setContactEmail(required(body, "email"));
        if (body.containsKey("contact")) customer.setContact(text(body, "contact", ""));
        if (body.containsKey("phone")) customer.setPhone(text(body, "phone", ""));
        if (body.containsKey("location")) customer.setLocation(text(body, "location", ""));
        return customerView(customers.save(customer));
    }

    @DeleteMapping("/customers/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String id) {
        customers.delete(customer(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/inventory")
    public List<Map<String, Object>> inventory() {
        return parts.findAll().stream().map(this::partView).toList();
    }

    @PostMapping("/inventory")
    public ResponseEntity<Map<String, Object>> createPart(@RequestBody Map<String, Object> body) {
        Part part = Part.builder()
                .name(required(body, "name"))
                .sku("PART-" + System.currentTimeMillis())
                .category(text(body, "category", "General"))
                .stockQty(number(body, "stock", 0))
                .minStock(number(body, "minStock", 5))
                .unitCost(decimal(body, "unitPrice", BigDecimal.ZERO))
                .supplier(text(body, "supplier", ""))
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(partView(parts.save(part)));
    }

    @PutMapping("/inventory/{id}")
    public Map<String, Object> updatePart(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Part part = part(id);
        if (body.containsKey("name")) part.setName(required(body, "name"));
        if (body.containsKey("category")) part.setCategory(text(body, "category", "General"));
        if (body.containsKey("stock")) part.setStockQty(number(body, "stock", part.getStockQty()));
        if (body.containsKey("minStock")) part.setMinStock(number(body, "minStock", part.getMinStock()));
        if (body.containsKey("unitPrice")) part.setUnitCost(decimal(body, "unitPrice", part.getUnitCost()));
        if (body.containsKey("supplier")) part.setSupplier(text(body, "supplier", ""));
        return partView(parts.save(part));
    }

    @DeleteMapping("/inventory/{id}")
    public ResponseEntity<Void> deletePart(@PathVariable String id) {
        parts.delete(part(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/service-requests")
    public List<Map<String, Object>> serviceRequests() {
        return serviceRequests.findAll().stream().map(this::serviceRequestView).toList();
    }

    @PostMapping("/service-requests")
    public ResponseEntity<Map<String, Object>> createServiceRequest(@RequestBody Map<String, Object> body) {
        ServiceRequest request = ServiceRequest.builder()
                .code("SR-" + System.currentTimeMillis())
                .customer(required(body, "customer"))
                .issue(required(body, "issue"))
                .description(text(body, "description", ""))
                .priority(text(body, "priority", "Medium"))
                .status(text(body, "status", "Open"))
                .technician(text(body, "technician", "Unassigned"))
                .slaDeadline(dateTime(text(body, "slaDeadline", null)))
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceRequestView(serviceRequests.save(request)));
    }

    @PutMapping("/service-requests/{code}")
    public Map<String, Object> updateServiceRequest(@PathVariable String code,
                                                     @RequestBody Map<String, Object> body) {
        ServiceRequest request = serviceRequest(code);
        if (body.containsKey("customer")) request.setCustomer(required(body, "customer"));
        if (body.containsKey("issue")) request.setIssue(required(body, "issue"));
        if (body.containsKey("description")) request.setDescription(text(body, "description", ""));
        if (body.containsKey("priority")) request.setPriority(text(body, "priority", "Medium"));
        if (body.containsKey("status")) request.setStatus(text(body, "status", "Open"));
        if (body.containsKey("technician")) request.setTechnician(text(body, "technician", "Unassigned"));
        if (body.containsKey("slaDeadline")) request.setSlaDeadline(dateTime(text(body, "slaDeadline", null)));
        return serviceRequestView(serviceRequests.save(request));
    }

    @DeleteMapping("/service-requests/{code}")
    public ResponseEntity<Void> deleteServiceRequest(@PathVariable String code) {
        serviceRequests.delete(serviceRequest(code));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/technicians")
    public List<Map<String, Object>> technicians() {
        return users.findAll().stream()
                .filter(user -> user.getRole() == Role.TECHNICIAN)
                .map(this::technicianView)
                .toList();
    }

    private Map<String, Object> customerView(Customer customer) {
        long activeOrders = workOrders.findAll().stream()
                .filter(order -> order.getCustomer().getId().equals(customer.getId()))
                .filter(order -> order.getStatus() != WorkOrderStatus.COMPLETED
                        && order.getStatus() != WorkOrderStatus.CLOSED
                        && order.getStatus() != WorkOrderStatus.CANCELLED)
                .count();
        long openRequests = serviceRequests.findAll().stream()
                .filter(request -> request.getCustomer().equalsIgnoreCase(customer.getName()))
                .filter(request -> !"Resolved".equalsIgnoreCase(request.getStatus()))
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", "CU-" + customer.getId());
        result.put("name", customer.getName());
        result.put("contact", textOrEmpty(customer.getContact()));
        result.put("email", customer.getContactEmail());
        result.put("phone", textOrEmpty(customer.getPhone()));
        result.put("location", textOrEmpty(customer.getLocation()));
        result.put("activeWorkOrders", activeOrders);
        result.put("openRequests", openRequests);
        return result;
    }

    private Map<String, Object> partView(Part part) {
        int stock = part.getStockQty();
        int minStock = part.getMinStock() == null ? 5 : part.getMinStock();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", "PT-" + part.getId());
        result.put("name", part.getName());
        result.put("category", textOrEmpty(part.getCategory()));
        result.put("stock", stock);
        result.put("minStock", minStock);
        result.put("unitPrice", part.getUnitCost());
        result.put("supplier", textOrEmpty(part.getSupplier()));
        result.put("status", stock == 0 ? "Out of Stock" : stock < minStock ? "Low Stock" : "In Stock");
        return result;
    }

    private Map<String, Object> serviceRequestView(ServiceRequest request) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", request.getCode());
        result.put("customer", request.getCustomer());
        result.put("issue", request.getIssue());
        result.put("description", textOrEmpty(request.getDescription()));
        result.put("priority", request.getPriority());
        result.put("status", request.getStatus());
        result.put("technician", textOrEmpty(request.getTechnician()));
        result.put("slaDeadline", request.getSlaDeadline());
        result.put("createdAt", request.getCreatedAt());
        return result;
    }

    private Map<String, Object> technicianView(User user) {
        WorkOrder assignment = workOrders.findAll().stream()
                .filter(order -> order.getAssignedTo() != null && order.getAssignedTo().getId().equals(user.getId()))
                .filter(order -> order.getStatus() != WorkOrderStatus.COMPLETED
                        && order.getStatus() != WorkOrderStatus.CLOSED
                        && order.getStatus() != WorkOrderStatus.CANCELLED)
                .findFirst().orElse(null);
        long completed = workOrders.findAll().stream()
                .filter(order -> order.getAssignedTo() != null && order.getAssignedTo().getId().equals(user.getId()))
                .filter(order -> order.getStatus() == WorkOrderStatus.COMPLETED || order.getStatus() == WorkOrderStatus.CLOSED)
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", "TC-" + user.getId());
        result.put("name", user.getName());
        result.put("role", "Field Technician");
        result.put("status", assignment == null ? "offline" : "online");
        result.put("currentAssignment", assignment == null ? null : assignment.getCode());
        result.put("completedJobs", completed);
        result.put("efficiency", 100);
        result.put("rating", 5.0);
        result.put("location", assignment == null ? "Off duty" : assignment.getSite().getName());
        result.put("phone", "Not provided");
        result.put("email", user.getEmail());
        return result;
    }

    private Customer customer(String id) {
        return customers.findById(publicId(id, "CU-"))
                .orElseThrow(() -> new EntityNotFoundException("Customer not found: " + id));
    }

    private Part part(String id) {
        return parts.findById(publicId(id, "PT-"))
                .orElseThrow(() -> new EntityNotFoundException("Part not found: " + id));
    }

    private ServiceRequest serviceRequest(String code) {
        return serviceRequests.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Service request not found: " + code));
    }

    private Long publicId(String id, String prefix) {
        String raw = id.startsWith(prefix) ? id.substring(prefix.length()) : id;
        try {
            return Long.valueOf(raw);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Invalid id: " + id);
        }
    }

    private String required(Map<String, Object> body, String key) {
        String value = text(body, key, null);
        if (value == null || value.isBlank()) throw new IllegalArgumentException(key + " is required");
        return value.trim();
    }

    private String text(Map<String, Object> body, String key, String fallback) {
        Object value = body.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private int number(Map<String, Object> body, String key, int fallback) {
        String value = text(body, key, null);
        return value == null || value.isBlank() ? fallback : Integer.parseInt(value);
    }

    private BigDecimal decimal(Map<String, Object> body, String key, BigDecimal fallback) {
        String value = text(body, key, null);
        return value == null || value.isBlank() ? fallback : new BigDecimal(value);
    }

    private LocalDateTime dateTime(String value) {
        return value == null || value.isBlank() ? LocalDateTime.now().plusHours(24) : LocalDateTime.parse(value);
    }

    private String textOrEmpty(String value) {
        return value == null ? "" : value;
    }
}
