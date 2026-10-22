package com.careermatch.controller;

import com.careermatch.entity.User;
import com.careermatch.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

 private final UserRepository repo;

 private final BCryptPasswordEncoder passwordEncoder =
         new BCryptPasswordEncoder();

 public UserController(UserRepository repo) {
  this.repo = repo;
 }

 @PostMapping
 public ResponseEntity<?> create(@RequestBody User user) {

  if (repo.findByEmail(user.getEmail()).isPresent()) {
   return ResponseEntity
           .badRequest()
           .body("Email already registered");
  }

  user.setPassword(passwordEncoder.encode(user.getPassword()));

  if (user.getRole() == null || user.getRole().isEmpty()) {
   user.setRole("JOB_SEEKER");
  }

  return ResponseEntity.ok(repo.save(user));
 }

 @PostMapping("/login")
 public ResponseEntity<?> login(@RequestBody User loginUser) {

  User user = repo.findByEmail(loginUser.getEmail()).orElse(null);

  if (user == null) {
   return ResponseEntity
           .badRequest()
           .body("Invalid email or password");
  }

  if (!passwordEncoder.matches(
          loginUser.getPassword(),
          user.getPassword())) {

   return ResponseEntity
           .badRequest()
           .body("Invalid email or password");
  }

  user.setPassword(null);

  return ResponseEntity.ok(user);
 }


 @PutMapping("/{id}")
 public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
  User user = repo.findById(id)
          .orElseThrow(() -> new RuntimeException("User not found"));

  user.setName(updatedUser.getName());
  user.setPhone(updatedUser.getPhone());
  user.setCollege(updatedUser.getCollege());
  user.setSkills(updatedUser.getSkills());
  user.setLinkedinUrl(updatedUser.getLinkedinUrl());


  if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
   user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
  }

  User savedUser = repo.save(user);
  savedUser.setPassword(null); // Security ke liye password hide karein response mein

  return ResponseEntity.ok(savedUser);
 }

// Forgot Password API
@PutMapping("/forgot-password")
public ResponseEntity<?> forgotPassword(@RequestBody User requestUser) {
 User user = repo.findByEmail(requestUser.getEmail()).orElse(null);

 if (user == null) {
  return ResponseEntity.badRequest().body("Email not found");
 }

 // Naya password encrypt karke save karein
 user.setPassword(passwordEncoder.encode(requestUser.getPassword()));
 repo.save(user);

 return ResponseEntity.ok("Password updated successfully! Please login with your new password.");
}
}