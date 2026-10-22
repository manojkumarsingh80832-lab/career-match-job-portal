package com.careermatch.controller;

import com.careermatch.entity.Application;
import com.careermatch.entity.Job;
import com.careermatch.entity.Resume;
import com.careermatch.repository.ApplicationRepository;
import com.careermatch.repository.JobRepository;
import com.careermatch.repository.ResumeRepository;
import com.careermatch.repository.UserRepository;
import com.careermatch.service.EmailService;
import com.careermatch.service.NlpMatchingService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin
public class ApplicationController {
    private final ApplicationRepository apps;
    private final JobRepository jobs;
    private final ResumeRepository resumes;
    private final NlpMatchingService nlp;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ApplicationController(ApplicationRepository apps, JobRepository jobs, ResumeRepository resumes, NlpMatchingService nlp, UserRepository userRepository, EmailService emailService) {
        this.apps = apps;
        this.jobs = jobs;
        this.resumes = resumes;
        this.nlp = nlp;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @PostMapping
    public Application apply(@RequestParam Long userId, @RequestParam Long jobId) {
        if (apps.existsByUserIdAndJobId(userId, jobId)) {
            throw new RuntimeException("You have already applied for this job.");
        }
        Job j = jobs.findById(jobId).orElseThrow();
        Resume r = resumes.findTopByUserIdOrderByIdDesc(userId).orElseThrow();
        int s = nlp.calculateScore(r.getExtractedText(), j.getDescription(), j.getSkills());
        return apps.save(new Application(userId, jobId, s));
    }

    @GetMapping
    public List<Map<String, Object>> allApps() {
        return apps.findAll().stream().map(a -> {
            Job job = jobs.findById(a.getJobId()).orElse(null);

            // User fetch karein repository se
            com.careermatch.entity.User user = userRepository.findById(a.getUserId()).orElse(null);

            Map<String, Object> result = new HashMap<>();
            result.put("id", a.getId());
            result.put("userId", a.getUserId());
            result.put("jobId", a.getJobId());
            result.put("matchScore", a.getMatchScore());
            result.put("status", a.getStatus());

            if (job != null) {
                result.put("jobTitle", job.getTitle());
                result.put("company", job.getCompany());
                result.put("location", job.getLocation());
            }

            // Candidate details mapping with fallback
            if (user != null) {
                result.put("candidateName", user.getName());
                result.put("candidateEmail", user.getEmail());
                result.put("candidatePhone", user.getPhone());
                result.put("candidateCollege", user.getCollege());
            } else {
                result.put("candidateName", "User ID: " + a.getUserId());
                result.put("candidateEmail", "Not Available");
                result.put("candidatePhone", "Not Available");
                result.put("candidateCollege", "Not Available");
            }

            return result;
        }).toList();
    }

    @GetMapping("/user/{userId}")
    public List<Map<String, Object>> userApps(@PathVariable Long userId) {
        return allApps().stream().filter(a -> ((Long) a.get("userId")).equals(userId)).toList();
    }

    @PutMapping("/{id}/status")
    public Application updateStatus(@PathVariable Long id, @RequestParam String status) {
        Application app = apps.findById(id).orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(status);
        apps.save(app);

        // Send Real Email to Candidate
        com.careermatch.entity.User user = userRepository.findById(app.getUserId()).orElse(null);
        if (user != null && user.getEmail() != null) {
            emailService.sendEmail(
                    user.getEmail(),
                    "CareerMatch: Application Status Updated",
                    "Hello " + user.getName() + ",\n\nYour application status has been updated to: " + status + ".\n\nBest regards,\nCareerMatch Team"
            );
        }

        return app;
    }
}