package com.planner.assessment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssessmentRecordRepository extends JpaRepository<AssessmentRecord, Long> {
    Optional<AssessmentRecord> findTopByUserIdOrderByIdDesc(Long userId);
}
