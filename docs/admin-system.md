# Admin Management System

## Overview
Complete admin dashboard system for QuickCourt platform with venue approval workflow and user management.

## Features

### Venue Management
- **Venue Listing**: Filter by status, search, sort, and paginate venues
- **Venue Approval**: Approve/reject venues with admin notes
- **Re-Review Support**: Ability to change venue status multiple times
- **Audit Trail**: Complete tracking of approval actions with timestamps and admin details

### User Management  
- **User Listing**: View all users with role filtering and search
- **Role Management**: Change user roles (ADMIN, FACILITY_OWNER, USER)
- **User Statistics**: Track user activity and details

### Security
- **Role-Based Access**: Admin-only endpoints with JWT authentication
- **Input Validation**: Comprehensive Zod schemas with data sanitization
- **Error Handling**: Proper error responses and logging

## API Endpoints

### Venues
- `GET /api/admin/venues` - List venues with filtering
- `GET /api/admin/venues/[id]` - Get venue details
- `PUT /api/admin/venues/[id]` - Approve/reject venue

### Users
- `GET /api/admin/users` - List users with filtering  
- `PUT /api/admin/users/[id]/role` - Update user role

## Business Logic
- Venues can be re-reviewed and status changed multiple times
- Complete audit trail maintained for all admin actions
- Flexible approval workflow supporting complex scenarios