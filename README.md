# iReporter

**iReporter** — A simple reporting platform built for the Andela project .  
Proudly developed in collaboration by **Shadrach** and **Charllotte**.

## Project Summary
iReporter allows users to create, view, and manage incident reports (text, images, location). It demonstrates CRUD operations, authentication, responsive UI, and RESTful API integration — all implemented as part of the Andela project submission.

## Features
- User registration and login (JWT/session based)
- Create, edit, delete incident reports
- Upload images for reports
- Filter and search reports by category and location
- Responsive UI for desktop, tablet, and mobile
- RESTful API endpoints for all main actions
- Basic input validation and client-side feedback

## Tech Stack
- Frontend: HTML, CSS, JavaScript  React typscript
- Backend: Node.js + Express js
- Database: mysql
- Deployment:  Vercel  




Copyright (c) 2025 Shadrach and Charllotte

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.







































"# co-ireporter" 

updated,signup,signin,
AuthContext in fron and datacontext

Validation, Error Handling & Testing Create input validation and sanitization
middleware for all routes. Implement global error handling. Test all
endpoints with frontend integration. Optimize performance and security.


Incident Model & CRUD (Part 1) Create Incident model with id, type, title, description, 
location, status, images, createdBy, timestamps. Implement Create Incident endpoint with 
validation and file upload restrictions. Configure Multer middleware

Day 3 – Database Design Design MySQL database schema: Users, Roles, Incidents,
Files, OTPs. Set up database connection in JavaScript. Create migration or SQL
script for initial tables.

