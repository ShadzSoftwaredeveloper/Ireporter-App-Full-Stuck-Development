# Backend notes — SQL runner & schema updates

This file documents two helper features in the `backend/` folder:

- A small SQL runner that executes `backend/sql/init_full.sql` using the project's `.env` DB credentials.
- A guarded one-time schema migration controlled by the `AUTO_UPDATE_SCHEMA` environment variable.

Quick prerequisites
- Ensure a MySQL server is running and reachable with credentials in `backend/.env`.
- Node.js is required to run the provided helper scripts.

Run the SQL runner

The runner executes `backend/sql/init_full.sql` (contains DDL and seed data).

PowerShell (recommended):
```
cd c:\Users\USER\co-ireporter\backend
node .\scripts\run_sql_file.js
```

If you prefer the `mysql` CLI you can run the SQL file directly (adjust user/host as needed):
```
mysql -u root -p < backend/sql/init_full.sql
```

Notes about the SQL runner
- The runner reads DB credentials from `backend/.env` via `dotenv`.
- The script uses `multipleStatements` to execute the file in one go — be careful when editing the file.
- Some inserts in the file are idempotent (use `ON DUPLICATE KEY UPDATE`) to allow safe re-runs.

Enable guarded one-time ALTER migrations

The server includes optional ALTER statements (for older DB schemas) that run only when explicitly enabled.
To enable them for a maintenance run set `AUTO_UPDATE_SCHEMA=true` in `backend/.env` (or as an environment variable) and start the server.

PowerShell example (temporary for a single run):
```
$env:AUTO_UPDATE_SCHEMA = 'true'
cd c:\Users\USER\co-ireporter\backend
node server.js
```

Or add the line to `backend/.env`:
```
AUTO_UPDATE_SCHEMA=true
```
Then start normally (`node server.js` or `npm run dev`).

Safety and recommendations
- These migrations may ALTER table definitions; enable `AUTO_UPDATE_SCHEMA` only during a controlled maintenance window (staging/backup recommended).
- After the migration runs successfully, unset `AUTO_UPDATE_SCHEMA` to avoid repeating schema changes on subsequent restarts.
- If you prefer manual control, run the relevant `ALTER` statements from `backend/sql/fix_profile_picture_longtext.sql` (or split schema/seed files) instead of enabling automatic migrations.

If you want, I can split the SQL into `schema.sql` and `seeds.sql`, and add npm scripts to run them separately. Just say so.
# Incident Reporting Backend API

Backend API for the Incident Reporting Application built with Express.js, MySQL, and Sequelize ORM.

## 📋 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (User/Admin)
- **Incident Management**: Full CRUD operations for incidents with role-based permissions
- **Notifications**: Real-time notification system for incident updates
- **Email Notifications**: Automated email notifications for incident creation and status updates
- **Database**: MySQL with Sequelize ORM
- **Security**: Helmet.js, CORS, password hashing with bcrypt
- **API Documentation**: RESTful API with clear endpoint structure


### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   
   Edit `.env` file with your database and email credentials.

4. **Set up MySQL database**
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # Create database
   CREATE DATABASE incident_reporting;
   
   # Exit MySQL
   exit;
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 🗄️ Database Configuration

### MySQL Setup

You will need to provide your MySQL credentials in the `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=incident_reporting
DB_USER=root
DB_PASSWORD=your_database_password
```

### Database Models

The application uses Sequelize ORM with the following models:

1. **User**
   - id (UUID)
   - email (string, unique)
   - password (string, hashed)
   - name (string)
   - role (enum: 'user', 'admin')
   - profilePicture (string, optional)
   - timestamps

2. **Incident**
   - id (UUID)
   - type (enum: 'red-flag', 'intervention')
   - title (string)
   - description (text)
   - location (JSONB: {lat, lng, address})
   - media (JSONB: array of media files)
   - status (enum: 'draft', 'under-investigation', 'resolved', 'rejected')
   - adminComment (text, optional)
   - userId (UUID, foreign key)
   - timestamps

