package com.careermatch.config;

import com.careermatch.entity.*;
import com.careermatch.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seed(UserRepository users, JobRepository jobs) {
        return args -> {
            User u = users.findByEmail("demo@careermatch.com").orElseGet(() -> users.save(new User("Demo User", "demo@careermatch.com", "JOB_SEEKER")));
            if (jobs.count() == 0) {
                jobs.save(new Job("Java Backend Developer", "TechNova", "Noida", "Build REST APIs, maintain Spring Boot services and work with relational databases.", "Java, Spring Boot, REST API, MySQL, JPA, Git"));
                jobs.save(new Job("Frontend Developer", "WebCraft", "Remote", "Create responsive web applications and interactive user interfaces.", "HTML, CSS, JavaScript, React, Git, REST API"));
                jobs.save(new Job("Full Stack Developer", "Innovate Labs", "Delhi NCR", "Develop end-to-end web applications using Java backend and modern frontend technologies.", "Java, Spring Boot, MySQL, JavaScript, HTML, CSS, REST API"));
            }
        };
    }
}
