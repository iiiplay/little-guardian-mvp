package com.iiiplay.littleguardian;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/** Internal sideload channel. No credentials or JavaScript-to-native bridge. */
final class AppUpdater {
    private final Activity activity;
    private final Runnable openGame;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private boolean destroyed, opened, awaitingPermission;
    private AlertDialog dialog;
    private Release release;
    private File readyApk;
    private AtomicBoolean operation = new AtomicBoolean();

    AppUpdater(Activity activity, Runnable openGame) { this.activity = activity; this.openGame = openGame; }

    private static final class Release {
        final int code; final String name, url, hash, notes; final long bytes;
        Release(JSONObject json) throws Exception {
            code = json.getInt("versionCode"); name = json.getString("versionName");
            url = json.getString("apkUrl"); hash = json.getString("sha256");
            bytes = json.getLong("sizeBytes"); notes = json.optString("notes", "遊戲體驗與問題修正");
            UpdatePolicy.validate(code, name, hash, bytes, url, BuildConfig.DEBUG);
        }
    }

    void start() {
        AtomicBoolean token = new AtomicBoolean(); operation = token;
        ProgressBar progress = new ProgressBar(activity);
        dialog = new AlertDialog.Builder(activity).setTitle("小小守護者 " + BuildConfig.VERSION_NAME)
            .setMessage("正在檢查更新…\n離線也能繼續遊玩。")
            .setView(progress).setCancelable(false)
            .setNegativeButton("直接開始", (d, w) -> { token.set(true); beginGame(); }).show();
        worker.execute(() -> {
            try {
                HttpURLConnection connection = connect(BuildConfig.UPDATE_MANIFEST_URL, 5000);
                byte[] data;
                try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[4096]; int n;
                    long deadline = System.nanoTime() + 6_000_000_000L;
                    while ((n = input.read(buffer)) != -1) {
                        if (token.get() || System.nanoTime() > deadline) throw new Exception("檢查更新逾時");
                        if (output.size() + n > 32768) throw new Exception("版本檔過大");
                        output.write(buffer, 0, n);
                    }
                    data = output.toByteArray();
                } finally { connection.disconnect(); }
                Release candidate = new Release(new JSONObject(new String(data, java.nio.charset.StandardCharsets.UTF_8)));
                ui(token, () -> {
                    dismiss();
                    if (!UpdatePolicy.newer(BuildConfig.VERSION_CODE, candidate.code)) { beginGame(); return; }
                    release = candidate;
                    dialog = new AlertDialog.Builder(activity).setTitle("發現新版 " + candidate.name)
                        .setMessage(candidate.notes + "\n\n下載約 " + String.format(java.util.Locale.ROOT, "%.2f", candidate.bytes / 1048576.0) + " MB，保留目前存檔。")
                        .setCancelable(false).setPositiveButton("下載更新", (d, w) -> download())
                        .setNegativeButton("稍後再說", (d, w) -> beginGame()).show();
                });
            } catch (Exception error) {
                ui(token, () -> { dismiss(); Toast.makeText(activity, "暫時無法檢查更新，繼續離線遊玩", Toast.LENGTH_LONG).show(); beginGame(); });
            }
        });
    }

    private HttpURLConnection connect(String address, int timeout) throws Exception {
        String current = address;
        for (int redirects = 0; redirects < 6; redirects++) {
            UpdatePolicy.checkUrl(current, BuildConfig.DEBUG);
            HttpURLConnection connection = (HttpURLConnection) new URL(current).openConnection();
            connection.setConnectTimeout(timeout); connection.setReadTimeout(timeout);
            connection.setInstanceFollowRedirects(false); connection.setUseCaches(false);
            connection.setRequestProperty("Cache-Control", "no-cache");
            connection.setRequestProperty("Accept-Encoding", "identity");
            int status;
            try { status = connection.getResponseCode(); }
            catch (Exception error) { connection.disconnect(); throw error; }
            if (status >= 300 && status < 400) {
                String next = connection.getHeaderField("Location"); connection.disconnect();
                if (next == null) throw new Exception("更新網址重新導向錯誤");
                String resolved = new URL(new URL(current), next).toExternalForm();
                if (current.startsWith("https:") && !resolved.startsWith("https:")) throw new Exception("更新連線不安全");
                current = resolved; continue;
            }
            if (status != 200) { connection.disconnect(); throw new Exception("更新伺服器暫時無法使用"); }
            return connection;
        }
        throw new Exception("更新網址重新導向次數過多");
    }

    private void download() {
        AtomicBoolean token = new AtomicBoolean(); operation = token;
        ProgressBar progress = new ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        dialog = new AlertDialog.Builder(activity).setTitle("下載 " + release.name).setView(progress)
            .setMessage("下載完成後會核對檔案，再請你確認安裝。")
            .setCancelable(false).setNegativeButton("取消", (d, w) -> { token.set(true); beginGame(); }).show();
        worker.execute(() -> {
            File folder = new File(activity.getFilesDir(), "updates");
            File partial = new File(folder, "update.partial.apk");
            File target = new File(folder, "update.apk");
            try {
                if (!folder.isDirectory() && !folder.mkdirs()) throw new Exception("無法建立下載資料夾");
                HttpURLConnection connection = connect(release.url, 15000);
                try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(partial)) {
                    long total = 0, deadline = System.nanoTime() + 120_000_000_000L; int n, last = -1;
                    byte[] buffer = new byte[32768];
                    while ((n = input.read(buffer)) != -1) {
                        if (token.get() || System.nanoTime() > deadline) throw new Exception("下載已取消或逾時");
                        total += n;
                        if (total > release.bytes || total > UpdatePolicy.MAX_APK_BYTES) throw new Exception("更新檔大小不符");
                        output.write(buffer, 0, n);
                        int percent = (int) (total * 100 / release.bytes);
                        if (percent != last) { last = percent; ui(token, () -> progress.setProgress(percent)); }
                    }
                } finally { connection.disconnect(); }
                verify(partial);
                if (token.get()) return;
                if (target.exists() && !target.delete()) throw new Exception("無法清除先前的更新檔");
                if (!partial.renameTo(target)) throw new Exception("無法儲存更新檔");
                readyApk = target;
                ui(token, () -> { dismiss(); installPrompt(); });
            } catch (Exception error) {
                ui(token, () -> { dismiss();
                    dialog = new AlertDialog.Builder(activity).setTitle("更新未完成")
                        .setMessage("無法下載或驗證新版。請確認連線後重試；目前存檔不受影響。")
                        .setCancelable(false).setPositiveButton("重新下載", (d, w) -> download())
                        .setNegativeButton("先玩遊戲", (d, w) -> beginGame()).show();
                });
            } finally { if (partial.exists()) partial.delete(); }
        });
    }

    private void verify(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[32768]; int n;
            while ((n = input.read(buffer)) != -1) digest.update(buffer, 0, n);
        }
        StringBuilder hex = new StringBuilder();
        for (byte b : digest.digest()) hex.append(String.format(java.util.Locale.ROOT, "%02x", b & 255));
        UpdatePolicy.verifyDownload(release.bytes, release.hash, file.length(), hex.toString());
        PackageManager pm = activity.getPackageManager();
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo archive = pm.getPackageArchiveInfo(file.getAbsolutePath(), flags);
        PackageInfo installed = pm.getPackageInfo(activity.getPackageName(), flags);
        if (archive == null || !activity.getPackageName().equals(archive.packageName)) throw new Exception("更新套件名稱不符");
        long code = Build.VERSION.SDK_INT >= 28 ? archive.getLongVersionCode() : archive.versionCode;
        if (code != release.code || code <= BuildConfig.VERSION_CODE) throw new Exception("更新版本不符");
        if (!signers(archive).equals(signers(installed)) || signers(archive).isEmpty()) throw new Exception("更新簽章不符");
    }

    private Set<String> signers(PackageInfo info) {
        Signature[] signatures = Build.VERSION.SDK_INT >= 28
            ? (info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners()) : info.signatures;
        Set<String> result = new HashSet<>();
        if (signatures != null) for (Signature signature : signatures) result.add(signature.toCharsString());
        return result;
    }

    private void installPrompt() {
        dialog = new AlertDialog.Builder(activity).setTitle("新版已準備好")
            .setMessage("檔案與簽章驗證通過。接下來由 Android 系統確認安裝，請選擇更新，保留遊戲存檔。")
            .setCancelable(false).setPositiveButton("安裝更新", (d, w) -> requestInstall())
            .setNegativeButton("稍後再說", (d, w) -> beginGame()).show();
    }

    private void requestInstall() {
        try {
            if (!activity.getPackageManager().canRequestPackageInstalls()) {
                dialog = new AlertDialog.Builder(activity).setTitle("允許安裝更新")
                    .setMessage("請在下一個系統畫面允許「小小守護者」安裝應用程式，再返回此處繼續。")
                    .setCancelable(false).setPositiveButton("開啟設定", (d, w) -> {
                        try {
                            awaitingPermission = true;
                            activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + activity.getPackageName())));
                        } catch (Exception error) { awaitingPermission = false; installFailure(); }
                    }).setNegativeButton("先玩遊戲", (d, w) -> beginGame()).show();
                return;
            }
            verify(readyApk);
            Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".updates", readyApk);
            Intent intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.setClipData(ClipData.newRawUri("update", uri));
            activity.startActivity(intent);
            beginGame();
        } catch (Exception error) { installFailure(); }
    }

    private void installFailure() {
        dialog = new AlertDialog.Builder(activity).setTitle("暫時無法安裝")
            .setMessage("請確認允許安裝應用程式；你也可以稍後重新開啟遊戲再試。")
            .setPositiveButton("重試", (d, w) -> requestInstall())
            .setNegativeButton("先玩遊戲", (d, w) -> beginGame()).setCancelable(false).show();
    }

    void onResume() {
        if (awaitingPermission) { awaitingPermission = false;
            if (activity.getPackageManager().canRequestPackageInstalls()) installPrompt(); else installFailure();
        }
    }
    private void beginGame() { dismiss(); if (!opened && !destroyed) { opened = true; openGame.run(); } }
    private void dismiss() { if (dialog != null) { dialog.dismiss(); dialog = null; } }
    private void ui(AtomicBoolean token, Runnable action) {
        activity.runOnUiThread(() -> { if (!destroyed && !activity.isFinishing() && !token.get()) action.run(); });
    }
    void destroy() { destroyed = true; operation.set(true); dismiss(); worker.shutdownNow(); }
}
