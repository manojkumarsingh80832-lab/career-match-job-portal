package com.careermatch.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class NlpMatchingService {


    private static final Set<String> STOP = Set.of(
            "the", "and", "for", "with", "from", "this", "that",
            "are", "you", "your", "have", "has", "will", "job",
            "role", "work", "years", "year", "using", "into",
            "our", "their", "they", "to", "of", "in", "on",
            "is", "be", "as", "at", "or", "by", "we"
    );


    public int calculateScore(String resumeText, String jobText, String skills) {

        Set<String> resume = tokenize(resumeText);
        Set<String> required = tokenize(skills);

        if (required.isEmpty()) {
            required = tokenize(jobText);
        }

        if (required.isEmpty()) {
            return 0;
        }

        long matched = required.stream()
                .filter(resume::contains)
                .count();

        return (int) Math.round(matched * 100.0 / required.size());
    }


    public List<String> matchedKeywords(
            String resumeText,
            String jobText,
            String skills) {

        Set<String> resume = tokenize(resumeText);
        Set<String> required = tokenize(skills);

        if (required.isEmpty()) {
            required = tokenize(jobText);
        }

        return required.stream()
                .filter(resume::contains)
                .sorted()
                .toList();
    }


    public List<String> missingKeywords(
            String resumeText,
            String jobText,
            String skills) {

        Set<String> resume = tokenize(resumeText);
        Set<String> required = tokenize(skills);

        if (required.isEmpty()) {
            required = tokenize(jobText);
        }

        return required.stream()
                .filter(keyword -> !resume.contains(keyword))
                .sorted()
                .toList();
    }


    private Set<String> tokenize(String text) {

        return Pattern.compile("[^a-zA-Z0-9+#.]+")
                .splitAsStream(text == null ? "" : text.toLowerCase())
                .map(String::trim)
                .filter(word -> word.length() > 1)
                .filter(word -> !STOP.contains(word))
                .collect(Collectors.toSet());
    }


}
