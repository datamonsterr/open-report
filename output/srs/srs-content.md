# Software Requirements Specification (SRS)
# MycoAI Fungal Species Identification Platform

**Version:** 1.0  
**Date:** 2026-06-02  
**Author:** SRS Generator  
**Status:** Draft  

---

## 1. Introduction

### 1.1 Purpose
MycoAI is a fungal species identification platform that combines computer vision, vector similarity search, and a scientist-facing web application. Researchers upload Petri dish plate images of fungal colonies; the system segments individual colonies, extracts feature embeddings via deep learning models (ResNet50, EfficientNetB1, ViT), stores them in a Qdrant vector database, and retrieves species matches via k-NN similarity search.

### 1.2 Scope
This SRS covers the web application platform comprising:
- User authentication and authorization (JWT-based, two roles)
- Image upload pipeline with automated colony segmentation
- Bounding box editing for segmentation correction
- k-NN species retrieval from Qdrant vector database with configurable aggregation strategies
- Species, strain, and image database browsing
- Scientific feedback submission and review workflow
- Data management CRUD operations (Data Owner)
- Model training trigger, monitoring, and deployment (Data Owner)

**Out of scope:** Offline model experimentation (fungal-cv-qdrant repo), multi-agent autonomous research (Autolab), Vast.ai GPU cluster provisioning, dataset synchronization tools.

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|-----------|
| **Strain** | A specific fungal isolate, identified by a strain identifier (e.g., "DTO 148-D1") |
| **Species** | The taxonomic species classification (e.g., *Penicillium commune*) |
| **Media** | Growth medium on which the fungus is cultured (e.g., MEA, CYA, YES) |
| **Segment** | A cropped image region containing a single fungal colony, defined by a bounding box |
| **Qdrant** | Vector similarity search engine storing feature embeddings |
| **Embedding** | A fixed-dimensional feature vector extracted from an image via a CNN/Transformer model |
| **k-NN** | k-Nearest Neighbors search over vector space |
| **Aggregation** | Voting strategy to combine neighbor results into a species ranking |
| **JWT** | JSON Web Token for authenticated sessions |
| **Re-index** | Re-extract features and upsert into Qdrant (lightweight, no model weight change) |
| **Fine-tune** | Retrain neural network weights (heavy operation) |
| **Retrain** | Combined fine-tune + re-index pipeline |

---

## 2. Overall Description

### 2.1 Product Perspective
MycoAI is a greenfield system with three submodules in a monorepo:
- **mycoai_retrieval_backend:** FastAPI REST API serving all business logic
- **mycoai_retrieval_frontend:** React 19 SPA for scientist-facing UI
- **fungal-cv-qdrant:** Research/experimentation code (producer of models and datasets; not imported by product repos)

The backend is a modular monolith — single deployable service with domain-grouped routers. External dependencies: PostgreSQL 16, Qdrant (Docker/Cloud), Redis 7 (Celery broker).

### 2.2 User Characteristics

| Actor | Role | Technical Level | Responsibilities |
|-------|------|-----------------|------------------|
| **Researcher** (`user`) | Normal User | Domain scientist, basic web proficiency | Upload images, view retrieval results, submit feedback on predictions |
| **Data Owner** (`owner`) | Administrator | Domain scientist with curation responsibility | All Researcher actions + CRUD species/strains/images, feedback review, training trigger, user management, audit log |

### 2.3 Constraints
- **Implementation State:** Backend API structure is complete but most business logic is mock/stub. Auth uses in-memory stores — PostgreSQL integration is scaffolded via Alembic migration but not wired. Frontend pages are shells except Upload page. Celery tasks exist as stubs.
- **Reimplementation Boundary:** Product repos must reimplement logic locally; must not import from `fungal-cv-qdrant`.
- **Deployment:** Planned Docker Compose on single VM (<100 concurrent users). No Kubernetes or managed platform yet.
- **Browser Support:** Modern browsers (Chrome, Firefox, Edge latest 2 versions).
- **Image Formats:** JPEG, PNG, TIFF (minimum 256×256 px).

---

## 3. System Features and Use Cases

### 3.1 Actor List

| Actor ID | Actor Name | Type | Description |
|----------|------------|------|-------------|
| ACT-01 | Researcher | Primary | Authenticated normal user; uploads images, views results, submits feedback |
| ACT-02 | Data Owner | Primary | Authenticated owner; all Researcher actions plus data management, feedback review, training, admin |
| ACT-03 | AI Segmentation Service | Secondary | Automated colony detection from plate images (internal system component) |
| ACT-04 | Retrieval Service | Secondary | Embedding extraction, Qdrant vector search, ranking aggregation (internal system component) |
| ACT-05 | Celery Worker | Secondary | Async task processor for training, batch operations, segmentation (internal system component) |

### 3.2 Use Case Index

| UC ID | Use Case Name | Primary Actor | Priority |
|-------|---------------|---------------|----------|
| UC-AUTH-01 | Register Account | Researcher | High |
| UC-AUTH-02 | Login | Researcher | High |
| UC-IMAGE-01 | Upload Image for Identification | Researcher | High |
| UC-IMAGE-02 | Edit Segmentation | Researcher | Medium |
| UC-RETRIEVAL-01 | Query Species Identity | Researcher | High |
| UC-DATA-01 | Browse Database | Researcher | Medium |
| UC-FEEDBACK-01 | Submit Feedback | Researcher | Medium |
| UC-FEEDBACK-02 | Review Feedback | Data Owner | Medium |
| UC-DATA-02 | Manage Species Data | Data Owner | High |
| UC-TRAINING-01 | Trigger Model Training | Data Owner | Medium |

### 3.3 Use Case Diagram

![Use Case Diagram](diagrams/usecase-diagram.svg)

---

### 3.4 Use Case Specifications

---

## UC-AUTH-01: Register Account

| **Use Case ID:**        | UC-AUTH-01 |
| **Use Case Name:**      | Register Account |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Researcher (Primary) |
| **Description:**        | A researcher creates a new account by providing email, password, and name. The system validates uniqueness of the email, hashes the password, and returns JWT tokens for immediate login. The first registered user in the system is automatically assigned the Data Owner role. |
| **Preconditions:**      | 1. Researcher is not already authenticated. 2. Email is not already registered in the system. |
| **Postconditions:**     | 1. New user record created in `users` table with hashed password. 2. JWT access token and refresh token issued. 3. If first user: role set to `owner`; otherwise role set to `user`. 4. Audit log entry created for registration. |
| **Priority:**           | High |
| **Frequency of Use:**   | 5–20 times per month (new researcher onboarding) |
| **Includes:**           | None |
| **Special Requirements:** | 1. Password must be minimum 8 characters. 2. Email must be valid format (RFC 5322). 3. Password stored as bcrypt hash (cost factor 12). 4. Access token expires in 30 minutes; refresh token expires in 7 days. |
| **Assumptions:**        | 1. Email verification is configurable but auto-activation is default per `08-roles-and-permissions.md`. 2. First-user auto-owner is implemented. |
| **Notes and Issues:**   | **Implementation gap:** Auth backend currently uses in-memory `MemoryStore`. PostgreSQL migration exists (`0001_initial_schema.py`) but code is not connected to SQL database. Frontend register page (`register-page.tsx`) is a shell. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Researcher navigates to registration page | |
| 2 | | System displays registration form with fields: email, password, confirm password, name |
| 3 | Researcher enters email, password, confirm password, and name, then clicks "Register" | |
| 4 | | System validates all fields: email format, password length ≥8, passwords match, name not empty |
| 5 | | System checks email uniqueness against `users` table |
| 6 | | System hashes password with bcrypt |
| 7 | | System determines role: `owner` if `users` table is empty, else `user` |
| 8 | | System creates user record in `users` table with `is_active = true` |
| 9 | | System generates JWT access token (30 min expiry) and refresh token (7 day expiry) |
| 10 | | System stores refresh token hash in `refresh_tokens` table |
| 11 | | System writes audit log entry: `action="user_registered"` |
| 12 | | System returns 201 Created with `{access_token, refresh_token, token_type, expires_in}` |

