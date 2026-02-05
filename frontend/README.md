# Land Developer Management System - Frontend

Production-ready React frontend for Land Developer Management System.

## Tech Stack

- **React 18** with Vite
- **React Router DOM** for routing
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Context API** for state management

## Features

### Authentication
- JWT-based login system
- Auto logout on token expiration
- Protected routes with role-based access

### Role-Based Access Control
- **Executive**: Access to Projects, Plots, Customers, Transactions
- **Head Executive**: Same as Executive
- **The Boss**: Full access including User Management

### Pages

1. **Login** - Secure authentication
2. **Dashboard** - Role-based cards showing available modules
3. **Projects** - List and add projects
4. **Plots** - View plots by project, add new plots
5. **Customers** - Add customers and assign plots
6. **Transactions** - Record payments with multiple payment modes

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Environment

The app connects to the backend at `http://localhost:3000/api`

To change the API URL, edit `src/api/axios.js`

## Default Login

- **User ID**: `theboss`
- **Password**: `Admin@123`

## Project Structure

```
src/
├── api/
│   ├── axios.js          # Axios instance with interceptors
│   └── services.js       # API service layer
├── components/
│   ├── Layout.jsx        # Main layout with navbar
│   └── ProtectedRoute.jsx # Route protection component
├── context/
│   └── AuthContext.jsx   # Authentication context
├── pages/
│   ├── Login.jsx         # Login page
│   ├── Dashboard.jsx     # Dashboard with role-based cards
│   ├── Projects.jsx      # Projects management
│   ├── Plots.jsx         # Plots management
│   ├── Customers.jsx     # Customer management
│   └── Transactions.jsx  # Transaction recording
├── App.jsx               # Main app with routing
├── main.jsx              # Entry point
└── index.css             # Global styles
```

## Key Features

### Authentication Flow
1. User logs in with userId and password
2. JWT token stored in localStorage
3. Token automatically added to all API requests
4. Auto-redirect to login if token expires

### Protected Routes
- All routes except `/login` require authentication
- Role-based access control for specific features
- Automatic redirect for unauthorized access

### API Integration
- Clean service layer for all API calls
- Centralized error handling
- Automatic token refresh handling

## Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Notes

- Mobile responsive design
- Simple, functional admin UI
- No animations (as per requirements)
- Production-ready code with proper error handling