3. **Notification**
   - id (UUID)
   - userId (UUID, foreign key)
   - incidentId (UUID, foreign key)
   - incidentTitle (string)
   - type (enum: 'status-update', 'comment-added', 'new-incident')
   - message (text)
   - oldStatus (enum, optional)
   - newStatus (enum, optional)
   - read (boolean)
   - timestamps

### Auto Migration

The database tables will be automatically created when you start the server for the first time. Sequelize will sync the models with the database.

## 📧 Email Configuration

The application supports multiple email services:

### Option 1: SendGrid (Recommended for Production)

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### Option 2: Gmail

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=your_email@gmail.com
```

**Note**: For Gmail, you need to create an App-Specific Password:
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate a new app password
4. Use that password in the `.env` file

### Option 3: Mailtrap (For Testing)

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASSWORD=your_mailtrap_password
EMAIL_FROM=noreply@incidentreporting.com
```


### Option 4: Custom SMTP

```env
EMAIL_SERVICE=smtp
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@yourdomain.com
```

##  API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update user profile (Protected)

### Incidents
- `GET /api/incidents` - Get all incidents (Protected, role-based)
- `POST /api/incidents` - Create new incident (Protected)
- `GET /api/incidents/:id` - Get incident by ID (Protected)
- `PUT /api/incidents/:id` - Update incident (Protected, owner or admin)
- `DELETE /api/incidents/:id` - Delete incident (Protected, owner with draft status or admin)
- `GET /api/incidents/stats/overview` - Get incident statistics (Admin only)

### Notifications
- `GET /api/notifications` - Get all user notifications (Protected)
- `GET /api/notifications/unread-count` - Get unread notification count (Protected)
- `PUT /api/notifications/:id/read` - Mark notification as read (Protected)
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read (Protected)
- `DELETE /api/notifications/:id` - Delete notification (Protected)

### Users
- `GET /api/users` - Get all users (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Health Check
- `GET /api/health` - Server health check
- `GET /` - API information

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting a Token

1. **Sign up or sign in** to get a JWT token
2. **Include the token** in the Authorization header for protected routes:
   ```
   Authorization: Bearer your_jwt_token_here
   ```

### Example Request

```javascript
fetch('http://localhost:5000/api/incidents', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your_jwt_token_here',
    'Content-Type': 'application/json'
  }
})
```

## 👥 User Roles

### User Role
- Can create incidents
- Can view their own incidents
- Can edit draft incidents
- Can delete draft incidents
- Receives notifications when incident status is updated

### Admin Role
- Can view all incidents
- Can update any incident status
- Can add admin comments
- Can delete any incident
- Receives notifications when new incidents are created
- Can manage users


### 1. Register a new user

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "user"
  }'
```

### 2. Sign in

```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. Create an incident

```bash
curl -X POST http://localhost:5000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "red-flag",
    "title": "Road Safety Issue",
    "description": "Pothole causing accidents",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "New York, NY"
    },
    "media": []
  }'
```

### 4. Get all incidents

```bash
curl -X GET http://localhost:5000/api/incidents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Update incident status (Admin only)

```bash
curl -X PUT http://localhost:5000/api/incidents/INCIDENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "resolved",
    "adminComment": "Issue has been fixed"
  }'
```

## Security Features

- **Password Hashing**: Passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **CORS**: Configured for specific frontend origin
- **Helmet.js**: Security headers
- **Input Validation**: Request validation using express-validator
- **Role-Based Access Control**: Different permissions for users and admins

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── auth.controller.js   # Authentication logic
│   ├── incident.controller.js
│   └── notification.controller.js
├── middleware/
│   └── auth.middleware.js   # JWT verification & authorization
├── models/
│   ├── User.model.js
│   ├── Incident.model.js
│   ├── Notification.model.js
│   └── index.js             # Model associations
├── routes/
│   ├── auth.routes.js
│   ├── incident.routes.js
│   ├── notification.routes.js
│   └── user.routes.js
├── utils/
│   └── emailService.js      # Email sending functionality
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js                # Express app & server
```

## Email Notification Flow

### When User Creates Incident:
1. Incident is saved to database
2. Notifications created for all admin users
3. Email sent to all admins with incident details
4. Admin receives in-app notification