### Alternative Courses

**AC.1: First User Registration** — At step 7, if `users` table is empty:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | | System assigns role `owner` |
| AC.1.2 | | Continue from step 8 of main flow |

### Exceptions

**EX.1: Email Already Registered** — At step 5, if email exists:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 409 Conflict: `{"detail": "Email already registered"}` |
| **Final state:** Researcher remains on registration form; email field highlighted with error. | | |

**EX.2: Validation Failure** — At step 4, if any field is invalid:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System returns 422 Unprocessable Entity with field-level error messages |
| **Final state:** Researcher sees inline validation errors; form not submitted. | | |

**EX.3: Database Failure** — At step 8, if database insert fails:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System returns 500 Internal Server Error |
| **Final state:** No user created; Researcher sees generic error message. | | |

---

## UC-AUTH-02: Login

| **Use Case ID:**        | UC-AUTH-02 |
| **Use Case Name:**      | Login |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Researcher (Primary) |
| **Description:**        | A researcher authenticates by providing email and password. The system verifies credentials against stored bcrypt hash, generates a JWT access token and refresh token, and establishes an authenticated session. Subsequent API calls use the access token in the Authorization header. |
| **Preconditions:**      | 1. Researcher has a registered account. 2. Account is active (`is_active = true`). |
| **Postconditions:**     | 1. JWT access token issued (30 min). 2. Refresh token stored in database. 3. Audit log entry created for login. 4. Researcher redirected to dashboard. |
| **Priority:**           | High |
| **Frequency of Use:**   | 50–200 times per day (once per session per active researcher) |
| **Includes:**           | None |
| **Special Requirements:** | 1. Access token: Bearer JWT, 30-minute expiry. 2. Refresh token: opaque UUID, 7-day expiry, single-use (rotated on refresh). 3. Rate limiting: 5 failed attempts per email per 15 minutes. 4. Tokens must be validated on every protected endpoint. |
| **Assumptions:**        | 1. JWT secret is configured via environment variable `MYCOAI_BACKEND_JWT_SECRET`. 2. Frontend stores tokens in localStorage (per current implementation). |
| **Notes and Issues:**   | **Implementation gap:** Auth uses in-memory `MemoryStore` rather than PostgreSQL. Token validation middleware exists (`core/dependencies.py`) but refresh token rotation is not yet implemented. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Researcher navigates to login page | |
| 2 | | System displays login form with email and password fields |
| 3 | Researcher enters email and password, clicks "Login" | |
| 4 | | System validates email format and that password is not empty |
| 5 | | System looks up user by email in `users` table |
| 6 | | System verifies password against stored bcrypt hash |
| 7 | | System checks account is active (`is_active = true`) |
| 8 | | System generates JWT access token (30 min) and refresh token (7 days) |
| 9 | | System stores refresh token hash in `refresh_tokens` table |
| 10 | | System writes audit log entry: `action="user_login"` |
| 11 | | System returns 200 OK with `{access_token, refresh_token, token_type, expires_in}` |

### Alternative Courses

None.

### Exceptions

**EX.1: Invalid Credentials** — At step 5 or step 6, if user not found or password mismatch:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System increments failed login counter for the email |
| EX.1.2 | | System returns 401 Unauthorized: `{"detail": "Invalid email or password"}` |
| **Final state:** Researcher remains on login page with error message. | | |

**EX.2: Account Disabled** — At step 7, if `is_active = false`:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System returns 403 Forbidden: `{"detail": "Account is disabled"}` |
| **Final state:** Researcher sees account disabled message. | | |

**EX.3: Rate Limit Exceeded** — At step 4, if 5+ failed attempts in 15 minutes:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System returns 429 Too Many Requests: `{"detail": "Too many login attempts. Try again in 15 minutes."}` |
| **Final state:** Login form locked for 15 minutes. | | |

**EX.4: User Not Found** — At step 5, if email does not exist:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.4.1 | | System returns 401 Unauthorized (same message as invalid password to avoid user enumeration) |
| **Final state:** Same as EX.1. | | |

---

## UC-IMAGE-01: Upload Image for Identification

| **Use Case ID:**        | UC-IMAGE-01 |
| **Use Case Name:**      | Upload Image for Identification |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Researcher (Primary), AI Segmentation Service (Secondary) |
| **Description:**        | A researcher uploads a Petri dish plate image of a fungal strain with associated metadata (strain identifier, growth medium, optional max colony count). The system stores the image, runs automated colony segmentation (KMeans or Contour method), detects colony bounding boxes, crops segment images, and returns the segmentation result for review. |
| **Preconditions:**      | 1. Researcher is authenticated (valid JWT). 2. Image is in JPEG, PNG, or TIFF format, minimum 256×256 px. |
| **Postconditions:**     | 1. Image record created in `images` table. 2. Segment records created in `segments` table with bounding boxes and crop paths. 3. Cropped segment images saved to storage. 4. Audit log entry created. 5. Segmentation result returned for researcher review. |
| **Priority:**           | High |
| **Frequency of Use:**   | 20–100 times per day |
| **Includes:**           | UC-AUTH-02 (authentication required at step 1) |
| **Special Requirements:** | 1. Supported formats: JPEG, PNG, TIFF. 2. Min resolution: 256×256 px. 3. Segmentation methods: KMeans (default) or Contour. 4. Max colonies configurable: 1–10 (default: model confidence threshold). 5. File size limit: 50 MB per image. |
| **Assumptions:**        | 1. Segmentation pipeline (`SegmentationPipeline` class) is functional. 2. Upload storage path is configured and writable. |
| **Notes and Issues:**   | **Implementation gap:** `SegmentationPipeline` class exists in `segmentation.py` but integration with the API via `routes.py` is partially stubbed. Frontend upload page (`upload-page.tsx`) has functional `FileDropzone`. Batch upload endpoint (`/images/batch`) exists but batch CSV parsing is not fully implemented. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Researcher navigates to upload page (authenticated) | |
| 2 | | System displays upload form with: file dropzone, strain identifier field (free text), media dropdown (predefined list), max colonies slider (1–10 or "default") |
| 3 | Researcher selects image file, enters strain identifier, selects media, optionally sets max colonies | |
| 4 | Researcher clicks "Upload and Segment" | |
| 5 | | System validates image format and dimensions |
| 6 | | System creates image record in `images` table with status `processing` |
| 7 | | System saves original image file to storage (`Dataset/uploads/{image_id}/`) |
| 8 | | System invokes AI Segmentation Service with the image and segmentation method |
| 9 | | AI Segmentation Service detects colonies: produces 1–N bounding boxes with (x, y, w, h) coordinates |
| 10 | | AI Segmentation Service crops segment images from source image, saves to storage |
| 11 | | System creates segment records in `segments` table for each detected colony |
| 12 | | System updates image status to `segmented` |
| 13 | | System writes audit log entry: `action="image_uploaded"` |
| 14 | | System returns 201 Created with `{image_id, strain, media, status, segments[{id, segment_index, bbox, crop_url}]}` |

### Alternative Courses

**AC.1: No Colonies Detected** — At step 9, if segmentation returns zero bounding boxes:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | | System updates image status to `segmentation_failed` |
| AC.1.2 | | System returns 200 OK with `{image_id, status: "segmentation_failed", segments: [], message: "No colonies detected. Try adjusting segmentation method or re-uploading."}` |
| AC.1.3 | Researcher may re-upload or change segmentation method | |

