# Land Developer Management System - API Documentation

## Overview
Production-ready backend API for Land Developer Management System with role-based access control.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## User Roles
| Role | Description |
|------|-------------|
| Executive | Basic access to data entry |
| Head Executive | Extended access |
| The Boss | Full admin access (can create users) |

---

## API Endpoints

### 1. Authentication

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "userId": "theboss",
  "password": "Admin@123"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "data": {
    "id": "...",
    "name": "Administrator",
    "userId": "theboss",
    "role": "The Boss"
  }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

---

### 2. User Management (The Boss Only)

#### Create User
```
POST /api/users
Authorization: Bearer <token>
```
**Body:**
```json
{
  "name": "John Doe",
  "userId": "john123",
  "password": "SecurePass123",
  "role": "Executive",
  "active": true
}
```

#### Get All Users
```
GET /api/users
GET /api/users?role=Executive&active=true
```

#### Update User
```
PUT /api/users/:id
```

#### Deactivate User
```
DELETE /api/users/:id
```

#### Reset Password
```
PUT /api/users/:id/resetpassword
Body: { "newPassword": "NewPass123" }
```

---

### 3. Projects

#### Create Project
```
POST /api/projects
```
**Body:**
```json
{
  "projectName": "Green Valley Phase 1",
  "location": "Nagpur, Maharashtra",
  "totalPlots": 100,
  "description": "Premium residential plots"
}
```

#### Get All Projects
```
GET /api/projects
GET /api/projects?location=Nagpur&active=true
```

#### Get Single Project
```
GET /api/projects/:id
```

#### Update Project
```
PUT /api/projects/:id
```

#### Deactivate Project
```
DELETE /api/projects/:id
```

---

### 4. Plots

#### Create Plot
```
POST /api/plots
```
**Body:**
```json
{
  "plotNumber": "A-101",
  "size": 1500,
  "rate": 2500,
  "projectId": "<project_id>",
  "facing": "East",
  "remarks": "Corner plot"
}
```

#### Bulk Create Plots
```
POST /api/plots/bulk
```
**Body:**
```json
{
  "projectId": "<project_id>",
  "plots": [
    { "plotNumber": "A-101", "size": 1500, "rate": 2500 },
    { "plotNumber": "A-102", "size": 1200, "rate": 2500 }
  ]
}
```

#### Get Plots
```
GET /api/plots
GET /api/plots?projectId=<id>&status=available
```

#### Get Plot Statistics
```
GET /api/plots/stats/:projectId
```

#### Update Plot
```
PUT /api/plots/:id
```
**Note:** Sold plots have restricted updates.

---

### 5. Executives

#### Create Executive
```
POST /api/executives
```
**Body:**
```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "email": "rahul@example.com",
  "role": "Executive"
}
```

#### Get All Executives
```
GET /api/executives
```

---

### 6. Customers

#### Create Customer
```
POST /api/customers
```
**Body:**
```json
{
  "name": "Customer Name",
  "phone": "9876543210",
  "address": "123 Main Street, Nagpur",
  "projectId": "<project_id>",
  "plotId": "<plot_id>",
  "assignedExecutive": "<executive_id>",
  "dealValue": 3750000
}
```
**Note:** Creating a customer automatically marks the plot as "sold".

#### Get All Customers
```
GET /api/customers
GET /api/customers?projectId=<id>&assignedExecutive=<id>
```

#### Update Customer
```
PUT /api/customers/:id
```
**Note:** Cannot change plotId once assigned (plot is sold).

#### Get Customer Summary
```
GET /api/customers/:id/summary
```

---

### 7. Transactions

#### Create Transaction (Payment)
```
POST /api/transactions
```
**Body:**
```json
{
  "customerId": "<customer_id>",
  "amount": 500000,
  "paymentMode": "bank",
  "referenceNumber": "TXN123456",
  "bankName": "SBI"
}
```

#### Get Customer Transactions
```
GET /api/transactions/:customerId
```

#### Get All Transactions
```
GET /api/transactions
GET /api/transactions?paymentMode=cash&startDate=2024-01-01
```

---

### 8. Currency

#### Get All Currencies
```
GET /api/currency
```

#### Create Currency
```
POST /api/currency
Body: { "currencyName": "Indian Rupee", "symbol": "₹", "code": "INR" }
```

---

### 9. Ledger

#### Get Party Ledger
```
GET /api/ledger/:partyId?partyType=customer
GET /api/ledger/:partyId?partyType=executive
```

---

## Business Rules

1. **Plot Status**: When a customer is created, the associated plot status changes to "sold"
2. **Plot Modification**: Cannot change plotId once a customer is assigned
3. **Transactions**: All payments automatically update customer balance and create ledger entries
4. **Soft Delete**: No hard deletes - all deletions use active flag
5. **Password Security**: All passwords are hashed using bcrypt

---

## Initial Setup

1. Run the seeder to create The Boss user:
```bash
node utils/seeder.js
```

2. Default credentials:
   - UserId: `theboss`
   - Password: `Admin@123`

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
