package com.planner.common;

/** 业务异常：code 同时作为 HTTP 状态码（400/401/404/409/429/502...）。 */
public class BizException extends RuntimeException {
    private final int code;
    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }
    public int getCode() { return code; }
}