**AC.2: Batch Upload** — At step 3, if researcher selects batch folder upload instead of single image:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | Researcher selects folder with `template.json` and strain subdirectories | |
| AC.2.2 | | System parses `template.json` for column mappings and defaults |
| AC.2.3 | | System queues batch job via Celery worker |
| AC.2.4 | | System returns 202 Accepted with `{job_id, status: "pending"}` |
| AC.2.5 | Researcher monitors batch progress via job status endpoint | |

### Exceptions

**EX.1: Invalid Image Format** — At step 5, if format is unsupported or resolution too low:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 400 Bad Request: `{"detail": "Unsupported image format. Accepted: JPEG, PNG, TIFF. Minimum resolution: 256x256."}` |
| **Final state:** Researcher stays on upload page; file rejected. | | |

**EX.2: File Too Large** — At step 5, if file exceeds 50 MB:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System returns 413 Payload Too Large: `{"detail": "File exceeds maximum size of 50 MB."}` |
| **Final state:** Researcher stays on upload page; file rejected. | | |

**EX.3: Storage Failure** — At step 7, if file cannot be saved:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System rolls back image record creation |
| EX.3.2 | | System returns 500 Internal Server Error |
| **Final state:** No image record persists; Researcher sees generic error. | | |

**EX.4: Segmentation Timeout** — At step 9, if segmentation exceeds 60 seconds:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.4.1 | | System updates image status to `segmentation_failed` |
| EX.4.2 | | System returns 500 Internal Server Error: `{"detail": "Segmentation timed out."}` |
| **Final state:** Image record exists with failed status; segments not created. Researcher may retry. | | |

---

## UC-IMAGE-02: Edit Segmentation

| **Use Case ID:**        | UC-IMAGE-02 |
| **Use Case Name:**      | Edit Segmentation |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Researcher (Primary) |
| **Description:**        | After automated segmentation of an uploaded image, a researcher reviews the detected colony bounding boxes. The researcher can reposition, resize, add new, or delete bounding boxes to correct misdetections before the segments are used for species retrieval. Changes are saved to the segment records in the database. |
| **Preconditions:**      | 1. Researcher is authenticated. 2. Image has been uploaded and segmented (UC-IMAGE-01 completed). 3. Image status is `segmented`. |
| **Postconditions:**     | 1. Segment records updated with modified bounding box coordinates. 2. Deleted segments soft-archived (`is_archived = true`). 3. New segment crops generated and stored. 4. Image ready for retrieval. 5. Audit log entry created. |
| **Priority:**           | Medium |
| **Frequency of Use:**   | 10–30 times per day (when auto-segmentation needs correction) |
| **Includes:**           | UC-AUTH-02 (authentication) |
| **Special Requirements:** | 1. Bounding boxes must remain within image boundaries. 2. Minimum bbox dimensions: 32×32 px. 3. At least 1 segment must remain after edits. 4. Drag-to-move, corner-handle-resize in UI. 5. Aspect ratio maintained by default. |
| **Assumptions:**        | 1. Frontend `upload-page.tsx` implements draggable/resizable bounding box overlays. 2. `PATCH /images/{id}/segments` endpoint is functional. |
| **Notes and Issues:**   | **Implementation gap:** Bounding box editing UI exists in upload-page component but the save endpoint (`routes.py` `update_segments`) integration status is unverified. New bbox addition requires manual crop extraction. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Researcher views segmentation result from UC-IMAGE-01 | |
| 2 | | System displays image with bounding box overlays for each detected segment |
| 3 | Researcher adjusts a bounding box (drag to reposition, drag corners to resize) | |
| 4 | | System updates overlay in real-time |
| 5 | Researcher repeats step 3 for other segments as needed | |
| 6 | Researcher clicks "Save Edits" | |
| 7 | | System validates all bounding boxes: within image bounds, minimum 32×32 px |
| 8 | | System updates affected segment records in `segments` table with new bbox coordinates |
| 9 | | System re-crops segment images from source image using new coordinates |
| 10 | | System writes audit log entry: `action="segmentation_edited"` |
| 11 | | System returns 200 OK with updated segment list |

### Alternative Courses

**AC.1: Delete Segment** — At step 3, if researcher deletes a segment:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | Researcher clicks delete (X) on a bounding box overlay | |
| AC.1.2 | | System hides the bounding box overlay (soft delete, undoable) |
| AC.1.3 | Researcher clicks "Save Edits" | |
| AC.1.4 | | System sets `is_archived = true` on the deleted segment record |
| AC.1.5 | | Continue from step 10 of main flow |

**AC.2: Add New Segment** — At step 3, if researcher adds a new bounding box:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | Researcher click-drags on empty area of the image | |
| AC.2.2 | | System creates a new bounding box overlay |
| AC.2.3 | Researcher clicks "Save Edits" | |
| AC.2.4 | | System creates new segment record in `segments` table with next `segment_index` |
| AC.2.5 | | System crops new segment image from source image |
| AC.2.6 | | Continue from step 10 of main flow |

**AC.3: Undo Before Save** — At step 5, if researcher undoes a delete:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.3.1 | Researcher clicks undo on a soft-deleted segment | |
| AC.3.2 | | System restores bounding box overlay (no DB change yet) |
| AC.3.3 | | Continue at step 5 of main flow |

### Exceptions

**EX.1: Bounds Validation Failure** — At step 7, if any bbox exceeds image dimensions or is smaller than 32×32:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 400 Bad Request with detail on which segment failed validation |
| **Final state:** No changes saved; Researcher adjusts and retries. | | |

**EX.2: No Segments Remain** — At step 7, if all segments have been deleted:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System returns 400 Bad Request: `{"detail": "At least one segment must remain. Add a segment or undo deletions."}` |
| **Final state:** No changes saved; Researcher must add or undo a segment. | | |

**EX.3: Image Not Found** — At step 2, if image_id does not exist:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System returns 404 Not Found |
| **Final state:** Researcher redirected to upload or database view. | | |

---

## UC-RETRIEVAL-01: Query Species Identity

| **Use Case ID:**        | UC-RETRIEVAL-01 |
| **Use Case Name:**      | Query Species Identity |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Researcher (Primary), Retrieval Service (Secondary), Qdrant (Secondary) |
| **Description:**        | A researcher triggers species retrieval from segmented colony crops of one or more uploaded images. The system extracts feature embeddings using a deep learning model (default: EfficientNetB1 finetuned), queries Qdrant vector database for k-NN neighbors, applies sibling filtering and aggregation strategy across all segments, and returns a ranked list of predicted species with confidence scores. |
| **Preconditions:**      | 1. Researcher is authenticated. 2. At least one image has been uploaded and segmented (from UC-IMAGE-01). 3. Qdrant service is running and populated with reference vectors. |
| **Postconditions:**     | 1. Retrieval job record created in `retrieval_jobs` table with status `completed`. 2. Retrieval results stored in `retrieval_results` table with ranked species and scores. 3. Neighbor details stored in `retrieval_neighbors` table. 4. Audit log entry created. 5. Ranked species predictions returned for display. |
| **Priority:**           | High |
| **Frequency of Use:**   | 20–80 times per day |
| **Includes:**           | UC-AUTH-02 (authentication) |
| **Special Requirements:** | 1. k-NN parameter configurable: 1–20 (default: 5). 2. Aggregation strategies: `weighted`, `uni`, `manual_weighted`. 3. Environment strategy: `same_medium` (E1, default), `all_media` (E2), `specific_medium` (E3), `exclude_medium` (E4). 4. Response time: <5 seconds for single-image query. 5. Sibling exclusion: segments from same source image excluded from neighbor set. |
| **Assumptions:**        | 1. Feature extraction models are loaded and available. 2. Qdrant collection `myco_fungi_features_full_finetuned` exists with 13 named vectors per point. 3. Default vector: `EfficientNetB1_finetuned` (1280-dim). |
| **Notes and Issues:**   | **Implementation gap:** `api/retrieval.py` returns hardcoded mock results (`"Penicillium commune"`). Real Qdrant query integration exists in `qdrant/operations.py` but is not wired to the API endpoint. Feature extraction pipeline exists in `services/feature_extraction.py` but is a stub. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Researcher navigates to results page or clicks "Identify Species" on an uploaded image | |
| 2 | | System displays query form: image selector (shows uploaded/segmented images with strain info), k value (slider 1–20, default 5), aggregation strategy (dropdown: weighted/uni/manual_weighted), environment strategy (dropdown: E1/E2/E3/E4) |
| 3 | Researcher selects image(s), configures retrieval parameters, clicks "Query" | |
| 4 | | System creates retrieval job record in `retrieval_jobs` table with status `processing` |
| 5 | | System extracts feature embeddings from each segment crop using configured extractor model |
| 6 | | System constructs Qdrant query with: vector(s), k value, environment filter, sibling exclusion filter |
| 7 | | Qdrant returns k nearest neighbors per segment with cosine similarity scores |
| 8 | | System applies sibling exclusion (filters out neighbors from same source image) |
| 9 | | System applies aggregation strategy across all segments: computes species ranking with confidence scores |
| 10 | | System stores retrieval results in `retrieval_results` table with ranked species |
| 11 | | System stores neighbor details in `retrieval_neighbors` table |
| 12 | | System updates retrieval job status to `completed` |
| 13 | | System writes audit log entry: `action="retrieval_query"` |
| 14 | | System returns 200 OK with `{job_id, strain, rankings[{rank, species, score, neighbors[]}], query_details}` |

