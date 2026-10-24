package com.iiiplay.littleguardian;

import java.net.URI;
import java.util.Locale;

/** Pure Java rules, shared by networking and regression tests. */
final class UpdatePolicy {
    static final long MAX_APK_BYTES = 100L * 1024 * 1024;

    static void checkUrl(String value, boolean internalTest) {
        URI uri = URI.create(value);
        boolean https = "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
        boolean lan = internalTest && "http".equalsIgnoreCase(uri.getScheme())
            && "192.168.0.33".equals(uri.getHost()) && uri.getPort() == 8765;
        if ((!https && !lan) || uri.getUserInfo() != null || uri.getFragment() != null)
            throw new IllegalArgumentException("更新網址必須使用 HTTPS（測試版僅允許指定的區網來源）");
    }

    static void validate(int version, String name, String hash, long bytes, String url, boolean internalTest) {
        if (version <= 0 || name.isEmpty() || name.length() > 100)
            throw new IllegalArgumentException("版本資料不完整");
        if (!hash.toLowerCase(Locale.ROOT).matches("[0-9a-f]{64}"))
            throw new IllegalArgumentException("缺少更新檔校驗碼");
        if (bytes < 1 || bytes > MAX_APK_BYTES) throw new IllegalArgumentException("更新檔大小不正確");
        checkUrl(url, internalTest);
    }

    static boolean newer(int installed, int candidate) { return candidate > installed; }
    static void verifyDownload(long expectedBytes, String expectedHash, long bytes, String hash) {
        if (bytes != expectedBytes || !expectedHash.equalsIgnoreCase(hash))
            throw new IllegalArgumentException("更新檔校驗失敗，請重新下載");
    }
}
