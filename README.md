# URL Shortener

A production-ready URL shortener backend built with Node.js, Express, and MongoDB.

This project implements authentication, atomic ID generation, analytics tracking, lifecycle management, and abuse protection.

---

##  Features

###  Authentication
- User registration & login (JWT-based)
- Protected routes
- Ownership validation

###  Core Shortening Engine
- Atomic counter for unique IDs
- Base62 encoding for short codes
- Indexed `shortCode` for fast lookup
- 302 redirect for analytics tracking

###  Analytics System
- Asynchronous click event logging
- Separate Click collection
- Per-day aggregation using MongoDB pipelines
- Hybrid model (denormalized total + event logs)

###  Link Lifecycle Management
- Toggle active / inactive links
- Expiration support
- Delete with cascade cleanup
- Ownership-based access control

### 🛡 Security & Abuse Protection
- Rate limiting for link creation
- Rate limiting for redirect endpoint
- Environment variable protection
- Centralized error handling

---