### When Admin Updates Incident Status:
1. Incident status is updated in database
2. Notification created for incident owner
3. Email sent to incident owner with status update
4. User receives in-app notification

##  Testing Email Configuration

You can test if your email configuration is working by checking the server logs when:
1. A user creates an incident (admins should receive emails)
2. An admin updates incident status (user should receive email)

Check console for:
- ✅ Email sent messages
- ❌ Email error messages

## 🚀 Deployment

### Environment Variables for Production

Update these in your production environment:

```env
NODE_ENV=production
DB_SSL=true  # If your database requires SSL
JWT_SECRET=generate_a_strong_random_secret_key
```

### Recommended Platforms

- **Heroku**: Easy deployment with Heroku Postgres
- **AWS**: EC2 + RDS for PostgreSQL
- **DigitalOcean**: App Platform + Managed PostgreSQL
- **Railway**: Simple deployment with PostgreSQL

## 📞 Support

For issues or questions:
1. Check server logs for error messages
2. Verify database connection
3. Test email configuration
4. Ensure all environment variables are set correctly

##  License

ISC

---

**Ready to provide database credentials?** Update the `.env` file with your MySQL connection details and email service credentials, then run `npm run dev` to start the server!

**Note**: The provided code snippets are a simplified version of the actual backend API. The actual implementation may include additional features, error handling, and security measures not shown in this example. Always refer to the official documentation and source code for the most accurate information.

**mysql datebase?**

CREATE DATABASE IF NOT EXISTS `ireports_db`
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
USE `ireports_db`;

-- Users table
CREATE TABLE IF NOT EXISTS `Users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `profilePicture` VARCHAR(255),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incidents table (location and media use JSON)
CREATE TABLE IF NOT EXISTS `Incidents` (
  `id` CHAR(36) NOT NULL,
  `type` ENUM('red-flag','intervention') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `location` JSON NOT NULL,
  `media` JSON NOT NULL,
  `status` ENUM('draft','under-investigation','resolved','rejected') NOT NULL DEFAULT 'under-investigation',
  `adminComment` TEXT,
  `userId` CHAR(36) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_incidents_user_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `incidentId` CHAR(36) NOT NULL,
  `incidentTitle` VARCHAR(255) NOT NULL,
  `type` ENUM('status-update','comment-added','new-incident') NOT NULL,
  `message` TEXT NOT NULL,
  `oldStatus` ENUM('draft','under-investigation','resolved','rejected'),
  `newStatus` ENUM('draft','under-investigation','resolved','rejected'),
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_notifications_user_idx` (`userId`),
  INDEX `fk_notifications_incident_idx` (`incidentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




DELETE FROM Users WHERE email = 'mugerwashadrach@gmail.com';

INSERT INTO `Users` (`id`, `email`, `password`, `name`, `role`)
VALUES (
  UUID(),
  'mugerwashadrach@gmail.com',
  '$2b$10$wqQG5QyJ0C8nB6p1BH5lVuhJ0IspA1EoBB5oAqTjsFdpFz9EFfRcm', -- password: Admin@123
  'System Administrator',
  'admin'
);

SELECT * FROM Users WHERE email = 'mugerwashadrach@gmail.com';
UPDATE Users
SET role = 'admin'
WHERE email = 'shadz@gmail.com';


DELETE FROM Users WHERE email = 'shadz@gmail.com';

INSERT INTO `Users` (`id`, `email`, `password`, `name`, `role`)
VALUES (
  UUID(),
  'mugerwa@gmail.com',
  '$2b$10$wqQG5QyJ0C8nB6p1BH5lVuhJ0IspA1EoBB5oAqTjsFdpFz9EFfRcm',
  'System Administrator',
  'admin'
);


USE `ireports_db`;

SHOW TABLES;
SHOW CREATE TABLE media_files;

UPDATE Users
SET password = '$2a$10$jpQAoZdq7n/K3TuAgbciVeuymgQNTteYJG201Vcdzhj0DKDBzvt9.',
    role = 'admin',
    name = 'Site Administrator' -- optional, change if you want
WHERE email = 'mugerwashadrach@gmail.com';
SELECT * FROM incidents;
