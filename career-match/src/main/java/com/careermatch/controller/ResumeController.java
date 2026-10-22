package com.careermatch.controller;

import com.careermatch.entity.Resume;
import com.careermatch.repository.ResumeRepository;
import com.careermatch.service.ResumeTextService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin
public class ResumeController {
    private final ResumeRepository repo;
    private final ResumeTextService text;

    public ResumeController(ResumeRepository repo, ResumeTextService text) {
        this.repo = repo;
        this.text = text;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Resume upload(@RequestParam("file") MultipartFile file, @RequestParam Long userId) throws IOException {
        return repo.save(new Resume(file.getOriginalFilename(), text.extract(file), userId));
    }

    @GetMapping("/user/{userId}")
    public Resume latest(@PathVariable Long userId) {
        return repo.findTopByUserIdOrderByIdDesc(userId).orElseThrow();
    }
}
