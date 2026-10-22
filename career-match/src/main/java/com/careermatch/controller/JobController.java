package com.careermatch.controller;

import com.careermatch.entity.Job;
import com.careermatch.entity.Resume;
import com.careermatch.repository.ApplicationRepository;
import com.careermatch.repository.JobRepository;
import com.careermatch.repository.ResumeRepository;
import com.careermatch.repository.UserRepository;
import com.careermatch.service.NlpMatchingService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin
public class JobController {

 private final JobRepository jobs;
 private final ResumeRepository resumes;
 private final NlpMatchingService nlp;
 private final UserRepository userRepository;
 private final ApplicationRepository apps;

 public JobController(JobRepository jobs, ResumeRepository resumes, NlpMatchingService nlp, UserRepository userRepository, ApplicationRepository apps) {
  this.jobs = jobs;
  this.resumes = resumes;
  this.nlp = nlp;
  this.userRepository = userRepository;
  this.apps = apps;
 }

 // Get all jobs
 @GetMapping
 public List<Job> all() {
  return jobs.findAll();
 }

 // Create a new job (Admin)
 @PostMapping
 public Job create(@RequestBody Job job) {
  if (job.getStatus() == null || job.getStatus().isEmpty()) {
   job.setStatus("ACTIVE");
  }
  return jobs.save(job);
 }

 // Update an existing job (Admin)
 @PutMapping("/{id}")
 public Job update(@PathVariable Long id, @RequestBody Job jobDetails) {
  Job job = jobs.findById(id).orElseThrow(() -> new RuntimeException("Job not found with id " + id));
  job.setTitle(jobDetails.getTitle());
  job.setCompany(jobDetails.getCompany());
  job.setLocation(jobDetails.getLocation());
  job.setDescription(jobDetails.getDescription());
  job.setSkills(jobDetails.getSkills());
  if (jobDetails.getStatus() != null) {
   job.setStatus(jobDetails.getStatus());
  }
  return jobs.save(job);
 }

 // Delete a job (Admin)
 @DeleteMapping("/{id}")
 public void deleteJob(@PathVariable Long id) {
  jobs.deleteById(id);
 }

 // Match resume with a job using basic NLP
 @GetMapping("/{id}/match/{userId}")
 public Map<String, Object> match(@PathVariable Long id, @PathVariable Long userId) {
  Job job = jobs.findById(id).orElseThrow();
  Resume resume = resumes.findTopByUserIdOrderByIdDesc(userId).orElseThrow();
  String resumeText = resume.getExtractedText();

  int score = nlp.calculateScore(resumeText, job.getDescription(), job.getSkills());
  List<String> matched = nlp.matchedKeywords(resumeText, job.getDescription(), job.getSkills());
  List<String> missing = nlp.missingKeywords(resumeText, job.getDescription(), job.getSkills());

  return Map.of(
          "jobId", job.getId(),
          "userId", userId,
          "score", score,
          "matchedKeywords", matched,
          "missingKeywords", missing
  );
 }

 // Admin Analytics Stats API (Endpoint: /api/jobs/stats)
 @GetMapping("/stats")
 public Map<String, Long> getAdminStats() {
  long totalJobs = jobs.count();
  long totalCandidates = userRepository.findAll().stream().filter(u -> "JOB_SEEKER".equals(u.getRole())).count();
  long totalApplications = apps.count();

  return Map.of(
          "totalJobs", totalJobs,
          "totalCandidates", totalCandidates,
          "totalApplications", totalApplications
  );
 }
 @GetMapping("/paged")
 public org.springframework.data.domain.Page<Job> getPagedJobs(
         @RequestParam(defaultValue = "0") int page,
         @RequestParam(defaultValue = "6") int size) {
  return jobs.findAll(org.springframework.data.domain.PageRequest.of(page, size));
 }
}