package com.planner.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findTop6ByUserIdAndSessionIdOrderByIdDesc(Long userId, String sessionId);
    List<ChatMessage> findTop50ByUserIdAndSessionIdOrderByIdDesc(Long userId, String sessionId);
}