### Alternative Courses

**AC.1: Asynchronous Query (Long-Running)** — At step 3, if researcher chooses async mode or query is expected to exceed 5 seconds:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | | System creates retrieval job with status `pending` |
| AC.1.2 | | System dispatches query to Celery worker |
| AC.1.3 | | System returns 202 Accepted with `{job_id, status: "pending", estimated_seconds}` |
| AC.1.4 | Researcher polls `GET /retrieval/jobs/{id}` for status | |
| AC.1.5 | | When job completes, system returns results via `GET /retrieval/jobs/{id}/results` |

**AC.2: Multi-Image Query** — At step 3, if researcher selects multiple images of the same strain on different media:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | | System segments all images independently |
| AC.2.2 | | System pools all segments from all images for the strain |
| AC.2.3 | | System applies aggregation across all pooled segments |
| AC.2.4 | | Continue from step 9 of main flow |

### Exceptions

**EX.1: No Segments Available** — At step 3, if selected image has no segments (segmentation failed or not yet performed):

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 400 Bad Request: `{"detail": "Image has no segments. Run segmentation first."}` |
| **Final state:** Researcher stays on query form; must segment or select different image. | | |

**EX.2: Qdrant Unavailable** — At step 6, if Qdrant service is unreachable:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System updates job status to `failed` with error message |
| EX.2.2 | | System returns 503 Service Unavailable: `{"detail": "Retrieval service unavailable. Try again later."}` |
| **Final state:** Job marked failed; Researcher may retry later. | | |

**EX.3: Feature Extraction Failure** — At step 5, if model fails to load or extract features:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System updates job status to `failed` |
| EX.3.2 | | System returns 500 Internal Server Error: `{"detail": "Feature extraction failed."}` |
| **Final state:** Job marked failed; admin notified. | | |

**EX.4: No Neighbors Found** — At step 7, if Qdrant returns zero neighbors (all filtered out or empty collection):

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.4.1 | | System returns 200 OK with `{job_id, strain, rankings: [], message: "No matching species found. Try adjusting environment strategy or K value."}` |
| **Final state:** Job completed with empty results; Researcher may adjust parameters and retry. | | |

---

## UC-DATA-01: Browse Database

| **Use Case ID:**        | UC-DATA-01 |
| **Use Case Name:**      | Browse Database |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Researcher (Primary) |
| **Description:**        | A researcher browses the species database to understand what reference data exists. The researcher can view species, strains, and associated images, filter by species name, growth medium, or date range, view dashboard statistics, and navigate to detailed views of individual species or strains with their images. |
| **Preconditions:**      | 1. Researcher is authenticated. 2. Database contains species, strain, and image records. |
| **Postconditions:**     | 1. Researcher has viewed filtered/sorted database entries. 2. No data modifications occur (read-only). |
| **Priority:**           | Medium |
| **Frequency of Use:**   | 10–40 times per day |
| **Includes:**           | UC-AUTH-02 (authentication) |
| **Special Requirements:** | 1. Pagination: offset/limit with configurable page size (default 20). 2. Sorting: name, created_at, image count. 3. Filtering: text search (species/strain name), media type, date range, source. 4. Dashboard charts: species distribution pie, media distribution bar, timeline. |
| **Assumptions:**        | 1. API endpoints `GET /species`, `GET /strains`, `GET /dashboard/*` are implemented. 2. Frontend `database-page.tsx` and `dashboard-page.tsx` render the data. |
| **Notes and Issues:**   | **Implementation gap:** Dashboard chart endpoints return static mock data. Database page frontend is a shell. Species/strains API endpoints are scaffolded but backed by in-memory `MemoryStore` — not connected to PostgreSQL. Search and filtering logic is not implemented. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Researcher navigates to Database page | |
| 2 | | System displays database overview: species list with image counts, filter panel (search box, media checkboxes, date range picker), pagination controls |
| 3 | Researcher optionally enters search text, selects media filters, or adjusts date range | |
| 4 | | System queries `species` table with applied filters, paginates results |
| 5 | | System returns paginated species list with strain counts and image counts |
| 6 | Researcher clicks on a species name | |
| 7 | | System displays species detail: description, list of strains with metadata, associated images with thumbnails |
| 8 | Researcher clicks on a strain to see its images | |
| 9 | | System displays strain detail: images grouped by media type, each with thumbnail and metadata |
| 10 | Researcher browses or returns to list | |

### Alternative Courses

**AC.1: View Dashboard** — At step 1, if researcher navigates to Dashboard instead:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | Researcher navigates to Dashboard page | |
| AC.1.2 | | System displays dashboard: total species/strains/images counts, species distribution pie chart, media distribution bar chart, timeline of uploads, Qdrant learned vs unlearned status |
| AC.1.3 | Researcher views dashboard statistics | |

**AC.2: Search with No Results** — At step 4, if filters match zero records:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | | System displays empty state: "No species match your filters. Try adjusting search criteria." |
| AC.2.2 | Researcher adjusts filters and retries | |

### Exceptions

**EX.1: Database Connection Failure** — At step 4, if PostgreSQL is unreachable:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 503 Service Unavailable |
| **Final state:** Error page displayed; Researcher cannot browse database. | | |

**EX.2: Page Out of Range** — At step 4, if requested page exceeds available pages:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System returns empty list with `total` count; pagination shows last available page |
| **Final state:** Researcher sees no results but can navigate to valid pages. | | |

---

## UC-FEEDBACK-01: Submit Feedback

