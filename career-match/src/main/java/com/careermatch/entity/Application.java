package com.careermatch.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private Long jobId;
    private int matchScore;
    private String status = "APPLIED";

    public Application() {
    }

    public Application(Long userId, Long jobId, int matchScore) {
        this.userId = userId;
        this.jobId = jobId;
        this.matchScore = matchScore;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long v) {
        userId = v;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long v) {
        jobId = v;
    }

    public int getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(int v) {
        matchScore = v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String v) {
        status = v;
    }
}
