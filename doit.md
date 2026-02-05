
You are a senior React + MERN frontend engineer.

I already have a production-ready backend with JWT authentication.

I want to build DAY-2 frontend for a Land Developer Management System.

------------------------------------
TECH STACK
------------------------------------
- React (Vite)
- React Router DOM
- Axios
- Tailwind CSS

------------------------------------
ROLES (STRICT)
------------------------------------
- Executive
- Head Executive
- The Boss

------------------------------------
REQUIREMENTS
------------------------------------

1. AUTHENTICATION
- Login page
- POST /api/auth/login
- Store JWT in localStorage
- Store user role
- Auto logout if token missing

2. PROTECTED ROUTES
- Create ProtectedRoute component
- Block access if JWT not present
- Role-based route protection

3. ROLE-BASED DASHBOARD
- Dashboard page
- Show cards conditionally based on role
- Fetch stats from backend APIs

4. PAGES TO BUILD (ONLY THESE)
- Login
- Dashboard
- Projects (list + add)
- Plots (list by project + add)
- Customers (add + list)
- Transactions (add)

5. API INTEGRATION
- Axios instance with Authorization header
- Clean API service layer

6. UI RULES
- Simple admin dashboard UI
- No animations required
- Mobile responsive
- Focus on functionality

------------------------------------
OUTPUT FORMAT
------------------------------------
- Folder structure
- Components
- Pages
- Routing setup
- Axios config
- Role guard logic
- Copy-paste ready code
- Short explanation of flow

IMPORTANT:
This is for a real client demo.
No dummy logic.
No pseudo-code.