| **Use Case ID:**        | UC-FEEDBACK-01 |
| **Use Case Name:**      | Submit Feedback |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Researcher (Primary) |
| **Description:**        | A researcher submits a correction when they believe a species prediction is wrong or a database entry contains inaccurate data. The researcher selects the predicted or database species, provides the correct species (from a known list or free text), and writes a description justifying the correction. The feedback is queued for Data Owner review. The researcher can view their own feedback history. |
| **Preconditions:**      | 1. Researcher is authenticated. 2. A retrieval result or database entry exists for which feedback is being submitted. |
| **Postconditions:**     | 1. Feedback record created in `feedback` table with status `pending`. 2. Researcher can see the feedback in their submission history. 3. Data Owner's feedback inbox updated. 4. Audit log entry created. |
| **Priority:**           | Medium |
| **Frequency of Use:**   | 5–20 times per month |
| **Includes:**           | UC-AUTH-02 (authentication) |
| **Special Requirements:** | 1. Feedback source must be tagged: `query_result` or `database_review`. 2. Description field is required (min 10 characters). 3. Suggested species: dropdown of known species plus "Other (specify)" with free text. 4. Optional supporting image upload. |
| **Assumptions:**        | 1. Researcher has domain knowledge to identify correct species. 2. The feedback API endpoints are implemented. |
| **Notes and Issues:**   | **Implementation gap:** Feedback API endpoints exist in `api/feedback.py` but are backed by `MemoryStore`. Frontend `feedback-page.tsx` is a shell. Notification to Data Owner on new feedback is not implemented. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Researcher views a retrieval result or database entry and clicks "Report Incorrect" | |
| 2 | | System displays feedback form pre-populated with: source type, predicted/current species (auto-filled), query strain or database entity reference |
| 3 | Researcher selects correct species from dropdown or enters free text for "Other", writes description justifying the correction |
| 4 | Researcher optionally attaches supporting image |
| 5 | Researcher clicks "Submit Feedback" | |
| 6 | | System validates description length (min 10 chars) and that suggested species is provided |
| 7 | | System creates feedback record in `feedback` table: status `pending`, submitter_id set, source and references set |
| 8 | | System writes audit log entry: `action="feedback_submitted"` |
| 9 | | System returns 201 Created with feedback item details |
| 10 | | System notifies Data Owner of new pending feedback (if notification system is active) |

### Alternative Courses

**AC.1: Feedback on Database Entry** — At step 1, if researcher submits feedback from database browse (UC-DATA-01) instead of retrieval result:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | Researcher clicks "Report Issue" on a species/strain detail page | |
| AC.1.2 | | System sets feedback source to `database_review`, pre-populates with current species/strain data |
| AC.1.3 | | Continue from step 2 of main flow |

**AC.2: View My Feedback** — At step 1, if researcher navigates to view their submitted feedback history:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | Researcher navigates to "My Feedback" page | |
| AC.2.2 | | System queries `feedback` table filtered by `submitter_id`, ordered by submission date desc |
| AC.2.3 | | System displays feedback list with status badges (pending/accepted/rejected), dates, and reviewer notes |
| AC.2.4 | Researcher reviews their feedback history | |

### Exceptions

**EX.1: Description Too Short** — At step 6, if description is fewer than 10 characters:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 422 Unprocessable Entity: `{"detail": "Description must be at least 10 characters."}` |
| **Final state:** Researcher stays on form; must expand description. | | |

**EX.2: Duplicate Feedback** — At step 7, if identical feedback already exists from same researcher on same entity:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System returns 409 Conflict: `{"detail": "You have already submitted feedback on this result."}` |
| **Final state:** Researcher informed of existing submission. | | |

**EX.3: Reference Not Found** — At step 7, if referenced retrieval_result_id or image_id does not exist:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System returns 404 Not Found: `{"detail": "Referenced result or image not found."}` |
| **Final state:** Researcher redirected to valid result page. | | |

---

## UC-FEEDBACK-02: Review Feedback

