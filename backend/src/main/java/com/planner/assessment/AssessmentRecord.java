package com.planner.assessment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "assessment_record", indexes = @Index(name = "idx_ar_user", columnList = "user_id"))
public class AssessmentRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "answers_json", columnDefinition = "MEDIUMTEXT")
    private String answersJson;

    @Column(name = "stage", length = 32)
    private String stage;

    @Column(name = "profile_path", length = 255)
    private String profilePath;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
