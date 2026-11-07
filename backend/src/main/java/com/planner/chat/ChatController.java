package com.planner.chat;

import com.planner.chat.ChatDtos.*;
import com.planner.common.Result;
import com.planner.common.UserContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chat;

    /** 非流式对话 */
    @PostMapping
    public Result<ChatResp> chat(@Valid @RequestBody ChatReq req) {
        return Result.ok(chat.chat(UserContext.require(), req));
    }

    /** 流式对话（SSE）。前端用 fetch + ReadableStream（需要带 Authorization 头，EventSource 不支持） */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@Valid @RequestBody ChatReq req) {
        return chat.stream(UserContext.require(), req);
    }

    /** 某个会话最近 50 条消息 */
    @GetMapping("/history")
    public Result<List<MsgView>> history(@RequestParam String sessionId) {
        return Result.ok(chat.history(UserContext.require(), sessionId));
    }
}
