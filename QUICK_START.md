# 🚀 Quick Start Guide

## Current Status
✅ Backend running on http://localhost:3000
✅ Frontend running on http://localhost:5174

## How to Use

### 1. Open the App
Visit: **http://localhost:5174**

### 2. Login
```
User ID: theboss
Password: Admin@123
```

### 3. Explore the Dashboard
You'll see 5 cards:
- **Projects** - Manage all projects
- **Plots** - View and manage plots
- **Customers** - Add and view customers
- **Transactions** - Record payments
- **User Management** - Create users (Boss only)

### 4. Typical Workflow

#### Step 1: Create a Project
1. Click **Projects** card
2. Click **Add Project** button
3. Fill in:
   - Project Name: "Green Valley Phase 1"
   - Location: "Nagpur, Maharashtra"
   - Total Plots: 50
   - Description: "Premium residential plots"
4. Click **Create Project**

#### Step 2: Add Plots to Project
1. Click **Plots** card
2. Select your project from dropdown
3. Click **Add Plot** button
4. Fill in:
   - Plot Number: "A-101"
   - Size: 1500 (sq ft)
   - Rate: 2500 (per sq ft)
   - Facing: East
5. Click **Create Plot**
6. Repeat for more plots (A-102, A-103, etc.)

#### Step 3: Add a Customer
1. Click **Customers** card
2. Click **Add Customer** button
3. Fill in:
   - Customer Name: "Rahul Sharma"
   - Phone: "9876543210"
   - Address: "123 Main St, Nagpur"
   - Select Project: Choose your project
   - Select Plot: Choose an available plot
   - Assign Executive: Choose from list
   - Deal Value: Auto-filled based on plot
4. Click **Create Customer**
5. Go back to **Plots** - the plot is now marked as "sold" (red)

#### Step 4: Record a Payment
1. Click **Transactions** card
2. Click **Add Transaction** button
3. Fill in:
   - Customer: Select the customer
   - Amount: 500000
   - Payment Mode: Bank Transfer
   - Reference Number: "TXN123456"
   - Bank Name: "SBI"
4. Click **Record Transaction**
5. Customer balance will be updated

## Features to Test

### Authentication
- ✅ Logout button (top right)
- ✅ Try accessing pages without login (should redirect)
- ✅ Token stored in localStorage

### Role-Based Access
- ✅ Different roles see different cards
- ✅ Create users with different roles (The Boss only)

### Form Validations
- ✅ Required fields marked with *
- ✅ Error messages for invalid data
- ✅ Success messages on completion

### Smart Features
- ✅ Plot status changes when customer assigned
- ✅ Deal value auto-calculates
- ✅ Only available plots shown in customer form
- ✅ Payment mode changes form fields

## Troubleshooting

### Backend not responding?
```bash
cd /Users/onkardange/Desktop/DAD
npm run dev
```

### Frontend not loading?
```bash
cd /Users/onkardange/Desktop/DAD/frontend
npm run dev
```

### Clear cache and restart
```bash
# Stop both servers (Ctrl+C)
# Clear browser localStorage
# Restart both servers
```

## File Locations

- **Backend**: `/Users/onkardange/Desktop/DAD`
- **Frontend**: `/Users/onkardange/Desktop/DAD/frontend`
- **API Docs**: `/Users/onkardange/Desktop/DAD/API_DOCUMENTATION.md`
- **Implementation**: `/Users/onkardange/Desktop/DAD/FRONTEND_IMPLEMENTATION.md`

## Default Credentials

**The Boss** (Full Access):
- User ID: `theboss`
- Password: `Admin@123`

To create more users, use The Boss account and add them through the system.

---

**Ready for client demo!** 🎉