| **Use Case ID:**        | UC-FEEDBACK-02 |
| **Use Case Name:**      | Review Feedback |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Data Owner (Primary) |
| **Description:**        | A Data Owner reviews feedback submitted by researchers. The Data Owner examines each item (predicted species, suggested correction, description, submitter info) and decides to accept (update database), reject (dismiss with optional reason), or defer (leave pending for later). Accepted feedback triggers database updates and flags affected Qdrant points for re-indexing. Bulk actions are supported for efficiency. |
| **Preconditions:**      | 1. Data Owner is authenticated with `owner` role. 2. At least one feedback item exists with status `pending`. |
| **Postconditions:**     | 1. Feedback item status updated to `accepted`, `rejected`, or remains `pending` (deferred). 2. If accepted: strain species updated in database, affected Qdrant points flagged for re-indexing. 3. Audit log entry created for each action. 4. Submitter notified of decision (if notification system active). |
| **Priority:**           | Medium |
| **Frequency of Use:**   | 5–15 times per month (per batch of feedback items) |
| **Includes:**           | UC-AUTH-02 (authentication) |
| **Special Requirements:** | 1. Bulk accept/reject via checkbox selection and batch endpoint. 2. Filter inbox by: status, submitter, date range, species. 3. Accepted feedback: update strain species reference, flag Qdrant points. 4. Review note optional for accept/reject, required for reject. 5. At least one Data Owner must exist (can't demote last owner). |
| **Assumptions:**        | 1. Data Owner reviews feedback periodically (not real-time). 2. Qdrant re-indexing is triggered by UC-TRAINING-01 (not automatic on accept). |
| **Notes and Issues:**   | **Implementation gap:** Feedback review endpoints (`PATCH /feedback/{id}`, `POST /feedback/batch`) exist in API spec but business logic is stubbed. Notification to submitter on status change is not implemented. Qdrant point flagging on accept is not implemented. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner navigates to Feedback Inbox | |
| 2 | | System queries `feedback` table for all items with status `pending`, sorted by submission date (oldest first) |
| 3 | | System displays inbox: list of pending items with submitter name, query strain, predicted species, suggested correction, description, submission date |
| 4 | Data Owner clicks on a feedback item to view details | |
| 5 | | System displays full feedback detail with links to original retrieval result or database entry |
| 6 | Data Owner reviews the feedback and decides: Accept, Reject, or Defer | |

#### 6a. Accept Path
| Step | Actor | System Response |
|------|-------|-----------------|
| 6a.1 | Data Owner clicks "Accept" | |
| 6a.2 | | System updates feedback status to `accepted`, sets `reviewer_id` and `reviewed_at` |
| 6a.3 | | System updates strain's species reference in `strains` table to the suggested species |
| 6a.4 | | System flags affected Qdrant points for re-indexing (sets `is_active = false` or queues task) |
| 6a.5 | | System writes audit log entry: `action="feedback_accepted"` |
| 6a.6 | | System queues notification to feedback submitter |

#### 6b. Reject Path
| Step | Actor | System Response |
|------|-------|-----------------|
| 6b.1 | Data Owner clicks "Reject", enters review note explaining rejection | |
| 6b.2 | | System validates review note is not empty |
| 6b.3 | | System updates feedback status to `rejected`, stores review note |
| 6b.4 | | System writes audit log entry: `action="feedback_rejected"` |
| 6b.5 | | System queues notification to feedback submitter with rejection reason |

#### 6c. Defer Path
| Step | Actor | System Response |
|------|-------|-----------------|
| 6c.1 | Data Owner clicks "Defer" | |
| 6c.2 | | System leaves feedback status as `pending` (no change) |
| 6c.3 | | Feedback remains in inbox for future review |

| Step | Actor | System Response |
|------|-------|-----------------|
| 7 | | System refreshes inbox, removing processed items |

### Alternative Courses

**AC.1: Bulk Accept/Reject** — At step 4, if Data Owner selects multiple items via checkboxes:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | Data Owner checks multiple feedback items, clicks "Bulk Accept" or "Bulk Reject" | |
| AC.1.2 | | System applies the same action to all selected items |
| AC.1.3 | | System returns `{updated: N}` count of processed items |
| AC.1.4 | | System refreshes inbox |

**AC.2: Filter Inbox** — At step 3, if Data Owner applies filters:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | Data Owner selects filter: by submitter, species, date range, or status | |
| AC.2.2 | | System queries `feedback` table with applied filters |
| AC.2.3 | | System displays filtered results |

### Exceptions

**EX.1: Last Data Owner Demotion** — At any step, if Data Owner is the last `owner` and tries to demote themselves (applicable only if feedback review triggers role change validation):

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 422 Unprocessable Entity: `{"detail": "Cannot remove last Data Owner."}` |
| **Final state:** Action blocked; at least one Data Owner must exist. | | |

**EX.2: Referenced Entity Deleted** — At step 5, if the original retrieval result or image was deleted since feedback was submitted:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System displays feedback detail with warning: "Original result/image no longer available." |
| EX.2.2 | | Data Owner can still accept/reject based on remaining information |
| **Final state:** Feedback review continues with degraded context. | | |

**EX.3: Strain Update Conflict** — At step 6a.3, if the strain was modified by another Data Owner concurrently:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System returns 409 Conflict: `{"detail": "Strain was modified by another user. Reload and try again."}` |
| **Final state:** Feedback not accepted; Data Owner reloads and retries. | | |

---

## UC-DATA-02: Manage Species Data

| **Use Case ID:**        | UC-DATA-02 |
| **Use Case Name:**      | Manage Species Data |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Data Owner (Primary) |
| **Description:**        | A Data Owner performs CRUD operations on species, strains, and images in the database. This includes creating new species, uploading known-species reference images with direct species linkage, editing species metadata, archiving (soft-deleting) species/strains/images, restoring from archive, and renaming species (triggering bulk relabeling of all associated strains). All operations are logged in the audit trail. |
| **Preconditions:**      | 1. Data Owner is authenticated with `owner` role. |
| **Postconditions:**     | 1. Species, strain, or image records created/updated/archived as requested. 2. If species renamed: all associated strains relabeled; affected Qdrant points flagged for re-indexing. 3. If archived: records marked `is_archived = true`, excluded from queries and training. 4. Audit log entries created for all mutations. |
| **Priority:**           | High |
| **Frequency of Use:**   | 10–30 times per month |
| **Includes:**           | UC-AUTH-02 (authentication) |
| **Special Requirements:** | 1. Species names must be unique (case-insensitive). 2. Species rename triggers atomic relabeling of all strains. 3. Soft delete (archive) with restore capability. 4. Permanent delete available after archive. 5. Warning on archive: "N strains will be affected. Models must be retrained for changes to take effect." 6. Media type constrained to predefined set. |
| **Assumptions:**        | 1. CRUD endpoints exist for `/species`, `/strains`, `/images`. 2. Media type enum is predefined and expandable. 3. Archive/trash management is distinct from active data views. |
| **Notes and Issues:**   | **Implementation gap:** CRUD endpoints exist in API (`api/species.py`, `api/strains.py`, `api/images.py`) but are backed by in-memory `MemoryStore`. Species rename bulk relabeling and Qdrant flagging are not implemented. Archive/restore endpoints use `is_archived` flag but trash management UI does not exist. |

### Main Flow of Events (Create Species)

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner navigates to Data Management page | |
| 2 | | System displays management interface: species list, strain list, image list, create/edit/archive controls |
| 3 | Data Owner clicks "Create Species" | |
| 4 | | System displays species creation form: name (required, unique), description (optional) |
| 5 | Data Owner enters species name and optional description, clicks "Create" | |
| 6 | | System validates species name uniqueness (case-insensitive) |
| 7 | | System creates species record in `species` table |
| 8 | | System writes audit log entry: `action="species_created"` |
| 9 | | System returns 201 Created with species details |

### Main Flow of Events (Upload Known-Species Image)

| Step | Actor | System Response |
|------|-------|-----------------|
| 10 | Data Owner clicks "Add Image" on a strain or species | |
| 11 | | System displays image upload form with: file dropzone, species dropdown, strain identifier, media dropdown, segmentation method selector |
| 12 | Data Owner selects image, chooses species (known classification), enters strain, selects media, clicks "Upload and Index" | |
| 13 | | System processes upload with direct species linkage (bypasses retrieval prediction) |
| 14 | | System runs segmentation pipeline (same as UC-IMAGE-01) |
| 15 | | System indexes segments directly into Qdrant with known species label |
| 16 | | System creates image, strain, and segment records linked to species |
| 17 | | System writes audit log entry: `action="image_indexed"` |
| 18 | | System returns 201 Created with image and segment details |

### Main Flow of Events (Edit/Archive)

| Step | Actor | System Response |
|------|-------|-----------------|
| 19 | Data Owner selects a species, strain, or image and clicks "Edit" or "Archive" | |
| 20 | | If Edit: system displays edit form with current values pre-filled |
| 21 | Data Owner modifies fields and clicks "Save" | |
| 22 | | System validates changes, updates record |
| 23 | | If species renamed: system bulk-updates all associated strains' species reference (atomic transaction) |
| 24 | | If archived: system sets `is_archived = true` and `archived_at` timestamp |
| 25 | | System writes audit log entry |
| 26 | | System returns 200 OK with updated record |

### Alternative Courses

**AC.1: Restore from Archive** — At step 19, if Data Owner navigates to Trash/Archive view:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | Data Owner navigates to Trash view | |
| AC.1.2 | | System displays all archived items (species, strains, images with `is_archived = true`) |
| AC.1.3 | Data Owner selects items and clicks "Restore" | |
| AC.1.4 | | System sets `is_archived = false`, clears `archived_at` |
| AC.1.5 | | System returns 200 OK; item reappears in active views |

**AC.2: Permanent Delete** — At step AC.1.3, if Data Owner clicks "Permanently Delete":

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | | System displays confirmation: "This action is irreversible. N associated records will be deleted. Continue?" |
| AC.2.2 | Data Owner confirms | |
| AC.2.3 | | System deletes records from database and removes associated files from storage |
| AC.2.4 | | System deletes associated Qdrant points |
| AC.2.5 | | System writes audit log entry |
| AC.2.6 | | System returns 204 No Content |

**AC.3: Empty Trash** — At step AC.1.2, if Data Owner clicks "Empty Trash":

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.3.1 | | System displays confirmation: "All N archived items will be permanently deleted. Continue?" |
| AC.3.2 | Data Owner confirms | |
| AC.3.3 | | System permanently deletes all archived items (as in AC.2) |
| AC.3.4 | | System returns 204 No Content |

### Exceptions

**EX.1: Duplicate Species Name** — At step 6, if species name already exists (case-insensitive):

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 409 Conflict: `{"detail": "Species 'X' already exists."}` |
| **Final state:** Data Owner stays on form; must use different name. | | |

**EX.2: Rename with Foreign Strains** — At step 23, if species has foreign key dependencies that prevent rename:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System performs rename in atomic transaction |
| EX.2.2 | | If any strain update fails, entire transaction rolls back |
| EX.2.3 | | System returns 500 Internal Server Error with rollback confirmation |
| **Final state:** No changes applied; Data Owner retries. | | |

**EX.3: Unauthorized Access** — At step 1, if Researcher (not Data Owner) attempts to access management page:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System returns 403 Forbidden: `{"detail": "Data Owner role required."}` |
| **Final state:** Researcher redirected to accessible pages. | | |

**EX.4: Image Storage Full** — At step 13, if storage volume is at capacity:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.4.1 | | System returns 507 Insufficient Storage: `{"detail": "Storage capacity exceeded. Contact administrator."}` |
| **Final state:** Upload rejected; Data Owner informed. | | |

---

## UC-TRAINING-01: Trigger Model Training

| **Use Case ID:**        | UC-TRAINING-01 |
| **Use Case Name:**      | Trigger Model Training |
| **Created By:**         | SRS Generator | **Last Updated By:** | SRS Generator |
| **Date Created:**       | 2026-06-02 | **Date Last Updated:** | 2026-06-02 |

| **Actor:**              | Data Owner (Primary), Celery Worker (Secondary) |
| **Description:**        | A Data Owner triggers model re-indexing or fine-tuning to incorporate new data, corrections, and archive changes into the Qdrant index and/or deep learning models. The Data Owner reviews pre-flight summary (changes since last training), chooses training type, monitors progress in real-time, reviews evaluation metrics, and deploys or rolls back the trained model. Only one training job can run at a time. |
| **Preconditions:**      | 1. Data Owner is authenticated with `owner` role. 2. Qdrant and PostgreSQL are operational. 3. No other training job is currently running. 4. At least one change exists since last training (new data, archived data, or accepted feedback). |
| **Postconditions:**     | 1. Training job record created in `training_jobs` table. 2. If re-index: Qdrant points updated with re-extracted features. 3. If fine-tune: model weights updated, evaluation metrics stored. 4. If deploy: new model version active for queries. 5. Audit log entry created. |
| **Priority:**           | Medium |
| **Frequency of Use:**   | 2–8 times per month |
| **Includes:**           | UC-AUTH-02 (authentication) |
| **Special Requirements:** | 1. Only one training job can run at a time. 2. Training types: `reindex` (re-extract + upsert to Qdrant), `finetune` (train neural network weights), `full_retrain` (both). 3. Real-time progress: stage, epoch, loss, accuracy, ETA. 4. Staged deployment: Data Owner reviews metrics before deploying. 5. Rollback to previous model version supported. 6. Cancel: graceful shutdown at end of current epoch. |
| **Assumptions:**        | 1. Feature extraction and fine-tuning scripts exist in fungal-cv-qdrant and are callable via backend. 2. Celery worker has access to GPU resources for fine-tuning. 3. Model checkpoints are versioned and stored. |
| **Notes and Issues:**   | **Implementation gap:** Training endpoints exist in `api/training.py` but return mock/stub data. Celery tasks in `tasks/training.py` are stubs. Real Qdrant re-indexing pipeline exists in `qdrant/operations.py` but is not wired to the training trigger. Progress tracking, model versioning, and rollback are not implemented. Real-time progress streaming is not implemented. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Data Owner navigates to Training Dashboard | |
| 2 | | System displays training status: current model version, last training date, strains in training set, latest F1 score, training history table |
| 3 | | System displays pre-flight summary: "N strains added, M archived, P feedback accepted since last training. Estimated time: ~X hours." |
| 4 | Data Owner selects training type (re-index / fine-tune / full retrain), reviews pre-flight summary | |
| 5 | Data Owner clicks "Start Training" | |
| 6 | | System validates no other training job is running |
| 7 | | System creates training job record in `training_jobs` table with status `pending`, stores `changes_since_last` |
| 8 | | System dispatches training task to Celery worker |
| 9 | | System returns 202 Accepted with `{job_id, status, estimated_completion}` |
| 10 | | Celery Worker executes training pipeline: data preparation → feature extraction → (if fine-tune: training epochs) → evaluation → Qdrant indexing |
| 11 | Data Owner monitors progress via dashboard (polling or push updates) | |
| 12 | | System updates job progress in `training_jobs` table: current stage, epoch, loss, accuracy, ETA |
| 13 | | When complete: System updates job status to `completed`, stores `model_version`, evaluation metrics |
| 14 | | System displays completion notification: "Training complete. Model vX ready for review." |
| 15 | Data Owner reviews evaluation metrics (F1 score, per-class accuracy, loss curves) | |
| 16 | Data Owner clicks "Deploy Model" | |
| 17 | | System toggles `is_deployed = true` on the new model |
| 18 | | System sets previous model `is_deployed = false` or retains as rollback target |
| 19 | | System activates new Qdrant collection/index for queries |
| 20 | | System writes audit log entry: `action="model_deployed"` |
| 21 | | System returns 200 OK: `{status: "deployed", model_version: "vX"}` |

### Alternative Courses

**AC.1: Cancel Training** — At step 11, if Data Owner clicks "Cancel" while job is running:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | Data Owner clicks "Cancel Training" | |
| AC.1.2 | | System sends cancel signal to Celery worker |
| AC.1.3 | | Celery Worker finishes current epoch/stage, then terminates gracefully |
| AC.1.4 | | System updates job status to `cancelled` |
| AC.1.5 | | System writes audit log entry: `action="training_cancelled"` |
| AC.1.6 | | System returns 200 OK with cancelled status |

**AC.2: Rollback Model** — At step 16, if Data Owner decides not to deploy or wants to revert:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | Data Owner clicks "Rollback" | |
| AC.2.2 | | System identifies previous deployed model version |
| AC.2.3 | | System displays confirmation: "Revert to model vX-1? Current model vX will be deactivated." |
| AC.2.4 | Data Owner confirms | |
| AC.2.5 | | System activates previous model version for queries |
| AC.2.6 | | System writes audit log entry: `action="model_rolled_back"` |
| AC.2.7 | | System returns 200 OK: `{status: "rolled_back", active_version: "vX-1"}` |

**AC.3: Training Triggered from Feedback Acceptance** — At step 1, alternative trigger path (indirect):

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.3.1 | | After accepting feedback in UC-FEEDBACK-02, system suggests: "N feedback items accepted. Trigger re-indexing?" |
| AC.3.2 | Data Owner navigates to Training page from feedback context | |
| AC.3.3 | | Continue from step 3 of main flow with pre-filled training type `reindex` |

### Exceptions

**EX.1: Training Already Running** — At step 6, if another job is in progress:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System returns 409 Conflict: `{"detail": "A training job is already in progress. Job ID: {id}. Monitor or cancel it first."}` |
| **Final state:** Data Owner sees current job status; can cancel or wait. | | |

**EX.2: Training Job Failure** — At step 12, if Celery worker reports job failure:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System updates job status to `failed`, stores error message |
| EX.2.2 | | System writes audit log entry: `action="training_failed"` |
| EX.2.3 | | System notifies Data Owner via dashboard and (if configured) email |
| **Final state:** Failed job logged; Data Owner may investigate logs and retry. | | |

**EX.3: Celery Worker Unavailable** — At step 8, if Celery broker (Redis) is unreachable:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System updates job status to `failed` with error "Celery broker unavailable" |
| EX.3.2 | | System returns 503 Service Unavailable: `{"detail": "Training service unavailable. Check Celery/Redis status."}` |
| **Final state:** Job not started; Data Owner retries after service restoration. | | |

**EX.4: Insufficient GPU Resources** — At step 10, if fine-tune is requested but no GPU is available:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.4.1 | | System returns 400 Bad Request: `{"detail": "GPU not available. Fine-tuning requires GPU. Use re-index only or provision GPU instance."}` |
| **Final state:** Data Owner selects re-index or provisions GPU. | | |

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- **Web Application:** React 19 SPA with Tailwind CSS 4.2 + shadcn/ui component library
- **Responsive Design:** Desktop-first; minimum viewport 1024×768 px
- **Authentication:** Login/register pages; authenticated pages protected via React Router guards
- **Image Upload:** Drag-and-drop file zone with preview; bounding box overlay editor with draggable/resizable handles
- **Results Display:** Ranked species list with confidence scores, expandable neighbor details with thumbnails
- **Dashboard:** Charts rendered with Recharts 2.15/D3 7.9 (pie chart, bar chart, timeline)
- **Admin Pages:** Species/strain CRUD tables, feedback inbox with filter/sort/bulk actions, training dashboard with progress bar

### 4.2 API Interfaces

**Base URL:** `http://{host}:8000/api/v1`

**Authentication:** Bearer JWT token in `Authorization` header for protected endpoints.

**Response Format:** JSON. Errors follow RFC 7807 Problem Details:
```json
{"type": "...", "title": "...", "status": 400, "detail": "...", "instance": "/path"}
```

**Key Endpoint Groups:**
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `POST /images/upload`, `GET /images/{id}`, `PATCH /images/{id}/segments`, `GET /images/{id}/segments/{idx}/crop`
- `POST /retrieval/query`, `GET /retrieval/jobs/{id}`, `GET /retrieval/jobs/{id}/results`, `POST /retrieval/query-sync`
- `GET/POST /species`, `GET/PATCH/DELETE /species/{id}`
- `GET/POST /strains`, `GET/PATCH/DELETE /strains/{id}`
- `POST /feedback`, `GET /feedback`, `GET /feedback/inbox`, `PATCH /feedback/{id}`, `POST /feedback/batch`
- `GET /training/status`, `GET/POST /training/jobs`, `POST /training/trigger`, `POST /training/jobs/{id}/deploy`, `POST /training/rollback`
- `GET /dashboard/stats`, `GET /dashboard/charts/*`, `GET /dashboard/qdrant-status`
- `GET /admin/users`, `PATCH /admin/users/{id}/role`, `GET /admin/audit-log`

**Pagination:** All list endpoints support `offset` and `limit` query parameters. Response includes `{items[], total, offset, limit}`.

### 4.3 Hardware Interfaces
- **Image input:** Digital camera or scanner producing JPEG/PNG/TIFF at min 256×256 px
- **GPU (optional):** NVIDIA GPU with CUDA for model fine-tuning (Vast.ai or local)
- **Storage:** Sufficient disk for `Dataset/` directory (uploaded images, prepared images, segment crops)

### 4.4 Software Interfaces
- **PostgreSQL 16:** Relational data store (users, species, strains, images, segments, retrieval_jobs, feedback, training_jobs, audit_log)
- **Qdrant:** Vector similarity search engine (cosine distance, 13 named vectors per point)
- **Redis 7:** Celery message broker and result backend
- **Celery 5.5:** Asynchronous task queue for training, batch operations
- **Google Drive (rclone):** Optional remote dataset storage for sync import/export

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **PER-01:** Retrieval query response time: <5 seconds for single-image query (feature extraction + Qdrant search + aggregation)
- **PER-02:** Image upload + segmentation: <30 seconds for single image (<10 MB)
- **PER-03:** Page load time: <2 seconds for dashboard and list views (with pagination)
- **PER-04:** Concurrent users: support 100 concurrent researchers with acceptable performance
- **PER-05:** Training job: re-index <2 hours for 10,000 images; fine-tune <24 hours on single GPU

### 5.2 Security
- **SEC-01:** All passwords stored as bcrypt hashes (cost factor 12)
- **SEC-02:** JWT access tokens expire after 30 minutes; refresh tokens after 7 days (rotated on use)
- **SEC-03:** All API endpoints enforce role-based access control (RBAC)
- **SEC-04:** Rate limiting on login endpoint: 5 attempts per email per 15 minutes
- **SEC-05:** HTTPS required for all production traffic
- **SEC-06:** Input validation on all user-supplied data (Pydantic backend, Zod frontend)
- **SEC-07:** Audit log captures all mutations with user ID, action, entity type, timestamp, IP
- **SEC-08:** CORS configured to allow only frontend origin(s)

### 5.3 Availability
- **AVL-01:** System uptime target: 99.5% during business hours (monitoring hours not 24/7)
- **AVL-02:** Graceful degradation: retrieval unavailable if Qdrant down; database browsing unavailable if PostgreSQL down
- **AVL-03:** Training jobs are non-critical — system remains operational for queries during training

### 5.4 Usability
- **USB-01:** Upload workflow: ≤3 clicks from login to species results (upload → review segments → query results)
- **USB-02:** Bounding box editing: intuitive drag/resize with visual feedback
- **USB-03:** Result display: top-5 species ranked with clear confidence indicators
- **USB-04:** Error messages: human-readable, actionable (not raw stack traces)

### 5.5 Maintainability
- **MNT-01:** API versioned at `/api/v1/` with backward compatibility
- **MNT-02:** Database migrations via Alembic, version-controlled
- **MNT-03:** Structured logging with request IDs for traceability

### 5.6 Data Integrity
- **DIN-01:** Species rename must be atomic (all strains update or none)
- **DIN-02:** Soft delete preserves data; permanent delete requires confirmation
- **DIN-03:** Audit log entries are append-only, never modified or deleted

---

## 6. Appendix

### 6.1 Glossary

| Term | Definition |
|------|-----------|
| Bounding Box (bbox) | Rectangular region defined by (x, y, width, height) enclosing a detected fungal colony |
| Celery | Distributed task queue for asynchronous processing |
| Cosine Similarity | Distance metric used by Qdrant for vector comparison (range: -1 to 1) |
| Embedding / Feature Vector | Fixed-dimensional numerical representation of an image extracted by a CNN |
| Environment Strategy | Filter controlling which growth media are included in Qdrant search (E1-E4) |
| FastAPI | Python web framework for building REST APIs |
| k-NN | k-Nearest Neighbors: retrieval of k most similar vectors from Qdrant |
| Media / Growth Medium | Substrate on which fungi are cultured (MEA, CYA, YES, etc.) |
| Qdrant | Vector database for similarity search |
| Re-index | Re-extract features and update Qdrant points (no neural network weight change) |
| Segment | Cropped region of a plate image containing a single fungal colony |
| Species Weight | Per-species extractor preference used in manual_weighted aggregation |
| Strain | Specific fungal isolate identified by a strain code |

### 6.2 References
- Feature Specs: `docs/feature_spec/01-image-input.md` through `08-roles-and-permissions.md`
- Technical Specs: `docs/technical_spec/00-use-case-design.md` through `12-deployment.md`
- Backend API: `repos/mycoai_retrieval_backend/src/mycoai_retrieval_backend/api/`
- Database Schema: `repos/mycoai_retrieval_backend/migrations/versions/0001_initial_schema.py`
- Qdrant Integration: `repos/mycoai_retrieval_backend/src/mycoai_retrieval_backend/qdrant/`
- Project Analysis: `output/analysis.md`

### 6.3 Implementation Gap Summary

| Area | Gap | Severity |
|------|-----|----------|
| Auth Storage | `MemoryStore` used instead of PostgreSQL; migration exists but not wired | High |
| Retrieval API | Returns hardcoded mock results; real Qdrant integration not wired | High |
| CRUD Operations | All species/strain/image CRUD backed by in-memory stores | High |
| Feedback Pipeline | Stub implementations; no notification system | Medium |
| Training Pipeline | Celery tasks are stubs; no real training execution | Medium |
| Frontend Pages | Most pages are `PageShell` placeholders; only Upload is functional | Medium |
| Celery Tasks | All task files exist but are empty/minimal | Medium |
| Deployment | No `docker-compose.dev.yml`; deployment plan not executed | Low |
| ORM Models | `@dataclass` used instead of SQLAlchemy ORM mapped classes | Low |
| Real-time Updates | Job status via polling only; no WebSocket push | Low |

### 6.4 Sequence Diagrams

| UC ID | Diagram |
|-------|---------|
| UC-AUTH-01 | ![SD: Register](diagrams/sd-UC-AUTH-01.svg) |
| UC-AUTH-02 | ![SD: Login](diagrams/sd-UC-AUTH-02.svg) |
| UC-IMAGE-01 | ![SD: Upload Image](diagrams/sd-UC-IMAGE-01.svg) |
| UC-IMAGE-02 | ![SD: Edit Segmentation](diagrams/sd-UC-IMAGE-02.svg) |
| UC-RETRIEVAL-01 | ![SD: Query Species](diagrams/sd-UC-RETRIEVAL-01.svg) |
| UC-DATA-01 | ![SD: Browse Database](diagrams/sd-UC-DATA-01.svg) |
| UC-FEEDBACK-01 | ![SD: Submit Feedback](diagrams/sd-UC-FEEDBACK-01.svg) |
| UC-FEEDBACK-02 | ![SD: Review Feedback](diagrams/sd-UC-FEEDBACK-02.svg) |
| UC-DATA-02 | ![SD: Manage Species](diagrams/sd-UC-DATA-02.svg) |
| UC-TRAINING-01 | ![SD: Trigger Training](diagrams/sd-UC-TRAINING-01.svg) |

---

*End of SRS Document*
