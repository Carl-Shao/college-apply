package com.planner.common;

public final class UserContext {
    private static final ThreadLocal<Long> HOLDER = new ThreadLocal<>();
    private UserContext() {}
    public static void set(Long uid) { HOLDER.set(uid); }
    public static long require() {
        Long id = HOLDER.get();
        if (id == null) throw new BizException(401, "未登录");
        return id;
    }
    public static void clear() { HOLDER.remove(); }
}
