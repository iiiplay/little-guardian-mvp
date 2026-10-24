package com.iiiplay.littleguardian;

public final class UpdatePolicyTest {
    private static int checks;
    private static void check(boolean value) { checks++; if (!value) throw new AssertionError("check " + checks); }
    private static void rejects(Runnable action) {
        checks++;
        try { action.run(); } catch (IllegalArgumentException expected) { return; }
        throw new AssertionError("expected rejection at " + checks);
    }
    public static void main(String[] args) {
        String hash = "a".repeat(64);
        check(UpdatePolicy.newer(100001, 100002));
        check(!UpdatePolicy.newer(100002, 100002));
        check(!UpdatePolicy.newer(100002, 100001));
        UpdatePolicy.validate(100002, "0.10.0-test.2", hash, 1200000, "https://example.org/game.apk", false);
        UpdatePolicy.checkUrl("http://192.168.0.33:8765/dist/android/update.json", true);
        rejects(() -> UpdatePolicy.checkUrl("http://192.168.0.33:8765/game.apk", false));
        rejects(() -> UpdatePolicy.checkUrl("http://example.org/game.apk", true));
        rejects(() -> UpdatePolicy.checkUrl("http://192.168.0.33:80/game.apk", true));
        rejects(() -> UpdatePolicy.checkUrl("file:///sdcard/game.apk", true));
        rejects(() -> UpdatePolicy.checkUrl("https://user:secret@example.org/game.apk", false));
        rejects(() -> UpdatePolicy.validate(2, "test", "bad", 100, "https://example.org/game.apk", false));
        rejects(() -> UpdatePolicy.validate(2, "test", hash, 0, "https://example.org/game.apk", false));
        rejects(() -> UpdatePolicy.validate(2, "test", hash, UpdatePolicy.MAX_APK_BYTES + 1, "https://example.org/game.apk", false));
        rejects(() -> UpdatePolicy.validate(0, "test", hash, 100, "https://example.org/game.apk", false));
        UpdatePolicy.verifyDownload(100, hash, 100, hash.toUpperCase());
        rejects(() -> UpdatePolicy.verifyDownload(100, hash, 99, hash));
        rejects(() -> UpdatePolicy.verifyDownload(100, hash, 100, "b".repeat(64)));
        System.out.println("PASS: " + checks + " update version, URL, size and checksum rules.");
    }
}
