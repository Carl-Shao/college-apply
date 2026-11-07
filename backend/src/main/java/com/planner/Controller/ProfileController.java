package com.planner.Controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planner.common.BizException;
import com.planner.common.Result;
import com.planner.common.UserContext;
import com.planner.profile.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profiles;
    private final ObjectMapper om;

    /** 个人画像页：基本信息、MBTI、班/成绩/兴趣/目标、AI 摘要、对话提取的建议 advices[] */
    @GetMapping
    public Result<ObjectNode> get() {
        return Result.ok(require());
    }

    /** 删除一条建议（用户可清理不想保留的建议） */
    @DeleteMapping("/advices/{id}")
    public Result<Void> deleteAdvice(@PathVariable String id) {
        if (!profiles.deleteAdvice(UserContext.require(), id)) throw new BizException(404, "建议不存在");
        return Result.ok();
    }

    /** 下载画像文件 */
    @GetMapping("/download")
    public ResponseEntity<byte[]> download() throws JsonProcessingException {
        byte[] bytes = om.writerWithDefaultPrettyPrinter().writeValueAsBytes(require());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"profile.json\"")
                .body(bytes);
    }

    private ObjectNode require() {
        ObjectNode p = profiles.load(UserContext.require());
        if (p == null) throw new BizException(404, "尚未完成测评，请先完成测评");
        return p;
    }
}
