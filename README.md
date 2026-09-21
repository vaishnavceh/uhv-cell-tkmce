# Universal Human Values (UHV) Cell — TKM College of Engineering (TKMCE)

An institutional-grade, full-stack web application and administrative Content Management System (CMS) purpose-built for the **Universal Human Values (UHV) Cell, TKM College of Engineering, Kollam, Kerala**.

Designed and implemented in full compliance with **AICTE Mandate G911** and the **National Education Policy (NEP)** for value-based engineering education and collegiate co-existence.

---

## 🏛️ System Architecture

The application is engineered as a production-grade TypeScript monorepo with separation of concerns:

```
├── apps/
│   ├── api/                     # NestJS 10 Enterprise REST API backend
│   │   ├── src/
│   │   │   ├── auth/            # JWT token rotation & RBAC guards
│   │   │   ├── objectives/      # Constitutional objectives module
│   │   │   ├── activities/      # SIP & FDP educational activities
│   │   │   ├── events/          # Institutional event management
│   │   │   ├── workshops/       # FDP & workshop metrics archive
│   │   │   ├── team/            # Cell coordinators & faculty roster
│   │   │   ├── resources/       # Curricular documents & download tracking
│   │   │   ├── gallery/         # Albums & photo collections
│   │   │   ├── announcements/   # Official circulars & urgent notices
│   │   │   ├── contact/         # Inbound communications & status workflow
│   │   │   ├── dashboard/       # Administrative metrics & telemetry
│   │   │   ├── audit/           # Audit trail logging
│   │   │   ├── users/           # Staff accounts & credentials
│   │   │   ├── roles/           # RBAC permissions definitions
│   │   │   ├── settings/        # Site configuration key-value storage
│   │   │   └── uploads/         # Local / S3 storage abstraction
│   │   └── Dockerfile
│   │
│   └── web/                     # React 18 + Vite + Tailwind CSS frontend
│       ├── public/assets/       # Transparent circular logos & college crests
│       ├── src/
│       │   ├── components/      # UI library (Buttons, Modals, Tables, etc.)
│       │   ├── context/         # AuthContext & state providers
│       │   ├── pages/
│       │   │   ├── public/      # 10 dedicated web section pages
│       │   │   └── admin/       # 15 administrative CMS interfaces
│       │   ├── sections/        # Modular portal components & WebSectionsHub
│       │   └── api/             # Axios client with refresh interceptor
│       └── Dockerfile
│
├── packages/
│   └── shared-types/            # Shared DTOs, interfaces, and TypeScript enums
│
├── prisma/
│   ├── schema.prisma            # 16 relational models & PostgreSQL enums
│   └── seed.ts                  # Comprehensive AICTE & TKMCE institutional seed
│
├── nginx/
│   └── nginx.conf               # Reverse proxy routing / -> web, /api/ -> backend
│
├── docker-compose.yml           # Multi-container development environment
└── docker-compose.prod.yml      # Multi-container production deployment
```

---

## 🌿 Brand & UI Theme

- **Palette**: Deep institutional green theme (`#064e3b`, `#047857`, `#022c22`, `#ecfdf5`) representing harmony with nature, ethics, and collegiate tradition, paired with subtle gold/botanical accents.
- **Official Emblem**: Background-removed circular logo featuring concentric atomic orbital rings, *"UNIVERSAL HUMAN VALUES"*, *"TK 1956"*, *"TKM VALUES IN LEARNING"*, and *"EXISTENCE IS CO-EXISTENCE"*.
- **Navigation Architecture**: Modular structure with dedicated URLs for all 10 core institutional functions, connected via an interactive **WebSectionsHub** and instant **SectionNavHeader**.

---

## 🌐 10 Dedicated Public Web Sections

| URL Route | Section Name | Description |
|---|---|---|
| `/` | **Portal Home** | Institutional Hero with circular logo + WebSectionsHub + live tab preview |
| `/about` | **About UHV** | Mandate G911 background, TKMCE heritage, 3 Foundational Pillars |
| `/objectives` | **Objectives** | Database-driven objectives with AICTE compliance badges |
| `/activities` | **Activities** | Student Induction (SIP), weekly meetings, community dialogues |
| `/events` | **Events** | Upcoming conferences, workshops, filters, and registration |
| `/workshops` | **Workshops** | Completed FDP archive, faculty/student participant metrics |
| `/team` | **Team Directory** | Coordinators, mentors, and designated departmental faculty |
| `/resources` | **Resource Library** | Official AICTE circulars, textbooks, downloads counter |
| `/gallery` | **Media Gallery** | Photo albums, lightbox preview, and event moments |
| `/announcements`| **Notices & Circulars** | Official college notifications, meeting minutes, urgent directives |
| `/contact` | **Contact Gateway** | Verified collegiate office details, map, and secure contact form |

