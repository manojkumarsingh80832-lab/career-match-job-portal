package com.careermatch.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "jobs")
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false)
    private String company;
    private String location;
    @Column(length = 5000, nullable = false)
    private String description;
    private String skills;
    private String status = "ACTIVE"; // Naya field: ACTIVE ya CLOSED

    public Job() {
    }

    public Job(String title, String company, String location, String description, String skills) {
        this.title = title;
        this.company = company;
        this.location = location;
        this.description = description;
        this.skills = skills;
        this.status = "ACTIVE";
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        title = v;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String v) {
        company = v;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String v) {
        location = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String v) {
        skills = v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}