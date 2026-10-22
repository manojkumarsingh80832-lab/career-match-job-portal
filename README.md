# CareerMatch — Full-Stack Job Portal with NLP Resume Matching

A robust, production-ready Job Portal application built with **Java Spring Boot**, **Spring Security**, **MySQL**, and a responsive Vanilla JavaScript frontend. It features automated resume parsing and keyword matching using basic vector NLP, role-based access control, visual application status tracking, and real email notifications via Gmail SMTP.

## 🚀 Tech Stack
* **Backend:** Java, Spring Boot, Spring Security, Spring Data JPA, Hibernate
* **Database:** MySQL
* **Document Processing & NLP:** Apache PDFBox, Custom Vector NLP Matching Algorithm
* **Communication:** Spring Boot Starter Mail (Gmail SMTP)
* **Frontend:** HTML5, CSS3,  JavaScript

## 📌 Key Features
1. **NLP Resume Matching:** Extracts text from uploaded PDF resumes and computes compatibility match score.
2. **Role-Based Workflows:** Distinct dashboards for Admins (job creation, candidate tracking) and Job Seekers (resume upload, job applications).
3. **Visual Progress Tracker:** Dynamic progress stepper (`Applied ➔ Shortlisted ➔ Interview`).
4. **Real Email Notifications:** Automated SMTP email triggers sent to candidates on status updates.
