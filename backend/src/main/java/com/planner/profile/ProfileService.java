package com.planner.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planner.common.TextUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/** 个人画像文件：{profile-dir}/{userId}/profile.json。所有写操作按用户加锁 + 原子替换。 */
@Slf4j
@Service
public class ProfileService {
    public static final int MAX_ADVICES = 30;
    public record AdviceIn(String category, String content) {}

    private final ObjectMapper om;
    private final Path root;
    private final ConcurrentHashMap<Long, Object> locks = new ConcurrentHashMap<>();

    public ProfileService(ObjectMapper om, @Value("${app.profile-dir}") String dir) {
        this.om = om;
        this.root = Path.of(dir).toAbsolutePath().normalize();
    }

    public Path pathOf(long uid) {
        return root.resolve(String.valueOf(uid)).resolve("profile.json");
    }

    private Object lock(long uid) {
        return locks.computeIfAbsent(uid, k -> new Object());
    }

    /** 不存在返回 null */
    public ObjectNode load(long uid) {
        Path p = pathOf(uid);
        if (!Files.exists(p)) return null;
        try {
            return (ObjectNode) om.readTree(p.toFile());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** 重新测评：整体替换画像，但保留已积累的建议。 */
    public void replacePreservingAdvices(long uid, ObjectNode fresh) {
        synchronized (lock(uid)) {
            ObjectNode old = load(uid);
            if (old != null && old.has("advices")) fresh.set("advices", old.get("advices"));
            write(uid, fresh);
        }
    }

    /** 读-改-写；画像不存在返回 false。 */
    public boolean update(long uid, Consumer<ObjectNode> fn) {
        synchronized (lock(uid)) {
            ObjectNode n = load(uid);
            if (n == null) return false;
            fn.accept(n);
            n.put("updatedAt", LocalDateTime.now().toString());
            write(uid, n);
            return true;
        }
    }

    private void write(long uid, ObjectNode node) {
        Path target = pathOf(uid);
        try {
            Files.createDirectories(target.getParent());
            Path tmp = target.resolveSibling("profile.json.tmp");
            om.writerWithDefaultPrettyPrinter().writeValue(tmp.toFile(), node);
            try {
                Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** 把对话中提取的建议并入画像：去重（2-gram Jaccard>=0.6），最多保留最近 MAX_ADVICES 条。 */
    public void addAdvices(long uid, List<AdviceIn> items) {
        if (items.isEmpty()) return;
        update(uid, p -> {
            ArrayNode arr = p.withArray("advices");
            List<Set<String>> seen = new ArrayList<>();
            arr.forEach(a -> seen.add(TextUtil.bigrams(a.path("content").asText())));
            for (AdviceIn it : items) {
                Set<String> g = TextUtil.bigrams(it.content());
                boolean dup = seen.stream().anyMatch(s -> TextUtil.jaccard(s, g) >= 0.6);
                if (dup) continue;
                seen.add(g);
                ObjectNode a = om.createObjectNode();
                a.put("id", UUID.randomUUID().toString().substring(0, 8));
                a.put("category", it.category());
                a.put("content", it.content());
                a.put("source", "chat");
                a.put("stage", p.path("stage").asText(""));
                a.put("createdAt", LocalDateTime.now().toString());
                arr.add(a);
            }
            while (arr.size() > MAX_ADVICES) arr.remove(0);
        });
    }

    public boolean deleteAdvice(long uid, String id) {
        boolean[] removed = {false};
        update(uid, p -> {
            ArrayNode arr = p.withArray("advices");
            for (int i = arr.size() - 1; i >= 0; i--) {
                if (id.equals(arr.get(i).path("id").asText())) {
                    arr.remove(i);
                    removed[0] = true;
                }
            }
        });
        return removed[0];
    }

    // ---------- 给大模型看的画像文本 ----------

    public String toPromptText(ObjectNode p, boolean forChat) {
        StringBuilder sb = new StringBuilder();
        sb.append("称呼：").append(t(p, "/nickname")).append("；年龄：").append(p.path("age").asText("?"))
          .append("岁；性别：").append(t(p, "/gender")).append("；城市：").append(t(p, "/city")).append('\n');
        sb.append("当前阶段：").append(t(p, "/stageLabel")).append("（").append(t(p, "/grade"))
          .append("）；填写人：").append(t(p, "/filledBy")).append("；家庭教育预算：").append(t(p, "/budget")).append('\n');
        sb.append("MBTI倾向：").append(t(p, "/mbti/type")).append("（").append(t(p, "/mbti/note"));
        JsonNode border = p.at("/mbti/borderline");
        if (border.isArray() && !border.isEmpty()) sb.append("；倾向不明显的维度：").append(join(border));
        sb.append("）\n");
        sb.append("上过的班：").append(join(p.at("/tutoring/classes"))).append("；情况：").append(t(p, "/tutoring/detail"))
          .append("；态度：").append(t(p, "/tutoring/attitude")).append('\n');
        sb.append("成绩：").append(t(p, "/academic/scores")).append("；擅长：").append(join(p.at("/academic/strong")))
          .append("；薄弱：").append(join(p.at("/academic/weak"))).append("；每日课外学习：").append(t(p, "/academic/dailyHours"))
          .append("；学习困扰：").append(join(p.at("/academic/issues"))).append('\n');
        sb.append("兴趣：").append(join(p.path("interests"))).append("；性格自述：").append(t(p, "/traits")).append('\n');
        sb.append("学习习惯：风格=").append(join(p.at("/habits/style"))).append("；单次专注=").append(t(p, "/habits/focus"))
          .append("；最佳时段=").append(t(p, "/habits/bestTime")).append("；睡眠=").append(t(p, "/habits/sleep"))
          .append("；每周运动=").append(t(p, "/habits/exercise")).append("；每日屏幕娱乐=").append(t(p, "/habits/screen"))
          .append("；家长参与=").append(t(p, "/habits/family")).append('\n');
        String hol = p.at("/holland/code").asText("");
        if (!hol.isBlank()) {
            sb.append("职业兴趣（霍兰德简化版）：").append(hol).append("（").append(join(p.at("/holland/labels"))).append("）\n");
        }
        sb.append("规则分析出的关注点：").append(join(p.at("/highlights/concerns"))).append('\n');
        sb.append("目标：").append(t(p, "/goals/goal")).append("；意向职业：").append(t(p, "/goals/career"))
          .append("；意向路径：").append(t(p, "/goals/path")).append("；最困扰：").append(t(p, "/goals/worry")).append('\n');
        if (forChat) {
            String summary = p.path("summary").asText("");
            if (!summary.isBlank()) sb.append("画像摘要：").append(summary).append('\n');
            JsonNode adv = p.path("advices");
            if (adv.isArray() && !adv.isEmpty()) {
                sb.append("此前已给过的建议（避免重复，可在此基础上深化）：\n");
                for (int i = Math.max(0, adv.size() - 5); i < adv.size(); i++) {
                    sb.append("- [").append(adv.get(i).path("category").asText()).append("] ")
                      .append(adv.get(i).path("content").asText()).append('\n');
                }
            }
        }
        return sb.toString();
    }

    public String fallbackSummary(ObjectNode p) {
        return "%s，%s岁，处于%s阶段。MBTI倾向为%s（仅供参考）。擅长：%s；薄弱：%s。主要目标：%s。".formatted(
                t(p, "/nickname"), p.path("age").asText("?"), t(p, "/stageLabel"), t(p, "/mbti/type"),
                join(p.at("/academic/strong")), join(p.at("/academic/weak")), t(p, "/goals/goal"));
    }

    private static String t(JsonNode n, String ptr) {
        String v = n.at(ptr).asText("");
        return v.isBlank() ? "未填写" : v;
    }

    private static String join(JsonNode arr) {
        if (arr == null || !arr.isArray() || arr.isEmpty()) return "无";
        StringJoiner sj = new StringJoiner("、");
        arr.forEach(x -> sj.add(x.asText()));
        return sj.toString();
    }
}
