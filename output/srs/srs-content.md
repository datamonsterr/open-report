# Software Requirements Specification<br/>MycoAI Retrieval System

**Document ID:** MYCOAI-SRS-2.0
**Version:** 2.0
**Status:** Approved
**Release Date:** 2026-05-29

**Author:** Engineering Team
**Reviewer:** Product Owner, Technical Lead
**Approver:** Project Sponsor

**Distribution:** Internal — Confidential

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 0.1 | 2026-05-15 | Engineering Team | Initial outline and actor identification |
| 1.0 | 2026-05-19 | MycoAI Project | First release: high-level actors, use cases, functional + nonfunctional requirements (LaTeX) |
| 2.0 | 2026-05-29 | Engineering Team | Complete rewrite: 25 use case specifications with full flow tables, sequence diagrams, entity model, REST API catalog, technical stack, assumptions log |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Actors](#3-actors)
4. [System Architecture](#4-system-architecture)
5. [Use Case Diagram](#5-use-case-diagram)
6. [Functional Requirements](#6-functional-requirements)
7. [Use Case Index](#7-use-case-index)
8. [Use Case Specifications — Authentication](#8-use-case-specifications--authentication)
9. [Use Case Specifications — Image Input](#9-use-case-specifications--image-input)
10. [Use Case Specifications — Segmentation](#10-use-case-specifications--segmentation)
11. [Use Case Specifications — Retrieval](#11-use-case-specifications--retrieval)
12. [Use Case Specifications — Visualization](#12-use-case-specifications--visualization)
13. [Use Case Specifications — Data Indexing](#13-use-case-specifications--data-indexing)
14. [Use Case Specifications — Data Management (CRUD)](#14-use-case-specifications--data-management-crud)
15. [Use Case Specifications — Feedback Pipeline](#15-use-case-specifications--feedback-pipeline)
16. [Use Case Specifications — Training](#16-use-case-specifications--training)
17. [Use Case Specifications — Administration](#17-use-case-specifications--administration)
18. [Sequence Diagrams](#18-sequence-diagrams)
19. [Data Requirements](#19-data-requirements)
20. [External Interface Requirements](#20-external-interface-requirements)
21. [Non-Functional Requirements](#21-non-functional-requirements)
22. [Technical Stack](#22-technical-stack)
23. [Appendices](#23-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for the MycoAI Retrieval System — a web-based platform for fungal species identification using computer vision and vector similarity search. The system enables mycologists and researchers to upload fungal colony images, automatically segment colonies, retrieve likely species from a curated reference database via Qdrant KNN search, and provide feedback to improve classification accuracy over time.

This document serves as the authoritative reference for design, development, and testing activities across the three-component monorepo: experiment pipeline (`fungal-cv-qdrant`), retrieval backend (`mycoai_retrieval_backend`), and scientist-facing frontend (`mycoai_retrieval_frontend`).

### 1.2 Scope

**In scope:**

- User authentication with role-based authorization (Normal User / Data Owner)
- Single-image and batch image upload with strain and growth medium metadata
- AI-powered colony segmentation (KMeans and Contour methods) with manual bounding-box editing and removal
- Vector-based species retrieval via Qdrant KNN search with configurable parameters: k (1-20), environment strategy (E1-E4), aggregation (weighted/uniform/manual_weighted)
- Feature extraction via 13 named vectors; default query vector: EfficientNetB1 fine-tuned (1280-dim)
- Ranked species results with confidence scores, expandable KNN neighbor detail, and interactive force-directed graph visualization (Phase 2)
- Data Owner workflows: index new data with known species labels, full CRUD on species/strains/images, soft-delete with archive/restore and trash management
- Feedback pipeline: user reporting of incorrect predictions, Data Owner review (accept/reject/defer), database correction, and Qdrant re-indexing trigger
- Training observation: manual trigger of re-index, fine-tune, and full retrain with real-time progress tracking, staged deployment, rollback, and A/B evaluation
- User management: role assignment enforcing at-least-one-Data-Owner invariant
- Immutable audit logging for all data-modifying operations
- Batch processing with Celery-based async jobs and client-side polling
- Vast.ai GPU on-demand integration for training workloads
- Overview dashboard with species distribution, media distribution, timeline, and learned vs unlearned status charts

**Out of scope:**

- Anonymous/public access (all classification workflows require authentication)
- Multi-tenant or organizational hierarchy beyond the two-role model
- Mobile native applications (responsive web only, desktop-first at 1280px+)
- Integration with external LIMS or laboratory information systems
- Automated/scheduled retraining (manual trigger only for MVP)
- Export to PDF or publication formats (CSV only for MVP)
- Inventory or physical sample tracking

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|-----------|
| BBox | Bounding box — rectangular region enclosing a detected colony |
| Colony | Visible fungal growth on a petri dish; the unit of segmentation |
| Strain | A specific fungal isolate grown on one medium (e.g., "DTO 148-D1") |
| Species | Taxonomic classification (e.g., *Penicillium commune*) |
| Medium / Media | Growth substrate from predefined set: MEA, CYA, YES, DG18, OA, CREA, PDA, CMA, SAB, M40Y |
| Segment | A cropped image of one detected colony from a source plate image |
| KNN | k-Nearest Neighbors — vector similarity search in Qdrant |
| Sibling Filtering | Excluding neighbor segments that originate from the same source image |
| Qdrant | Vector database storing multi-vector feature embeddings with metadata payload |
| Feature Extractor | Deep learning model converting an image segment into a fixed-dimension vector |
| Named Vectors | Qdrant capability: multiple embedding vectors per point (one per feature extractor) |
| KMeans | Segmentation via HSV color clustering (K=3) + spatial clustering |
| Contour | Segmentation via Canny edge detection + morphological close + circularity filter |
| Environment Strategy | Filter rule controlling which growth media are included in KNN search (E1-E4) |
| Aggregation Strategy | Method for combining KNN results into ranked species scores |
| JWT | JSON Web Token — stateless authentication |
| Celery | Distributed task queue for async background jobs |
| Vast.ai | GPU rental marketplace for training workloads |
| Species Weights | Per-species, per-extractor weighting configuration for ensemble aggregation |
| PII | Personally Identifiable Information |
| UC | Use Case |
| RFC 7807 | Problem Details for HTTP APIs — standard error response format |

### 1.4 References

| Ref | Document | Description |
|-----|----------|-------------|
| R1 | IEEE 830-1998 | Recommended Practice for Software Requirements Specifications |
| R2 | docs/feature_spec/01–08 | Eight ground-truth feature specifications (image-input through roles-and-permissions) |
| R3 | docs/technical_spec/00–12 | Thirteen technical decision documents (use-case-design through deployment) |
| R4 | fungal-cv-qdrant | Experiment repository: segmentation, feature extraction, cross-validation, Qdrant indexing |
| R5 | mycoai_retrieval_backend | FastAPI backend submodule implementing the retrieval product API |
| R6 | mycoai_retrieval_frontend | React 19 + Vite frontend submodule implementing the scientist UI |
| R7 | species_weights.json | Per-species feature extractor performance weights for ensemble aggregation |

---

## 2. Overall Description

### 2.1 Product Perspective

The MycoAI Retrieval System is a greenfield scientific web application operating within a monorepo that coordinates three git submodules:

| Component | Repository | Role |
|-----------|-----------|------|
| Experiment Pipeline | `repos/fungal-cv-qdrant/` | Research code: segmentation, feature extraction, Qdrant indexing, cross-validation. Generates artifacts consumed by product repos. |
| Retrieval Backend | `repos/mycoai_retrieval_backend/` | FastAPI REST API: retrieval orchestration, data management, feedback, training, auth. |
| Retrieval Frontend | `repos/mycoai_retrieval_frontend/` | React 19 SPA: scientist UI for upload, results, database, feedback, training dashboards. |

Shared runtime artifacts: `Dataset/` (images), `weights/` (checkpoints), `results/` (experiment outputs), `species_weights.json`, `.qdrant_storage/`.

**Product repos must not import from `fungal-cv-qdrant/`.** Feature extraction and segmentation invoke experiment scripts via subprocess (Celery tasks), with a long-term goal of extracting a shared `mycoai_ml` library.

### 2.2 Product Functions

| Function Category | Use Cases | Primary Actor(s) |
|------------------|-----------|-----------------|
| Authentication | UC-AUTH-01, UC-AUTH-02, UC-AUTH-03 | All users |
| Image Input | UC-IMG-01, UC-IMG-02 | Normal User, Data Owner |
| Segmentation | UC-SEG-01, UC-SEG-02, UC-SEG-03 | Normal User, Data Owner |
| Species Retrieval | UC-RET-01 | Normal User, Data Owner |
| Results Visualization | UC-VIZ-01, UC-VIZ-02 | Normal User, Data Owner |
| Data Indexing | UC-DATA-01 | Data Owner |
| Data Management (CRUD) | UC-DATA-02, UC-DATA-03, UC-DATA-04, UC-DATA-05 | Data Owner (write), All (read) |
| Feedback Pipeline | UC-FB-01, UC-FB-02, UC-FB-03 | Normal User (submit), Data Owner (review) |
| Training | UC-TRN-01, UC-TRN-02, UC-TRN-03, UC-TRN-04 | Data Owner |
| Administration | UC-ADM-01, UC-ADM-02 | Data Owner |

### 2.3 User Characteristics

| Role | Technical Level | Frequency | Primary Needs |
|------|----------------|-----------|---------------|
| Normal User (Researcher) | Mycologist; basic computer literacy | Weekly–daily | Upload images, identify isolates, review results, report errors |
| Data Owner | Mycologist + system administration | Daily | Manage database, review feedback, retrain models, manage users |

### 2.4 Constraints

| ID | Constraint |
|----|-----------|
| C-01 | Web application, desktop-first (1280px+ target), responsive to 1024px |
| C-02 | Browser: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| C-03 | Image formats: JPEG, PNG, TIFF; minimum 256x256; maximum 50MB |
| C-04 | Predefined growth media set (10 types, extensible) |
| C-05 | Two segmentation methods: KMeans (default), Contour |
| C-06 | Qdrant: single-node, single collection, cosine distance, 13 named vectors |
| C-07 | KNN: k=5 default, range 1-20 |
| C-08 | Deployment: Docker Compose on single VM |
| C-09 | Training: Vast.ai GPU on-demand; manual trigger only |
| C-10 | All data-modifying operations require JWT authentication |

### 2.5 Assumptions and Dependencies

| ID | Description | Impact if Invalid |
|----|-------------|-------------------|
| AS-01 | Qdrant collection pre-populated by fungal-cv-qdrant pipeline | Retrieval returns no results |
| AS-02 | Model weights (.pth) available at `weights/` | Feature extraction fails |
| AS-03 | Dataset directory follows canonical hierarchy under `Dataset/` | Upload pipeline fails |
| AS-04 | Vast.ai GPU instances available on demand | Fine-tune unavailable; re-index only |
| AS-05 | First registered user auto-assigned Data Owner | No admin exists |
| AS-06 | Species names unique (case-insensitive) | Retrieval ambiguity |
| AS-07 | PostgreSQL, Qdrant, Redis running via Docker Compose | Backend unavailable |
| AS-08 | Users have reliable internet and modern browsers | Degraded experience |

---

## 3. Actors

| Actor | Type | Description |
|-------|------|-------------|
| Normal User (Researcher) | Primary | Authenticated researcher. Uploads colony images, segments, retrieves species, views ranked results with confidence scores and neighbor details, submits feedback on incorrect predictions. Cannot modify reference data, trigger training, or manage users. |
| Data Owner | Primary | Authenticated super-user. All Normal User capabilities plus: indexes new data with known labels, full CRUD on species/strains/images, archive/restore, reviews and accepts/rejects/deferrs feedback, triggers and monitors training, deploys/rolls back models, manages user roles, views audit logs. At least one Data Owner must exist. |

---

## 4. System Architecture

![Diagram:architecture](diagrams/architecture-diagram.svg)

**Layers:**

| Layer | Technology | Components |
|-------|-----------|------------|
| Presentation | React 19 + Vite SPA | Upload Page, Results Page, Database Browser, Feedback Inbox, Training Dashboard, Admin Panel |
| API | FastAPI | 8 domain routers (auth, images, retrieval, species, strains, feedback, training, dashboard, admin) |
| Services | Python async | Segmentation, Feature Extraction, Retrieval, Qdrant Client, Training, Storage, Notification |
| Background | Celery + Redis | Segmentation Worker, Feature Extraction Worker, Training Worker, Batch Worker |
| Data | PostgreSQL 16 + Qdrant | 12 relational tables + 1 vector collection (13 named vectors) |
| Storage | Local filesystem | Dataset/ (images), weights/ (checkpoints), results/ (outputs) |
| External | Vast.ai GPU | On-demand training infrastructure |

---

## 5. Use Case Diagram

![Diagram:usecase](diagrams/usecase-diagram.svg)

**Key relationships:**

- **Upload & Classify** is the primary classification workflow — encompassing image upload, colony segmentation, feature extraction, Qdrant KNN search, and results visualization
- **Index Reference Data** extends Upload & Classify — reuses upload/segmentation UI with known-species label assignment
- **Submit & Review Feedback** extends Manage Database — corrections flow into data updates
- **Index Reference Data** triggers Manage Training — new reference data drives retraining

---

## 6. Functional Requirements

This section provides a summary index. Full flow-level specifications follow in sections 8–17.

### 6.1 Authentication

| ID | Requirement |
|----|------------|
| FR-AUTH-01 | Register with email, password (≥ 8 chars), name |
| FR-AUTH-02 | First registered user auto-assigned Data Owner role |
| FR-AUTH-03 | Login returns JWT access token (1h) + refresh token (30d) |
| FR-AUTH-04 | Refresh token endpoint: POST `/api/v1/auth/refresh` |
| FR-AUTH-05 | Logout revokes refresh token |
| FR-AUTH-06 | Password hashing: bcrypt, 12 rounds |
| FR-AUTH-07 | Rate limit: 5 login attempts/IP/minute |
| FR-AUTH-08 | Access token in JS memory; refresh token in httpOnly/Secure/SameSite=Strict cookie |

### 6.2 Image Input

| ID | Requirement |
|----|------------|
| FR-IMG-01 | Upload single image with strain ID + growth medium |
| FR-IMG-02 | Accept JPEG, PNG, TIFF; ≥ 256x256; ≤ 50MB |
| FR-IMG-03 | Show image preview before processing |
| FR-IMG-04 | Batch upload via folder structure with `template.json` + per-strain `metadata.csv` |
| FR-IMG-05 | AI-assisted column mapping for arbitrary CSV structures |
| FR-IMG-06 | Max colonies: default (model threshold) or integer 1-10 |
| FR-IMG-07 | Remove individual images from batch (undoable until processing) |
| FR-IMG-08 | Progress indicator during batch processing |
| FR-IMG-09 | Downloadable CSV after batch completion |

### 6.3 Segmentation

| ID | Requirement |
|----|------------|
| FR-SEG-01 | Auto-segment on upload: 1-3 bboxes + crops |
| FR-SEG-02 | Two methods: KMeans (default), Contour (configurable) |
| FR-SEG-03 | Bboxes as draggable/resizable overlays on source image |
| FR-SEG-04 | Add bbox (drag empty area), delete bbox (Delete key / remove button) |
| FR-SEG-05 | Segment removal with undo; enforce ≥ 1 segment |
| FR-SEG-06 | Batch review grid: approve/reject per image, jump-to-flagged |
| FR-SEG-07 | Re-crop on bbox edit; re-extract features before retrieval |
| FR-SEG-08 | Output: prepared.jpg, bbox visualization, pipeline visualization, segment crops |

### 6.4 Retrieval

| ID | Requirement |
|----|------------|
| FR-RET-01 | Default extractor: EfficientNetB1 fine-tuned (1280-dim) |
| FR-RET-02 | Qdrant KNN: k=5 default, range 1-20 |
| FR-RET-03 | Environment strategies: E1 (same medium, default), E2 (all), E3 (specific), E4 (exclude) |
| FR-RET-04 | Sibling filtering: exclude neighbors from same parent image |
| FR-RET-05 | Aggregation: weighted (default), uni, manual_weighted |
| FR-RET-06 | Multi-segment + multi-media aggregation per strain |
| FR-RET-07 | Return top-5 species with scores, neighbor details, thumbnail URLs |
| FR-RET-08 | Single-image query ≤ 5 seconds |
| FR-RET-09 | Handle: missing features (skip), zero results (empty), extractor failure (retry 3x), partial batch (return successful) |
| FR-RET-10 | Cache: per (segment_id, feature_type, k, env_strategy), 1h TTL, invalidate on re-index |
| FR-RET-11 | Async-first: Celery job with polling |

### 6.5 Results Visualization

| ID | Requirement |
|----|------------|
| FR-VIZ-01 | Ranked table: rank, species, score, color-coded bar (green/yellow/red) |
| FR-VIZ-02 | Expandable per-species KNN neighbor detail: per-media groups, scrollable thumbnails, lightbox |
| FR-VIZ-03 | Sortable by rank, score, species name |
| FR-VIZ-04 | CSV export |
| FR-VIZ-05 | Phase 2: force-directed KNN graph, configurable k/strategy, species colors, pan/zoom/hover |

### 6.6 Data Management

| ID | Requirement |
|----|------------|
| FR-DATA-01 | Data Owner uploads + indexes images with known species label (extends UC-RET-01) |
| FR-DATA-02 | Create species: unique name, optional description, reference images |
| FR-DATA-03 | Rename species: atomic bulk relabel + Qdrant re-index trigger |
| FR-DATA-04 | Filterable database browser: strain, species, media, date, source |
| FR-DATA-05 | Dashboard: total images, strains, species, media types; species pie, media bar, timeline, learned vs unlearned |
| FR-DATA-06 | Soft-delete (archive): excluded from Qdrant and training; metadata preserved |
| FR-DATA-07 | Archive warning: "N strains. Models must be retrained." |
| FR-DATA-08 | Trash: view archived, restore (re-index), permanent delete, empty trash with confirmation |
| FR-DATA-09 | Audit log all CRUD operations |

### 6.7 Feedback Pipeline

| ID | Requirement |
|----|------------|
| FR-FB-01 | Submit feedback from results view (source=query_result) or database (source=database_review) |
| FR-FB-02 | Feedback form: predicted species (auto), correct species (dropdown), required description, optional image |
| FR-FB-03 | Data Owner inbox: pending list, newest first, submitter/query/correction details |
| FR-FB-04 | Actions: accept, reject (required note), defer; bulk checkbox selection |
| FR-FB-05 | On accept: update strain species, mark Qdrant points inactive, queue re-index, notify submitter, audit log |
| FR-FB-06 | Feedback statistics: total, acceptance rate, review time, most misclassified species |
| FR-FB-07 | In-app bell notification + optional email on status change |

### 6.8 Training

| ID | Requirement |
|----|------------|
| FR-TRN-01 | Dashboard: model version, last trained, training set size, F1 score |
| FR-TRN-02 | Training history table: job ID, type, start/end, duration, status, changes |
| FR-TRN-03 | Three types: re-index (CPU), fine-tune (GPU), full retrain (GPU + re-index) |
| FR-TRN-04 | Pre-flight summary before trigger: N added, M archived, P feedback, estimated time |
| FR-TRN-05 | One training job at a time; show progress if active |
| FR-TRN-06 | Real-time progress: stage, epoch X/Y, loss/accuracy, ETA |
| FR-TRN-07 | Graceful cancel at epoch end |
| FR-TRN-08 | Notification on completion/failure |
| FR-TRN-09 | Staged deployment: review metrics → manual Deploy |
| FR-TRN-10 | Rollback: re-index with previous model weights |
| FR-TRN-11 | A/B evaluation: old vs new F1, per-species, confusion matrix |

### 6.9 Administration

| ID | Requirement |
|----|------------|
| FR-ADM-01 | RBAC: roles `user` (Normal) / `owner` (Data Owner) |
| FR-ADM-02 | Backend returns 403 Forbidden (unauthorized role) / 401 Unauthorized (unauthenticated) |
| FR-ADM-03 | Frontend hides unavailable UI elements by role |
| FR-ADM-04 | Promote/demote roles; enforce ≥ 1 Data Owner |
| FR-ADM-05 | Audit log all role changes |
| FR-ADM-06 | User management page: list users, roles |
| FR-ADM-07 | Filterable audit log view: entity type, entity ID, user, date range |

---

## 7. Use Case Index

| UC ID | Use Case | Primary Actor | Priority | Status |
|-------|----------|---------------|----------|--------|
| UC-AUTH-01 | Register Account | Guest | High | Specified |
| UC-AUTH-02 | Login | All Users | High | Specified |
| UC-AUTH-03 | Logout / Session Management | All Users | Medium | Specified |
| UC-IMG-01 | Upload Single Image | User, Owner | High | Specified |
| UC-IMG-02 | Batch Upload | User, Owner | High | Specified |
| UC-SEG-01 | Auto-Segment Colonies | System (automated) | High | Specified |
| UC-SEG-02 | Edit Bounding Boxes | User, Owner | High | Specified |
| UC-SEG-03 | Batch Segmentation Review | User, Owner | Medium | Specified |
| UC-RET-01 | Retrieve Species | User, Owner | High | Specified |
| UC-VIZ-01 | View Ranked Results | User, Owner | High | Specified |
| UC-VIZ-02 | KNN Graph Visualization | User, Owner | Medium | Specified (Phase 2) |
| UC-DATA-01 | Index New Data | Data Owner | High | Specified |
| UC-DATA-02 | Create Species | Data Owner | High | Specified |
| UC-DATA-03 | Rename Species | Data Owner | Medium | Specified |
| UC-DATA-04 | Browse Database | User, Owner | High | Specified |
| UC-DATA-05 | Archive and Restore Data | Data Owner | High | Specified |
| UC-FB-01 | Submit Feedback (Query Result) | User, Owner | High | Specified |
| UC-FB-02 | Submit Feedback (Database Entry) | User, Owner | Medium | Specified |
| UC-FB-03 | Review and Process Feedback | Data Owner | High | Specified |
| UC-TRN-01 | Re-index Qdrant | Data Owner | High | Specified |
| UC-TRN-02 | Fine-tune Model | Data Owner | Medium | Specified |
| UC-TRN-03 | Deploy Model | Data Owner | High | Specified |
| UC-TRN-04 | Rollback Model | Data Owner | Medium | Specified |
| UC-ADM-01 | Manage User Roles | Data Owner | High | Specified |
| UC-ADM-02 | View Audit Log | Data Owner | Medium | Specified |

---

## 8. Use Case Specifications — Authentication

### UC-AUTH-01: Register Account

| **UC ID:** UC-AUTH-01 | **Name:** Register Account |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Guest |
| **Description:** | Visitor creates a new user account with email, password, and name. The first registered user is automatically assigned the Data Owner role; subsequent registrations receive Normal User role. |
| **Trigger:** | User clicks "Register" on the login page. |
| **Preconditions:** | 1. User is not authenticated. 2. Email not already registered. |
| **Postconditions:** | 1. User account created. 2. User auto-logged in (access + refresh tokens returned). 3. If first user: role=`owner`; otherwise: role=`user`. |
| **Priority:** | High |
| **Frequency:** | Infrequent (account creation) |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User navigates to `/register` | |
| 2 | | System displays registration form: email, password, name |
| 3 | User fills form, submits | |
| 4 | | System validates: email format, password ≥ 8 chars, name not empty |
| 5 | | System checks email uniqueness |
| 6 | | System hashes password (bcrypt, 12 rounds) |
| 7 | | System creates user record; if first user, sets role=`owner` |
| 8 | | System generates JWT access + refresh tokens |
| 9 | | System sets refresh token in httpOnly cookie |
| 10 | | System redirects to upload page |

#### Exceptions

**EX.1: Email Already Registered**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System displays "An account with this email already exists." |
| EX.1.2 | | System offers link to login page |
| **Final state:** Registration form preserved; user may log in |

**EX.2: Validation Failure**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System highlights invalid fields with inline error messages |
| **Final state:** Form preserved with errors; user corrects and resubmits |

---

### UC-AUTH-02: Login

| **UC ID:** UC-AUTH-02 | **Name:** Login |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | Registered user authenticates with email and password. System returns JWT access token (1h) and refresh token (30d). |
| **Trigger:** | User enters credentials on `/login` and clicks "Log In". |
| **Preconditions:** | 1. User account exists. 2. Account is not deactivated. |
| **Postconditions:** | 1. Access token returned (1h TTL). 2. Refresh token set in httpOnly cookie (30d TTL). |
| **Priority:** | High |
| **Frequency:** | Daily per user |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User navigates to `/login` | |
| 2 | | System displays login form: email, password |
| 3 | User enters credentials, clicks "Log In" | |
| 4 | | System verifies email exists, bcrypt compares password |
| 5 | | System generates JWT access token (1h, HS256) |
| 6 | | System generates refresh token, stores hash in DB |
| 7 | | System sets refresh token as httpOnly/Secure/SameSite=Strict cookie |
| 8 | | System returns access token in response body |
| 9 | | System redirects to upload page |

#### Exceptions

**EX.1: Invalid Credentials**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System displays "Invalid email or password." |
| EX.1.2 | | System increments failed attempt counter for rate limiting |
| **Final state:** Login form preserved; rate limit enforced (5/IP/min) |

**EX.2: Rate Limit Exceeded**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System returns HTTP 429 "Too many login attempts. Try again in 1 minute." |
| **Final state:** User blocked for 60 seconds |

**EX.3: Account Deactivated**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System displays "This account has been deactivated. Contact a Data Owner." |
| **Final state:** Login rejected |

---

### UC-AUTH-03: Logout / Session Management

| **UC ID:** UC-AUTH-03 | **Name:** Logout / Session Management |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | User terminates the current session. System revokes the refresh token in the database and clears the client-side token. Multiple concurrent sessions are supported (multiple refresh tokens per user). |
| **Trigger:** | User clicks "Log Out" in the application header. |
| **Preconditions:** | User is authenticated. |
| **Postconditions:** | 1. Refresh token invalidated in DB. 2. Client tokens cleared. 3. User redirected to login page. |
| **Priority:** | Medium |
| **Frequency:** | Daily per user |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User clicks "Log Out" | |
| 2 | | System sends POST `/api/v1/auth/logout` with access token |
| 3 | | System identifies refresh token from cookie, marks as revoked in DB |
| 4 | | System clears httpOnly cookie (expiry=0) |
| 5 | | System returns 200 OK |
| 6 | | Client clears access token from memory, redirects to `/login` |

---

## 9. Use Case Specifications — Image Input

### UC-IMG-01: Upload Single Image

| **UC ID:** UC-IMG-01 | **Name:** Upload Single Image |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | Authenticated user uploads one fungal colony image, specifies strain identifier and growth medium, configures max colonies, and triggers segmentation. One image = one strain × one medium × N colonies. |
| **Trigger:** | User drops or selects an image on the Upload page. |
| **Preconditions:** | 1. User authenticated. 2. Image meets format/size constraints. |
| **Postconditions:** | 1. Image saved to Dataset/ storage. 2. Image record created in DB. 3. Celery segmentation task queued. 4. UI transitions to segmentation review. |
| **Priority:** | High |
| **Frequency:** | 10-100/day |
| **Includes:** | UC-SEG-01 |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User navigates to `/upload`, selects "Single Image" tab | |
| 2 | User drops image or clicks to browse | System shows image preview |
| 3 | User enters strain identifier (free text) | |
| 4 | User selects growth medium from dropdown (MEA, CYA, etc.) | |
| 5 | User optionally sets max colonies (1-10) or leaves "default (model threshold)" | |
| 6 | User clicks "Process" | |
| 7 | | System validates: image format, size ≥ 256x256, ≤ 50MB |
| 8 | | System saves image to `Dataset/uploads/{user_id}/{strain}/{media}/` |
| 9 | | System creates image record in DB (status: pending_segmentation) |
| 10 | | System dispatches Celery segmentation task |
| 11 | | System returns `{ image_id, job_id, status: pending_segmentation }` |
| 12 | | Client polls job status → transitions to segmentation review |

#### Exceptions

**EX.1: Invalid Image**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System highlights error: "Image must be JPEG, PNG, or TIFF, minimum 256x256, maximum 50MB." |
| **Final state:** Upload form preserved |

**EX.2: Missing Strain or Media**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System highlights required fields with inline validation errors |
| **Final state:** Form preserved |

---

### UC-IMG-02: Batch Upload

| **UC ID:** UC-IMG-02 | **Name:** Batch Upload |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | User uploads a folder containing multiple strains, each with metadata.csv and images. System parses `template.json` for column mappings and processes all images in parallel via Celery batch workers. |
| **Trigger:** | User uploads a batch folder on the Batch tab of the Upload page. |
| **Preconditions:** | 1. User authenticated. 2. Folder follows template structure. 3. `template.json` is valid. |
| **Postconditions:** | 1. All images saved. 2. Per-strain batch job created. 3. Batch preview shown. |
| **Priority:** | High |
| **Frequency:** | Weekly per research campaign |
| **Includes:** | UC-IMG-01 (per image) |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User selects "Batch" tab on Upload page | |
| 2 | User uploads folder containing `template.json` + strain subdirectories | |
| 3 | | System parses `template.json`, validates column_mapping and defaults |
| 4 | | System scans per-strain subdirectories, cross-references `metadata.csv` |
| 5 | | System displays batch preview: strain count, image count per strain, medium summary |
| 6 | User reviews batch preview, optionally removes individual images | |
| 7 | User clicks "Process Batch" | |
| 8 | | System creates batch job record (status: processing) |
| 9 | | System dispatches Celery batch task (parallel per-strain segmentation) |
| 10 | | System returns `{ batch_job_id, strain_count, image_count }` |
| 11 | | Client polls batch progress; on completion, redirects to results |

#### Exceptions

**EX.1: Invalid template.json**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System displays schema validation errors with line references |
| **Final state:** Upload halted; user fixes template |

**EX.2: Missing Files**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System lists missing files per strain: "strain_001: missing metadata.csv" |
| **Final state:** User may proceed with available data or fix folder |

---

## 10. Use Case Specifications — Segmentation

### UC-SEG-01: Auto-Segment Colonies

| **UC ID:** UC-SEG-01 | **Name:** Auto-Segment Colonies |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | System (automated), triggered by Normal User / Data Owner image upload |
| **Description:** | System automatically detects fungal colonies in a plate image using the configured segmentation method. KMeans clusters HSV pixels (K=3) then spatially separates colonies. Contour uses Canny edge detection + circularity filtering. Produces 1-3 bounding boxes and cropped segment images. |
| **Trigger:** | Image upload completed; Celery task dispatched by UC-IMG-01 or UC-IMG-02. |
| **Preconditions:** | 1. Source image available at Dataset path. 2. Method specified (default: KMeans). |
| **Postconditions:** | 1. 1-3 bboxes computed. 2. Segment crops saved to `prepared/{strain}/{media}/`. 3. Pipeline visualization generated. 4. Segment records created in DB. |
| **Priority:** | High |
| **Frequency:** | Per-image upload |
| **Special Requirements:** | Single image ≤ 3 seconds; segmentation method configurable per batch |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | Celery worker receives segmentation task { image_path, method, max_colonies } |
| 2 | | System preprocesses: petri dish detection, center crop to square, resize to 256x256 |
| 3 | | System runs segmentation method: KMeans (HSV K=3 → spatial clustering → bbox refinement) or Contour (Canny → morphological close → circularity filter → top-3) |
| 4 | | System refines bboxes: erosion, contour fitting, halo shrink |
| 5 | | System applies max_colonies limit: top-N by confidence (if set) |
| 6 | | System crops segment images from source at bbox coordinates |
| 7 | | System generates pipeline visualization: 3-panel (source | prepared | bbox) |
| 8 | | System creates segment records in DB |
| 9 | | System updates image status to "segments_ready" |
| 10 | | Client receives updated job status; transitions to segmentation review |

#### Exceptions

**EX.1: No Colonies Detected**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns empty bbox list; image status = "no_colonies_detected" |
| EX.1.2 | | System suggests user try Contour method or upload different image |
| **Final state:** Image marked; user may retry with Contour |

**EX.2: Segmentation Timeout**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System times out after 30s; marks image as failed |
| **Final state:** User notified; may retry |

---

### UC-SEG-02: Edit Bounding Boxes

| **UC ID:** UC-SEG-02 | **Name:** Edit Bounding Boxes |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | User reviews auto-detected bounding boxes on the source image, optionally resizes, repositions, adds, or deletes boxes. Edits are saved before proceeding to retrieval. Minimum 1 segment must remain. |
| **Trigger:** | Segmentation completes; bbox overlay displayed on results page. |
| **Preconditions:** | 1. Segmentation complete. 2. At least 1 bbox exists. |
| **Postconditions:** | 1. Updated bboxes persisted to DB. 2. Crops regenerated if bboxes modified. 3. User proceeds to retrieval. |
| **Priority:** | High |
| **Frequency:** | Per-image (most images require review) |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | System renders source image with bbox overlays |
| 2 | User inspects boxes, optionally: drags to move, drags corner handles to resize, clicks empty area to add new bbox, presses Delete or clicks X to remove a bbox | |
| 3 | User clicks "Save & Continue" | |
| 4 | | System validates ≥ 1 segment remains |
| 5 | | System saves updated bbox coordinates to DB |
| 6 | | System re-crops segments using new bboxes |
| 7 | | System transitions UI to retrieval query step |

#### Exceptions

**EX.1: All Segments Removed**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System rejects save: "At least one bounding box must remain." |
| **Final state:** User must keep or create at least 1 bbox |

---

### UC-SEG-03: Batch Segmentation Review

| **UC ID:** UC-SEG-03 | **Name:** Batch Segmentation Review |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | User reviews segmentation results across an entire batch in a grid layout. Quick-approve or flag images for later review. Navigate between images efficiently. |
| **Trigger:** | Batch processing completes all segmentations. |
| **Preconditions:** | 1. Batch job completed. 2. Multiple images with segmentations ready. |
| **Postconditions:** | 1. All approved images proceed to retrieval. 2. Flagged images deferred for later review. |
| **Priority:** | Medium |
| **Frequency:** | Per batch |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | System displays batch review grid: thumbnail + bboxes per image |
| 2 | User clicks checkmark on correctly segmented images | System marks as "approved" |
| 3 | User clicks flag on images needing later review | System marks as "flagged" |
| 4 | User clicks "Process Approved" | |
| 5 | | System submits approved images to retrieval pipeline |
| 6 | | System stores flagged images for later review |

---

## 11. Use Case Specifications — Retrieval

### UC-RET-01: Retrieve Species

| **UC ID:** UC-RET-01 | **Name:** Retrieve Species |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User / Data Owner |
| **Description:** | Given segmented colony images from a strain, extract visual features, query Qdrant KNN, aggregate results across segments and media, and return ranked species predictions with confidence scores and neighbor details. Full pipeline: upload → segment → extract → query → aggregate → rank. |
| **Trigger:** | User clicks "Process Retrieval" after confirming segmentation. |
| **Preconditions:** | 1. User authenticated. 2. Segmentation completed with ≥ 1 segment. 3. Qdrant collection populated. 4. Feature extractor weights available. |
| **Postconditions:** | 1. Retrieval job completed. 2. Ranked results saved to DB. 3. Results displayed to user with scores and neighbor details. |
| **Priority:** | High |
| **Frequency:** | 10-100/day |
| **Includes:** | UC-IMG-01, UC-SEG-01 |
| **Special Requirements:** | Single-image query ≤ 5 seconds; multi-image batch parallel via Celery groups; configurable k (1-20), aggregation (weighted/uni/manual_weighted), environment strategy (E1/E2/E3/E4). |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User clicks "Process Retrieval" on the segmentation review screen | |
| 2 | | System creates retrieval_job (type: single or batch, status: pending) |
| 3 | | System dispatches Celery retrieval task { image_id, k, aggregation, env_strategy } |
| 4 | | For each segment: extracts features (EfficientNetB1_finetuned, 1280-dim) |
| 5 | | Queries Qdrant: KNN search with specified k, cosine distance |
| 6 | | Applies environment strategy filter (E1 default: match query medium) |
| 7 | | Filters sibling segments (same parent_item_id) from results |
| 8 | | Aggregates neighbor results across segments and media using configured strategy |
| 9 | | Ranks species by aggregated score, selects top-5 |
| 10 | | Saves retrieval_results and retrieval_neighbors to DB |
| 11 | | Updates job status to "completed" |
| 12 | | Client polls job status; on completion: redirects to UC-VIZ-01 results view |

#### Alternative Course: Multi-Media Query

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1 | User uploads same strain on multiple media (MEA + CYA) | |
| AC.2 | | System groups images by strain; processes each independently |
| AC.3 | | Aggregation step 8 combines all neighbors from all images of the strain |
| **Resume:** Single ranked list for the strain across all media |

#### Exceptions

**EX.1: Feature Extraction Failure**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System retries extraction up to 3 times |
| EX.1.2 | | If all retries fail, marks segment as failed |
| EX.1.3 | | If all segments fail, returns error to user with diagnostics |
| **Final state:** Partial or no results |

**EX.2: Zero Qdrant Results**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System returns empty rankings with note: "No matching species found." |
| EX.2.2 | | System suggests trying E2 (all media) or reducing k |
| **Final state:** Empty results display |

---

## 12. Use Case Specifications — Visualization

### UC-VIZ-01: View Ranked Results

| **UC ID:** UC-VIZ-01 | **Name:** View Ranked Results |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | User views retrieval results as a ranked table with species name, confidence score, color-coded confidence bar. Clicks a species row to expand per-media KNN neighbor details with scrollable thumbnails and similarity scores. Sortable by rank, score, or species. Exportable as CSV. |
| **Trigger:** | Retrieval job completes; user redirected to `/results/{job_id}`. |
| **Preconditions:** | 1. Retrieval job completed. 2. Results exist in DB. |
| **Postconditions:** | 1. User views results. 2. May proceed to submit feedback (UC-FB-01). |
| **Priority:** | High |
| **Frequency:** | Per query |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | System loads results page: GET `/api/v1/retrieval/jobs/{id}/results` |
| 2 | | System renders ranked table: rank, species, score, color-coded bar |
| 3 | User clicks species row to expand | |
| 4 | | System renders per-media neighbor groups: horizontal scrollable thumbnails |
| 5 | | Each thumbnail shows: neighbor strain, species, similarity score |
| 6 | User clicks a thumbnail | System opens full-size image in lightbox |
| 7 | User clicks column header (Rank, Score, Species) | System re-sorts table |
| 8 | User clicks "Export CSV" | System downloads results CSV |

---

### UC-VIZ-02: KNN Graph Visualization (Phase 2)

| **UC ID:** UC-VIZ-02 | **Name:** KNN Graph Visualization |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | Interactive force-directed graph showing query strain at center, neighbor nodes colored by species, edges weighted by cosine similarity. Configurable k slider and weighted/uni toggle with real-time graph updates. Pan, zoom, hover, and click interactions. |
| **Trigger:** | User switches to "Graph View" tab on the results page. |
| **Preconditions:** | 1. Retrieval results available. 2. Phase 2 feature implemented. |
| **Postconditions:** | User explores retrieval neighborhood visually. |
| **Priority:** | Medium (Phase 2) |
| **Special Requirements:** | D3.js force-directed layout; species-based node colors; edge thickness ∝ similarity; responsive canvas. |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User clicks "Graph View" tab | |
| 2 | | System renders force-directed graph: query node center, neighbor nodes around |
| 3 | | Nodes colored by species, edges weighted by similarity |
| 4 | User adjusts k slider (1-20) | System re-queries with new k, updates graph in real-time |
| 5 | User toggles weighted/uni | System recalculates aggregation, updates edge widths |
| 6 | User hovers over node | System shows tooltip: strain + species + similarity |
| 7 | User clicks node | System expands neighbor detail panel |
| 8 | User pans/zooms | System re-renders viewport |

---

## 13. Use Case Specifications — Data Indexing

### UC-DATA-01: Index New Data

| **UC ID:** UC-DATA-01 | **Name:** Index New Data |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner uploads strain images of a known species for indexing into the Qdrant reference database. Reuses the upload, segmentation, and retrieval UI from UC-RET-01. Adds a species dropdown for label assignment. All 13 named vectors are extracted and upserted to Qdrant with species/strain/media payload. |
| **Trigger:** | Data Owner clicks "Index New Data" on the upload page. |
| **Preconditions:** | 1. Data Owner authenticated. 2. Target species exists in database. |
| **Postconditions:** | 1. Images and segments saved. 2. Feature vectors upserted to Qdrant. 3. qdrant_index_state updated. 4. Species strain/image counts updated in dashboard. |
| **Priority:** | High |
| **Frequency:** | Weekly (as new reference data becomes available) |
| **Extends:** | UC-RET-01 (reuses upload, segmentation, review workflows) |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner clicks "Index New Data" mode on Upload page | |
| 2 | Data Owner uploads image(s), enters strain identifier, selects medium | |
| 3 | Data Owner selects target species from dropdown | |
| 4 | | System reuses segmentation pipeline (UC-SEG-01) |
| 5 | Data Owner reviews and edits bounding boxes (UC-SEG-02) | |
| 6 | Data Owner clicks "Index Data" | |
| 7 | | System extracts features for all 13 named vectors per segment |
| 8 | | System upserts Qdrant PointStruct with all named vectors + payload (species, strain, media, source, parent_item_id) |
| 9 | | System creates image, segment, and qdrant_index_state records in DB |
| 10 | | System logs "index_data" to audit_log |
| 11 | | System displays confirmation: "N segments indexed for species X." |

#### Alternative Course: Batch Indexing

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1 | Data Owner uploads batch folder with species column in template.json | |
| AC.2 | | System indexes all images in parallel via Celery batch workers |
| **Resume:** Per-strain confirmation at batch completion |

---

## 14. Use Case Specifications — Data Management (CRUD)

### UC-DATA-02: Create Species

| **UC ID:** UC-DATA-02 | **Name:** Create Species |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner defines a new fungal species in the taxonomy. Species names must be unique (case-insensitive). |
| **Trigger:** | Data Owner clicks "Add Species" on the Database page. |
| **Preconditions:** | 1. Data Owner authenticated. 2. Species name not already in use. |
| **Postconditions:** | 1. Species record created. 2. Available in species dropdowns for indexing and feedback. |
| **Priority:** | High |
| **Frequency:** | Infrequent (taxonomy updates) |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner opens Database page, clicks "Add Species" | |
| 2 | | System opens creation modal |
| 3 | Data Owner enters species name, optional description | |
| 4 | Data Owner clicks "Create" | |
| 5 | | System validates name uniqueness (case-insensitive) |
| 6 | | System creates species record |
| 7 | | System logs "create_species" to audit_log |
| 8 | | System refreshes species list, shows new species |

#### Exceptions

**EX.1: Duplicate Name**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System displays "A species with this name already exists." |
| **Final state:** Modal preserved with field highlighted |

---

### UC-DATA-03: Rename Species

| **UC ID:** UC-DATA-03 | **Name:** Rename Species |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner renames a species (taxonomic update). All strains under that species are atomically relabeled. All affected Qdrant points are flagged for re-indexing. Warning shown before execution. |
| **Trigger:** | Data Owner clicks "Edit" on a species row, changes name, saves. |
| **Preconditions:** | 1. Data Owner authenticated. 2. New name is unique. |
| **Postconditions:** | 1. Species name updated. 2. All strain records relabeled (atomic). 3. Affected qdrant_index_state rows marked is_active=FALSE. 4. Data Owner prompted to re-index. |
| **Priority:** | Medium |
| **Frequency:** | Rare (taxonomic corrections) |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner opens species detail, clicks "Edit" | |
| 2 | Data Owner enters new name | |
| 3 | Data Owner clicks "Save" | |
| 4 | | System displays warning: "Renaming will relabel N strains and require re-indexing. Continue?" |
| 5 | Data Owner confirms | |
| 6 | | System atomically updates species name + all strain records within transaction |
| 7 | | System marks affected qdrant_index_state rows as is_active=FALSE |
| 8 | | System logs "rename_species" to audit_log |
| 9 | | System shows: "Species renamed. N strains updated. Trigger re-index to apply changes." |
| 10 | | System provides link to Training page (UC-TRN-01) |

---

### UC-DATA-04: Browse Database

| **UC ID:** UC-DATA-04 | **Name:** Browse Database |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User (read), Data Owner (read/write) |
| **Description:** | User browses and filters the database of species, strains, and images. Overview dashboard shows aggregate statistics with charts. Data Owner sees additional action menus (edit, archive, report issue). |
| **Trigger:** | User navigates to `/database` or `/dashboard`. |
| **Preconditions:** | 1. User authenticated. 2. Database contains records. |
| **Postconditions:** | User views filtered results. May drill into detail views. |
| **Priority:** | High |
| **Frequency:** | Daily |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User navigates to `/dashboard` or `/database` | |
| 2 | | System loads overview stats: total images, strains, species, media types |
| 3 | | System renders pie chart (species distribution), bar chart (media distribution), timeline chart |
| 4 | User applies filters: species dropdown, strain search, media checkboxes, date range, data source | |
| 5 | | System queries with filters, renders paginated data table |
| 6 | User clicks a strain row | System navigates to strain detail: images, segments, metadata |
| 7 | User clicks a species row | System navigates to species detail: strain list, image count |
| 8 | (Data Owner) User clicks action menu on a row | System shows: Edit, Archive, Report Issue buttons |

---

### UC-DATA-05: Archive and Restore Data

| **UC ID:** UC-DATA-05 | **Name:** Archive and Restore Data |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner archives (soft-deletes) species, strains, or images. Archived data is excluded from Qdrant queries and training but preserved with metadata. Data can be restored to active status or permanently deleted from trash. |
| **Trigger:** | Data Owner clicks "Archive" on a database entry. |
| **Preconditions:** | 1. Data Owner authenticated. 2. Entity is active (not already archived). |
| **Postconditions:** | 1. `is_archived=TRUE`, `archived_at` set. 2. Qdrant points marked inactive. 3. Entity visible in trash. |
| **Priority:** | High |
| **Frequency:** | Occasional |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner clicks "Archive" on a strain | |
| 2 | | System displays warning: "Archiving N strains. Models must be retrained for changes to take effect. [Continue] [Cancel]" |
| 3 | Data Owner clicks "Continue" | |
| 4 | | System sets is_archived=TRUE, archived_at=now() on strain and all child images/segments |
| 5 | | System updates qdrant_index_state: is_active=FALSE for all affected segments |
| 6 | | System deletes Qdrant points for archived segments |
| 7 | | System logs "archive_strain" to audit_log |
| 8 | | System refreshes database view, entity moved to trash |

#### Alternative Course: Restore from Trash

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1 | Data Owner navigates to Trash view | |
| AC.2 | Data Owner clicks "Restore" on an archived entity | |
| AC.3 | | System sets is_archived=FALSE, archived_at=NULL |
| AC.4 | | System displays: "Entity restored. Re-index to make it available for queries." |
| **Resume:** Data Owner may trigger re-index (UC-TRN-01) |

#### Alternative Course: Permanent Delete

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1 | Data Owner clicks "Delete Permanently" on trash item | |
| AC.2 | Data Owner confirms in modal | |
| AC.3 | | System deletes DB records (species, strains, images, segments) |
| AC.4 | | System deletes image files from Dataset/ storage |
| AC.5 | | System deletes Qdrant points |
| AC.6 | | System logs "permanent_delete" to audit_log |

---

## 15. Use Case Specifications — Feedback Pipeline

### UC-FB-01: Submit Feedback (Query Result)

| **UC ID:** UC-FB-01 | **Name:** Submit Feedback (Query Result) |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | User flags an incorrect species prediction from the retrieval results view. Submits the correct species (from dropdown or "other" free text) with a required description. |
| **Trigger:** | User clicks "Report Incorrect" on a result row. |
| **Preconditions:** | 1. User authenticated. 2. Retrieval results displayed. |
| **Postconditions:** | 1. Feedback record created (status: pending, source: query_result). 2. Data Owner notified. |
| **Priority:** | High |
| **Frequency:** | Several per day |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User clicks "Report Incorrect" on a species row | |
| 2 | | System opens feedback modal: predicted species (auto-filled), correct species dropdown, description field |
| 3 | User selects correct species from dropdown (or "other" + free text) | |
| 4 | User enters description explaining the correction | |
| 5 | User optionally uploads supporting image | |
| 6 | User clicks "Submit" | |
| 7 | | System validates description is non-empty |
| 8 | | System creates feedback record (source=query_result, status=pending) |
| 9 | | System notifies Data Owner via in-app bell |
| 10 | | System shows toast: "Feedback submitted. A Data Owner will review it." |

#### Exceptions

**EX.1: Empty Description**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System highlights description field: "A description is required." |
| **Final state:** Modal preserved |

---

### UC-FB-02: Submit Feedback (Database Entry)

| **UC ID:** UC-FB-02 | **Name:** Submit Feedback (Database Entry) |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Normal User, Data Owner |
| **Description:** | User flags an issue with an existing database entry (species, strain, or image) from the database browser, not from a retrieval result. Same feedback form, tracked with source=database_review. |
| **Trigger:** | User clicks "Report Issue" on a database entry detail view. |
| **Preconditions:** | 1. User authenticated. 2. Viewing database entry detail. |
| **Postconditions:** | 1. Feedback record created (source: database_review). |
| **Priority:** | Medium |
| **Frequency:** | Occasional |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User clicks "Report Issue" on a strain/image detail | |
| 2 | | System opens feedback form pre-populated with current species |
| 3 | User selects suggested correction, enters description | |
| 4 | User clicks "Submit" | |
| 5 | | System creates feedback record (source=database_review) |
| 6 | | System shows confirmation |

---

### UC-FB-03: Review and Process Feedback

| **UC ID:** UC-FB-03 | **Name:** Review and Process Feedback |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner reviews pending feedback items in the inbox. Each item shows submitter, query strain, predicted vs suggested, description, and link to original results. Data Owner accepts (corrects database, triggers re-index), rejects (records reason, no DB change), or defers (stays pending). Supports bulk actions. |
| **Trigger:** | Data Owner navigates to `/feedback/inbox`. |
| **Preconditions:** | 1. Data Owner authenticated. 2. Pending feedback exists. |
| **Postconditions:** | 1. If accepted: strain updated, Qdrant points flagged, re-index queued, submitter notified. 2. If rejected: reason recorded, submitter notified. 3. Audit log entry created. |
| **Priority:** | High |
| **Frequency:** | Weekly |

#### Main Flow (Accept)

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | System displays pending feedback list (newest first) |
| 2 | Data Owner clicks an item, reviews details | |
| 3 | Data Owner clicks "Accept" | System opens modal with optional review note |
| 4 | Data Owner enters note, clicks "Confirm Accept" | |
| 5 | | System updates strain.species_id → suggested species in transaction |
| 6 | | System marks affected qdrant_index_state rows: is_active=FALSE |
| 7 | | System queues Celery re-index task for affected segments |
| 8 | | System updates feedback: status=accepted, reviewed_at=now(), reviewer_id, review_note |
| 9 | | System logs "accept_feedback" to audit_log |
| 10 | | System creates in-app notification for submitter |
| 11 | | System removes item from inbox, updates statistics |

#### Alternative Course: Reject

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1 | Data Owner clicks "Reject" | System opens modal with required review note |
| AC.2 | Data Owner enters reason, clicks "Confirm Reject" | |
| AC.3 | | System updates feedback: status=rejected, review_note set |
| AC.4 | | System notifies submitter with rejection reason |
| **Final state:** No database changes; submitter informed |

#### Alternative Course: Defer

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1 | Data Owner clicks "Defer" | |
| AC.2 | | System keeps status=pending, adds optional note |
| **Final state:** Item remains in inbox for later review |

#### Alternative Course: Bulk Accept

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1 | Data Owner selects multiple items via checkboxes | |
| AC.2 | Data Owner clicks "Accept Selected" | |
| AC.3 | | System processes each feedback atomically; skips items with conflicting species assignments |
| AC.4 | | System reports: "N accepted, M skipped (species conflict)." |

---

## 16. Use Case Specifications — Training

### UC-TRN-01: Re-index Qdrant

| **UC ID:** UC-TRN-01 | **Name:** Re-index Qdrant |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner triggers re-extraction of features for all active segments and upserts them to Qdrant. Deletes archived points. Tracks progress in real-time. Used after adding images, updating labels, or archiving data. |
| **Trigger:** | Data Owner clicks "Re-index" on the Training Dashboard. |
| **Preconditions:** | 1. Data Owner authenticated. 2. No training job running. 3. Feature extractors available. |
| **Postconditions:** | 1. All active segments re-indexed in Qdrant. 2. Archived points deleted. 3. qdrant_index_state updated. 4. model_version incremented (patch). |
| **Priority:** | High |
| **Frequency:** | Weekly to monthly |
| **Special Requirements:** | Only one training job at a time; progress bar with stage/current/total/ETA |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner opens Training Dashboard | |
| 2 | | System displays pre-flight: N new strains since last train, M archived, P feedback accepted, estimated time |
| 3 | Data Owner clicks "Re-index" | |
| 4 | Data Owner confirms in modal | |
| 5 | | System creates training_job (type: reindex, status: running) |
| 6 | | Celery iterates active segments: extracts 13 named vectors, upserts to Qdrant, updates qdrant_index_state (last_updated, is_active=TRUE) |
| 7 | | Celery iterates archived segments: deletes Qdrant points, sets qdrant_index_state (is_active=FALSE) |
| 8 | Data Owner monitors progress | System polls progress: stage, current/total, ETA |
| 9 | | On completion: updates job status, model_version (patch bump), notifies Data Owner |
| 10 | Data Owner reviews summary | System shows: N indexed, M deleted, duration |

#### Exceptions

**EX.1: Training Job Already Running**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System blocks new trigger, shows progress of active job |
| **Final state:** Data Owner monitors existing job |

---

### UC-TRN-02: Fine-tune Model

| **UC ID:** UC-TRN-02 | **Name:** Fine-tune Model |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner triggers deep model fine-tuning on Vast.ai GPU. Prepares training dataset (active segment images, stratified by species), loads base model (EfficientNetB1, ImageNet weights), trains classification head for N species, saves weights, and evaluates on held-out set. Model is staged (not auto-deployed). |
| **Trigger:** | Data Owner clicks "Fine-tune Model" on Training Dashboard. |
| **Preconditions:** | 1. Data Owner authenticated. 2. Vast.ai GPU instance available. 3. Sufficient training data (≥ 50 new images recommended). |
| **Postconditions:** | 1. New model weights saved to `weights/`. 2. Evaluation metrics (F1, confusion matrix) recorded. 3. Model staged for deployment review. |
| **Priority:** | Medium |
| **Frequency:** | Monthly to quarterly |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner clicks "Fine-tune Model" | |
| 2 | | System shows pre-flight: training images count, estimated time on Vast.ai |
| 3 | Data Owner confirms | |
| 4 | | Celery provisions Vast.ai GPU instance |
| 5 | | System downloads training dataset to GPU instance |
| 6 | | System runs fine-tuning: load EfficientNetB1 base → add classification head → train |
| 7 | | System evaluates on held-out split, records F1 score |
| 8 | | System saves .pth weights to `weights/`, archives previous version |
| 9 | | System creates training_job record with evaluation metrics |
| 10 | Data Owner reviews results | System shows: new F1 vs old, confusion matrix, per-species accuracy |
| 11 | | System stages model; Data Owner may deploy (UC-TRN-03) or skip |

#### Exceptions

**EX.1: Vast.ai Instance Unavailable**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System notifies: "No GPU instances available. Try again later or configure different instance type." |
| **Final state:** Job cancelled; no resources consumed |

---

### UC-TRN-03: Deploy Model

| **UC ID:** UC-TRN-03 | **Name:** Deploy Model |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner reviews the evaluation metrics of a staged model and clicks "Deploy" to activate it. System re-indexes all segments with the new model weights. All subsequent queries use the new model. Previous model weights archived for rollback. |
| **Trigger:** | Data Owner clicks "Deploy vX.Y.Z" after reviewing staged model metrics. |
| **Preconditions:** | 1. Staged model exists with evaluation metrics. 2. Data Owner has reviewed metrics. |
| **Postconditions:** | 1. All segments re-indexed with new weights. 2. model_version updated. 3. is_deployed=TRUE on training_job. 4. All future queries use new model. |
| **Priority:** | High |
| **Frequency:** | Monthly |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner reviews staged model: F1 0.92 vs current 0.89 | |
| 2 | Data Owner clicks "Deploy vX.Y.Z" | |
| 3 | Data Owner confirms: "Deploying will re-index all segments. Queries will use the new model." | |
| 4 | | System runs re-index (same as UC-TRN-01) using new model weights |
| 5 | | On completion: updates model_version, is_deployed=TRUE |
| 6 | | System marks previous model as archived (weights kept for rollback) |
| 7 | | System notifies Data Owner: "Model vX.Y.Z deployed. Previous model vX.Y.W available for rollback." |

---

### UC-TRN-04: Rollback Model

| **UC ID:** UC-TRN-04 | **Name:** Rollback Model |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner rolls back to a previous model version. System re-indexes all segments with the archived model weights. Used when a newly deployed model performs worse than expected. |
| **Trigger:** | Data Owner clicks "Rollback" on Training Dashboard, selects previous version. |
| **Preconditions:** | 1. Previous model version weights archived in `weights/archive/`. 2. Data Owner authenticated. |
| **Postconditions:** | 1. All segments re-indexed with previous weights. 2. model_version reverted. 3. Previous "bad" model kept archived. |
| **Priority:** | Medium |
| **Frequency:** | Rare |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner clicks "Rollback" | |
| 2 | | System shows dropdown of archived model versions with dates and F1 scores |
| 3 | Data Owner selects v3.2.0 (F1 0.89), clicks "Rollback to v3.2.0" | |
| 4 | Data Owner confirms | |
| 5 | | System re-indexes all segments using v3.2.0 weights |
| 6 | | System updates model_version to v3.2.0 |
| 7 | | System logs rollback to audit_log |
| 8 | | System notifies Data Owner of completion |

---

## 17. Use Case Specifications — Administration

### UC-ADM-01: Manage User Roles

| **UC ID:** UC-ADM-01 | **Name:** Manage User Roles |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner views all registered users, promotes Normal Users to Data Owner, and demotes Data Owners to Normal User. Enforces the invariant that at least one Data Owner must exist at all times. All role changes are logged. |
| **Trigger:** | Data Owner navigates to `/admin/users`. |
| **Preconditions:** | 1. Data Owner authenticated. |
| **Postconditions:** | 1. User role updated. 2. Invariant enforced (≥ 1 owner). 3. Audit log entry created. |
| **Priority:** | High |
| **Frequency:** | Rare |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | System displays user table: name, email, role, join date |
| 2 | Data Owner clicks role badge on a user row | |
| 3 | Data Owner selects new role from dropdown (user ↔ owner) | |
| 4 | | System validates invariant: if demoting last owner, rejects |
| 5 | | System updates role in DB |
| 6 | | System logs "change_role" to audit_log |
| 7 | | System refreshes table |

#### Exceptions

**EX.1: Demoting Last Data Owner**

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System displays: "Cannot demote. At least one Data Owner must exist. Promote another user first." |
| **Final state:** Role unchanged |

---

### UC-ADM-02: View Audit Log

| **UC ID:** UC-ADM-02 | **Name:** View Audit Log |
| **Created By:** Engineering Team | **Last Updated:** 2026-05-29 |

| **Actor:** | Data Owner |
| **Description:** | Data Owner views the immutable audit trail of all data-modifying operations. Filters by entity type, entity ID, user, action, and date range. |
| **Trigger:** | Data Owner navigates to `/admin/audit-log`. |
| **Preconditions:** | 1. Data Owner authenticated. 2. Audit log contains entries. |
| **Postconditions:** | Data Owner views filtered audit entries. |
| **Priority:** | Medium |
| **Frequency:** | On demand |

#### Main Flow

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | System displays paginated audit log table: timestamp, user, action, entity type, entity ID |
| 2 | Data Owner applies filters: entity type (species/strain/image/feedback/user), user, date range | |
| 3 | | System queries with filters, returns matching entries |
| 4 | Data Owner clicks an entry to expand | System shows changes JSONB with old → new values |

---

## 18. Sequence Diagrams

### 18.1 UC-RET-01: Retrieve Species

![Diagram:sequence](diagrams/sd-UC-RET-01.svg)

*Covers: upload → segmentation → bbox editing → feature extraction → Qdrant KNN → aggregation → ranked results display. Participants: Researcher, React Frontend, FastAPI Backend, Celery Worker, Segmentation, Feature Extractor, Qdrant DB, PostgreSQL.*

### 18.2 UC-FB-03: Review and Process Feedback

![Diagram:sequence](diagrams/sd-UC-FB-01.svg)

*Covers: feedback submission → Data Owner inbox review → accept (database update + re-index queue → Celery re-index) + submitter notification. Participants: Researcher, Data Owner, Frontend, Backend, PostgreSQL, Qdrant, Celery.*

### 18.3 UC-TRN-01/02/03: Training Lifecycle

![Diagram:sequence](diagrams/sd-UC-TRN-01.svg)

*Covers: training trigger → pre-flight check → re-index progress loop → optional Vast.ai GPU fine-tune → evaluation → staged deployment → rollback. Participants: Data Owner, Frontend, Backend, Celery Worker, Vast.ai GPU, File Storage, Qdrant, PostgreSQL.*

---

## 19. Data Requirements

### 19.1 Entity Relationship Diagram

![Diagram:class](diagrams/class-diagram.svg)

### 19.2 Database Schema Summary

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| users | id, email (unique), password_hash, name, role (user/owner), is_active | First user → owner |
| refresh_tokens | id, user_id (FK), token_hash, expires_at | Multiple per user |
| species | id, name (unique), description, is_archived, archived_at | Case-insensitive name |
| strains | id, species_id (FK), name, source (enum), is_archived | UNIQUE(name, species_id) |
| images | id, strain_id (FK), media (enum), angle, file_path, is_archived | Links to file storage |
| segments | id, image_id (FK), segment_index, crop_path, bbox_x/y/w/h, segmentation_method, qdrant_point_id | UNIQUE(image_id, segment_index) |
| retrieval_jobs | id, user_id (FK), job_type, status, config (JSONB) | Tracks async queries |
| retrieval_results | id, job_id (FK), strain_name, rank, species_name, score | Per-species ranking |
| retrieval_neighbors | id, result_id (FK), neighbor_strain, neighbor_species, similarity, media | KNN detail per rank |
| feedback | id, submitter_id (FK), reviewer_id (FK), source, predicted, suggested, description, status | pending/accepted/rejected/deferred |
| training_jobs | id, triggered_by (FK), job_type, status, progress (JSONB), model_version, is_deployed | reindex/finetune/full_retrain |
| audit_log | id (bigserial), user_id (FK), action, entity_type, entity_id, changes (JSONB), ip_address | Immutable append-only |
| qdrant_index_state | id, segment_id (FK), qdrant_point_id, collection_name, indexed_at, is_active | Tracks Qdrant sync state |

### 19.3 Data Retention

| Category | Period | Rationale |
|---------|--------|-----------|
| User accounts | Until deletion + 30d | Data minimization |
| Species/Strains/Images | Until permanent delete | Scientific reference |
| Archived data (trash) | Until manual purge | Allow undo |
| Retrieval jobs/results | 90 days | Storage optimization |
| Feedback | Indefinite | Quality tracking |
| Training jobs | Indefinite | Reproducibility |
| Audit logs | Indefinite | Compliance |

### 19.4 Qdrant Schema

**Collection:** `myco_fungi_features_full_finetuned`
**Distance:** Cosine
**13 Named Vectors:**

| Vector Name | Dim | Extractor |
|------------|-----|-----------|
| EfficientNetB1_finetuned | 1280 | Default query vector |
| ResNet50_finetuned | 2048 | Fine-tuned ResNet50 |
| MobileNetV2_finetuned | 1280 | Fine-tuned MobileNetV2 |
| ViT_finetuned | 768 | Vision Transformer |
| efficientnetb1_triplet | 1280 | Triplet-loss variant |
| resnet50 | 2048 | ResNet50 (ImageNet) |
| mobilenetv2 | 1280 | MobileNetV2 (ImageNet) |
| efficientnetb1 | 1280 | EfficientNetB1 (ImageNet) |
| colorhistogramhsconcatresnet50 | 2112 | Combined HS + ResNet50 |
| colorhistogramhs | 64 | HSV histogram (H+S) |
| colorhistogram | 96 | RGB histogram |
| hog | dynamic | HOG descriptors |
| gabor | 32 | Gabor filter banks |

**Payload:** `{ species, strain, parent_item_id, environment, source, segment_index, img_path }`

---

## 20. External Interface Requirements

### 20.1 REST API

All endpoints prefixed with `/api/v1/`. Response format: JSON. Error format: RFC 7807.

#### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Create account (first user → owner) |
| POST | `/auth/login` | None | Login → access + refresh tokens |
| POST | `/auth/refresh` | Refresh | Get new access token |
| POST | `/auth/logout` | Access | Revoke refresh token |
| GET | `/auth/me` | Access | Current user profile |

#### Images

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/images/upload` | User | Single image (multipart) |
| POST | `/images/batch` | User | Batch folder upload |
| GET | `/images/{id}` | User | Image detail + segments |
| PATCH | `/images/{id}/segments` | User | Update bboxes |
| DELETE | `/images/{id}` | Owner | Archive image |

#### Retrieval

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/retrieval/query` | User | Start async retrieval job |
| GET | `/retrieval/jobs/{id}` | User | Job status |
| GET | `/retrieval/jobs/{id}/results` | User | Ranked results |
| POST | `/retrieval/query-sync` | User | Synchronous query |

#### Species & Strains

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/species` | User/Owner | List / Create species |
| GET/PATCH/DELETE | `/species/{id}` | User/Owner | CRUD species |
| GET/POST | `/strains` | User/Owner | List / Create strains |
| GET/DELETE | `/strains/{id}` | User/Owner | Strain detail / Archive |

#### Feedback

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/feedback` | User | Submit feedback |
| GET | `/feedback` | User | My submitted feedback |
| GET | `/feedback/inbox` | Owner | Pending review inbox |
| PATCH | `/feedback/{id}` | Owner | Accept/reject/defer |
| POST | `/feedback/batch` | Owner | Bulk action |

#### Training

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/training/status` | User | Current model info |
| GET | `/training/jobs` | Owner | Training history |
| POST | `/training/trigger` | Owner | Start retraining |
| GET | `/training/jobs/{id}` | Owner | Job progress |
| POST | `/training/jobs/{id}/cancel` | Owner | Cancel job |
| POST | `/training/jobs/{id}/deploy` | Owner | Deploy model |
| POST | `/training/rollback` | Owner | Rollback model |

#### Dashboard & Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/stats` | User | Overview counts |
| GET | `/dashboard/charts/*` | User | Species/media/timeline data |
| GET | `/dashboard/qdrant-status` | User | Learned vs unlearned |
| GET | `/admin/users` | Owner | User list |
| PATCH | `/admin/users/{id}/role` | Owner | Change role |
| GET | `/admin/audit-log` | Owner | Audit trail |

### 20.2 Pagination, Filtering, Sorting

- Pagination: offset-based (`?offset=0&limit=50`). Response: `{ items, total, offset, limit }`.
- Filtering: `?species_id=xxx&media=MEA&is_archived=false&search=DTO&source=curated_primary`.
- Sorting: `?sort_by=name&sort_order=asc`.

### 20.3 User Interfaces

| Interface | Platform | Description |
|-----------|----------|-------------|
| Web SPA | Desktop (1280px+) | Sidebar + content layout, shadcn/ui + Tailwind v4 |
| Upload Page | Desktop | Dropzone, single/batch tabs, metadata form, max colonies slider |
| Segmentation Editor | Desktop | SVG canvas bbox overlay, drag/resize/add/delete |
| Results Page | Desktop | Ranked table, confidence bars, expandable neighbors, lightbox |
| Database Browser | Desktop | Filterable table, Recharts charts, pagination |
| Feedback Inbox | Desktop | Sortable list, bulk checkboxes, review modals |
| Training Dashboard | Desktop | Progress bars, stage indicators, deploy/rollback controls |

---

## 21. Non-Functional Requirements

### 21.1 Performance

| Metric | Target (P95) | Context |
|--------|-------------|---------|
| Single-image retrieval | ≤ 5 seconds | Upload → results displayed |
| Single-image segmentation | ≤ 3 seconds | KMeans on 256x256 image |
| Feature extraction per segment | ≤ 500ms | EfficientNetB1 inference |
| Qdrant KNN query | ≤ 200ms | k=5, 1280-dim, cosine |
| Batch processing (100 images) | ≤ 5 minutes | Parallel Celery tasks |
| API response (CRUD) | ≤ 200ms | Auth, species, feedback endpoints |
| Page load (SPA initial) | ≤ 2 seconds | Code-split routes |
| SPA navigation | ≤ 500ms | Subsequent route changes |
| Concurrent users | 50 simultaneous | MVP target |

### 21.2 Security

| Control | Implementation |
|---------|---------------|
| Authentication | JWT (HS256): access 1h, refresh 30d. python-jose + passlib (bcrypt 12 rounds) |
| Authorization | RBAC: `user` / `owner`. Backend enforcement on every protected endpoint |
| Token storage | Access: JS memory (not localStorage). Refresh: httpOnly/Secure/SameSite=Strict cookie |
| Transport | TLS 1.3 (external HTTPS). Docker internal network for inter-service |
| Password hashing | bcrypt, 12 rounds. Never logged |
| Rate limiting | 5 login/IP/min; 100 req/IP/min general (slowapi + Redis) |
| SQL injection | SQLAlchemy parameterized queries exclusively |
| File upload | MIME validation; 50MB size limit |
| CORS | Restricted to known frontend origins |
| CSRF | SameSite=Strict cookies; Authorization header-based token |
| Secrets | .env (dev) / Docker secrets (prod); no hardcoded values |
| Network | PostgreSQL, Qdrant, Redis not exposed externally (Docker internal) |

### 21.3 Reliability

| Metric | Target |
|--------|--------|
| API uptime | 99.5% (≤ 3.65h downtime/month, MVP) |
| Data durability | PostgreSQL WAL; Qdrant recoverable via re-index |
| RPO | ≤ 1 hour (database backups); re-indexable (Qdrant) |
| RTO | ≤ 1 hour (API); ≤ 24 hours (full Qdrant re-index) |
| Graceful degradation | Classification works if training/feedback unavailable |
| Idempotency | Duplicate queries return original results |
| Backup | pg_dump daily; rclone sync to Google Drive; Qdrant snapshot weekly |

### 21.4 Usability

- Desktop-first (1280px+), responsive sidebar to 1024px
- shadcn/ui component library, Tailwind v4, consistent design language
- Inline form validation (React Hook Form + Zod)
- Undo: segment removal (30s window), batch image removal, bbox edits
- Skeleton loading states for data fetches
- Toast notifications (Sonner) for async operation results
- Accessibility: WCAG 2.1 AA target
- Keyboard-navigable bounding-box editing
- CSV export for results and database views

### 21.5 Maintainability

- Monorepo: three submodules, independent versioning, shared contracts via docs/
- Domain-based backend package: `api/`, `core/`, `models/`, `schemas/`, `services/`, `repos/`, `tasks/`
- Alembic migrations auto-generated from SQLAlchemy model diffs
- Structured JSON logging with request IDs
- API versioning: `/api/v1/` prefix
- CI (GitHub Actions): lint (ruff/ESLint), typecheck (mypy/TypeScript), test (pytest), build
- CD: manual deploy via Docker Compose pull + up on VM

---

## 22. Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | FastAPI | Async, Pydantic, OpenAPI docs |
| Database | PostgreSQL 16 | SQLAlchemy 2.0 async, asyncpg, Alembic |
| Vector DB | Qdrant | Single-node Docker, 13 named vectors, cosine |
| File Storage | Local filesystem | S3 migration planned |
| Image Processing | OpenCV + NumPy | KMeans/Contour segmentation |
| Frontend | React 19 + Vite | shadcn/ui + Tailwind v4 |
| Routing | React Router v7 | `createBrowserRouter` |
| Data Fetching | TanStack Query | Caching, retry, polling |
| Forms | React Hook Form + Zod | Type-safe validation |
| Charts | Recharts + D3.js | Pie/bar/line + force-directed graph |
| Upload | react-dropzone | Drag-and-drop, preview |
| BBox | Custom SVG overlay | Lightweight, draggable |
| Task Queue | Celery + Redis | Async segmentation, extraction, training |
| Auth | JWT + python-jose + passlib | HS256, bcrypt 12 rounds |
| Deployment | Docker Compose | Single VM, all services |
| CI/CD | GitHub Actions | Lint → typecheck → test → build |
| Training GPU | Vast.ai | On-demand, GPU rentals |
| Python | 3.13 | via mise + uv |
| Node | 25 | via mise |
| Package Managers | uv (Python), pnpm (Node) | Monorepo tooling |
| Cloud Sync | rclone | Google Drive ↔ local filesystem |

---

## 23. Appendices

### Appendix A: End-to-End Data Flow

![Diagram:flow](diagrams/flow-diagram.svg)

### Appendix B: Assumptions Log

| ID | Assumption | Status | Impact |
|----|-----------|--------|--------|
| AS-01 | Qdrant collection pre-populated | Accepted | No retrieval without it |
| AS-02 | Model weights available at `weights/` | Accepted | Feature extraction fails |
| AS-03 | Dataset follows canonical hierarchy | Accepted | Upload pipeline fails |
| AS-04 | Vast.ai GPU instances available | Accepted | Fine-tune unavailable |
| AS-05 | First user = Data Owner (auto) | Accepted | No admin exists |
| AS-06 | Species names unique (case-insensitive) | Accepted | Retrieval ambiguity |
| AS-07 | Docker services started before backend | Accepted | Backend startup fails |
| AS-08 | Users have modern browsers | Accepted | Degraded UI |
| AS-09 | Image quality sufficient (clear plates, 256x256+) | At risk | Poor segmentation |
| AS-10 | ≥ 4-7 strains/species for reliable KNN | At risk | Low accuracy |

### Appendix C: Open Issues

| ID | Description | Owner | Priority | Status |
|----|-------------|-------|----------|--------|
| OI-01 | Extract feature extraction into shared `mycoai_ml` library | Architecture | Medium | Open |
| OI-02 | Migration from local FS to S3-compatible storage | Infrastructure | Medium | Open |
| OI-03 | Auto-scheduled retraining (weekly / threshold-based) | Product | Medium | Open |
| OI-04 | Passkey/WebAuthn authentication | Security | Low | Open |
| OI-05 | Internationalization (i18n) | Product | Low | Open |
| OI-06 | "Contributor" role between Normal User and Data Owner | Product | Low | Open |
| OI-07 | Anonymous/public species list access | Product | Low | Open |
| OI-08 | Species rename: re-index or full fine-tune? | Architecture | High | Resolved: re-index sufficient |
| OI-09 | Multi-currency / billing support | Product | N/A | Closed (scientific tool) |

### Appendix D: Glossary of Growth Media

| Code | Full Name |
|------|-----------|
| MEA | Malt Extract Agar |
| CYA | Czapek Yeast Extract Agar |
| YES | Yeast Extract Sucrose Agar |
| DG18 | Dichloran Glycerol Agar |
| OA | Oatmeal Agar |
| CREA | Creatine Sucrose Agar |
| PDA | Potato Dextrose Agar |
| CMA | Corn Meal Agar |
| SAB | Sabouraud Dextrose Agar |
| M40Y | Malt Extract 40% Yeast Extract Agar |
