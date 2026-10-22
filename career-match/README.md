# CareerMatch — Job Portal with Resume Matching (Basic NLP)

A college-project-ready job portal using **HTML/CSS/JavaScript + Spring Boot + MySQL**. The matching engine is intentionally basic NLP: it tokenizes the resume and job text, removes common stop words, finds common keywords and returns a 0–100 match score.

## Main features
- Job listing
- Demo user creation via seed data
- PDF/TXT resume upload
- PDF text extraction with Apache PDFBox
- Basic NLP keyword matching
- Match score for each job
- Apply endpoint that stores the score
- Clean responsive frontend

## Tech stack
- Frontend: HTML5, CSS3, Vanilla JavaScript, Fetch API
- Backend: Java 21, Spring Boot 3.5.9, Spring Web, Spring Data JPA
- Database: MySQL
- NLP: Java tokenization + stop-word filtering + keyword overlap
- PDF: Apache PDFBox

## Run on Windows
1. Install JDK 21 and Maven 3.9+.
2. Start MySQL and make sure root password matches `src/main/resources/application.properties` (default in this project: `0000`). Change it if yours is different.
3. Optional: create DB manually:
   `CREATE DATABASE career_match;`
4. In project folder run:
   `mvn clean spring-boot:run`
5. Open: `http://localhost:8080`

Spring Boot will create/update tables automatically and seed 3 demo jobs + one demo user.

## API
- GET `/api/jobs`
- POST `/api/jobs`
- POST `/api/resumes/upload?userId=1` (multipart field: `file`)
- GET `/api/resumes/user/1`
- GET `/api/jobs/1/match/1`
- POST `/api/applications?userId=1&jobId=1`

## Important
This is **basic NLP**, not a machine-learning semantic model. For a final-year upgrade, add TF-IDF/cosine similarity, skills taxonomy, authentication, recruiter dashboard, and application status workflow.