---

## 🔐 Administrative CMS Modules (`/admin`)

Access restricted to authorized institutional personnel with 4-tier Role-Based Access Control (**SUPER_ADMIN**, **ADMIN**, **EDITOR**, **CONTENT_MANAGER**):

1. **Dashboard (`/admin`)**: Real-time operational metrics, unread queries, scheduled events, and live audit stream.
2. **Objectives Manager (`/admin/objectives`)**: AICTE educational goals order and visibility.
3. **Activities Manager (`/admin/activities`)**: Curricular and co-curricular module editor.
4. **Events Manager (`/admin/events`)**: Event scheduling, dates, venues, status, registration URLs.
5. **Workshops Manager (`/admin/workshops`)**: FDP outcomes and attendee statistics.
6. **Team Roster Manager (`/admin/team`)**: Verified coordinator directory with privacy safeguards.
7. **Resources & Docs (`/admin/resources`)**: Direct PDF/DOCX/PPTX file uploads (up to 25MB).
8. **Gallery Albums (`/admin/gallery`)**: Photo collections, image upload, captions.
9. **Announcements Manager (`/admin/announcements`)**: Institutional notifications and urgent alerts.
10. **Communications Inbox (`/admin/messages`)**: Inbound queries with resolution workflow (`NEW` → `READ` → `RESPONDED` → `ARCHIVED`).
11. **Staff Accounts (`/admin/users`)**: User provisioning, credential updates, account enablement (*SUPER_ADMIN only*).
12. **Roles & Permissions (`/admin/roles`)**: Complete RBAC matrix visualization.
13. **Audit Trail (`/admin/audit-logs`)**: Immutable security audit trail with JSON payload inspector.
14. **Site Settings (`/admin/settings`)**: Global site metadata, contact coordinates, announcement ticker.

---

## 🚀 Quick Start (Dockerized)

The entire application runs inside Docker containers. No local Node.js or PostgreSQL installation is required on the host.

### Prerequisites
- **Docker** (v20+)
- **Docker Compose** (v2+)

### Step 1: Clone and Inspect Environment
```bash
cp .env.example .env
```

### Step 2: Start Containers
```bash
docker compose up --build
```

This single command will automatically:
1. Boot PostgreSQL 16 database and wait for health checks.
2. Boot Redis 7 cache.
3. Generate Prisma client, push database schema, and run `prisma/seed.ts`.
4. Start NestJS REST API server on port 3000.
5. Start Vite React development server on port 5173.
6. Launch Nginx reverse proxy on port 80.

---

## 🔑 Default Credentials & Access Points

| Service | URL | Credentials |
|---|---|---|
| **Public Website** | [http://localhost](http://localhost) | Public Access |
| **Administrative CMS** | [http://localhost/admin/login](http://localhost/admin/login) | `admin@tkmce.ac.in` / `UHV_Tkmce@2026` |
| **API Swagger Docs** | [http://localhost/api/v1/docs](http://localhost/api/v1/docs) | Public / Bearer Auth |
| **Database GUI (Adminer)** | [http://localhost:8080](http://localhost:8080) | Server: `postgres`, User: `uhv_user`, DB: `uhv_db` |

> *Note: To launch Adminer, run `docker compose --profile tools up -d`.*

---

## 🔒 Security & Compliance

- **JWT Token Rotation**: 15-minute access token + 7-day refresh token with automatic token refresh in frontend interceptor.
- **Audit Logging**: Every mutation, deletion, creation, and login is recorded in the PostgreSQL `AuditLog` table with user attribution, IP address, and metadata diffs.
- **Upload Validation**: Extension, MIME-type, and 25MB file-size validation with sanitized unique UUID naming.
- **Protection**: Helmet security headers, CORS origin restrictions, and Throttler rate limiting (100 requests / 60 seconds).
- **Privacy Assurance**: Seed data and team directories maintain placeholders (*"Profile information to be updated"*) to avoid exposing unverified personal details.

---

## 📄 License & Attribution

Universal Human Values (UHV) Cell, TKM College of Engineering, Kollam, Kerala.
Developed in adherence to AICTE Induction Guidelines and the National Education Policy.
