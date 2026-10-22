package com.careermatch.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "resumes")
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fileName;
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String extractedText;
    private Long userId;

    public Resume() {
    }

    public Resume(String fileName, String extractedText, Long userId) {
        this.fileName = fileName;
        this.extractedText = extractedText;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String v) {
        fileName = v;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String v) {
        extractedText = v;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long v) {
        userId = v;
    }
}
