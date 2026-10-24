package com.iiiplay.littleguardian;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

public final class MainActivity extends Activity {
    private static final String ORIGIN = "appassets.androidplatform.net";
    private static final String ENTRY = "https://" + ORIGIN + "/assets/index.html";
    private WebView webView;
    private boolean foreground;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(29, 33, 48));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(29, 33, 48));
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        root.requestApplyInsets();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && ORIGIN.equals(uri.getHost())) return false;
                if (request.hasGesture() && ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException ignored) { Toast.makeText(MainActivity.this, "找不到可開啟連結的瀏覽器", Toast.LENGTH_SHORT).show(); }
                }
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (foreground) invoke("resume"); else invoke("pause");
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl(ENTRY);
    }

    private void invoke(String method) {
        if (webView != null) webView.evaluateJavascript(
            "if(window.LittleGuardianHost){window.LittleGuardianHost." + method + "();}", null);
    }

    @Override protected void onPause() {
        foreground = false;
        if (webView != null) {
            webView.evaluateJavascript("if(window.LittleGuardianHost){window.LittleGuardianHost.pause();}", ignored -> {
                if (!foreground && webView != null) { webView.onPause(); webView.pauseTimers(); }
            });
        }
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        foreground = true;
        if (webView != null) { webView.onResume(); webView.resumeTimers(); invoke("resume"); }
    }

    @Override public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }
        webView.evaluateJavascript("window.LittleGuardianHost ? window.LittleGuardianHost.back() : false", result -> {
            if (!"true".equals(result)) finish();
        });
    }

    @Override protected void onDestroy() {
        foreground = false;
        if (webView != null) { webView.stopLoading(); webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
