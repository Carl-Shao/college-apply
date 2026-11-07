# 学涯规划助手（后端）

Spring Boot 3.2 / Java 17 / MySQL 8 / Redis / Ollama(qwen 7B)

## 启动
1. 执行 `sql/schema.sql`（或直接用 `ddl-auto: update` 自动建表，库需先建好并使用 utf8mb4）
2. 启动 Redis；`ollama serve`，确认 `ollama list` 里的模型名与 `app.ollama.model` 一致
3. 设置环境变量 `DB_USER / DB_PASSWORD / JWT_SECRET`（JWT_SECRET 至少 32 字节）
4. `mvn spring-boot:run`

短信默认 `app.sms.mock=true`，验证码只打印到日志。接入真实网关：改 `application.yml` 的 `app.sms.*`，
并按服务商文档调整 `SmsService.callApi` 里的请求体/签名。

## 接口（统一返回 {code,msg,data}，除 /api/auth/** 外需 `Authorization: Bearer <token>`）
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth/sms/send | {phone} 发送验证码（60s 一次、5 分钟有效） |
| POST | /api/auth/register | {phone,password,code} |
| POST | /api/auth/login | {phone,password} |
| GET | /api/assessment/questions | 题目 |
| POST | /api/assessment/submit | {answers:{id:值}} 生成画像文件 |
| GET | /api/assessment/status | 是否已测评 |
| GET | /api/profile | 画像（含 summary、advices） |
| DELETE | /api/profile/advices/{id} | 删除某条建议 |
| GET | /api/profile/download | 下载画像 JSON |
| POST | /api/chat | 非流式对话 {message,sessionId?} |
| POST | /api/chat/stream | SSE 流式对话 |
| GET | /api/chat/history?sessionId= | 会话历史 |

画像文件位置：`./data/profiles/{userId}/profile.json`
额外知识库：往 `./data/knowledge/` 放 `{stage}.md`（stage=kindergarten/primary/middle/high/university/career/general），按 `## 标题` 分段，重启生效。

## 新增能力
**短信**：`SMS_PROVIDER=aliyun|tencent|http|mock`（默认 mock）。阿里云需 `ALIYUN_AK_ID/ALIYUN_AK_SECRET/ALIYUN_SMS_SIGN/ALIYUN_SMS_TEMPLATE`（模板变量 `${code}`，AK 用 RAM 子账号只给短信权限）；
腾讯云需 `TENCENT_SECRET_ID/TENCENT_SECRET_KEY/TENCENT_SMS_APP_ID/TENCENT_SMS_SIGN/TENCENT_SMS_TEMPLATE`（模板参数 `{1}`=验证码 `{2}`=有效分钟）。配置不全会在启动时直接报错。

**向量检索**：`ollama pull bge-m3`，`app.knowledge.embedding.enabled=true`（默认）。启动时后台生成向量并缓存到 `data/knowledge-cache/`；
Ollama/模型不可用时自动回退关键词检索。显存紧张时设置 `OLLAMA_MAX_LOADED_MODELS=2`，避免对话模型与 embedding 模型来回换入换出。

**画像新增字段**：`habits`（学习风格/专注/时段/睡眠/运动/屏幕/家长参与）、`holland`（霍兰德职业兴趣代码，题型 `SCALE`，1-5 分，选填）、
`highlights`（规则计算的 strengths / concerns）、`completeness`（完整度百分比与缺失项）。旧用户重新测评后才会有这些字段。
