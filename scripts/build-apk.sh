#!/bin/bash
set -e

echo "=== Building 100% Offline Standalone Android APK for Avelux Grand ==="

# 1. Build fresh production web assets
echo "-> Building web bundle with npm run build..."
npm run build

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
BUILD_DIR="/tmp/avelux_apk_build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/com/avelux/grand"
mkdir -p "$BUILD_DIR/res/layout"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/res/mipmap-mdpi"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxxhdpi"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$BUILD_DIR/obj"
mkdir -p "$BUILD_DIR/bin"

# 2. Copy production assets into the APK (excluding any apk files)
echo "-> Copying built web assets to APK assets/..."
cp -r dist/* "$BUILD_DIR/assets/"
rm -f "$BUILD_DIR/assets/"*.apk* || true

# 3. Provide all standard density icons
cp public/pwa-192x192.png "$BUILD_DIR/res/mipmap-mdpi/ic_launcher.png"
cp public/pwa-192x192.png "$BUILD_DIR/res/mipmap-hdpi/ic_launcher.png"
cp public/pwa-192x192.png "$BUILD_DIR/res/mipmap-xhdpi/ic_launcher.png"
cp public/pwa-512x512.png "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"
cp public/pwa-512x512.png "$BUILD_DIR/res/mipmap-xxxhdpi/ic_launcher.png"

# 4. Values: strings & styles
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Avelux Grand</string>
</resources>
EOF

cat << 'EOF' > "$BUILD_DIR/res/values/styles.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar.Fullscreen">
        <item name="android:windowBackground">@android:color/black</item>
    </style>
</resources>
EOF

# 5. Manifest (android:exported="true" for Android 12+, cleartext allowed, standalone)
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.avelux.grand"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:allowBackup="true"
        android:supportsRtl="true">

        <activity
            android:name="com.avelux.grand.MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:configChanges="orientation|keyboardHidden|screenSize|screenLayout|smallestScreenSize"
            android:screenOrientation="unspecified">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 6. MainActivity.java: Self-contained, loads directly from local APK assets (NO GOOGLE SIGN IN)
cat << 'EOF' > "$BUILD_DIR/src/com/avelux/grand/MainActivity.java"
package com.avelux.grand;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return handleIntercept(url);
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return handleIntercept(request.getUrl().toString());
            }

            private WebResourceResponse handleIntercept(String url) {
                if (url.startsWith("http://localhost/") || url.startsWith("https://localhost/")) {
                    String clean = url.replace("https://localhost/", "").replace("http://localhost/", "");
                    if (clean.isEmpty() || clean.equals("/")) clean = "index.html";
                    if (clean.contains("?")) clean = clean.substring(0, clean.indexOf("?"));
                    if (clean.contains("#")) clean = clean.substring(0, clean.indexOf("#"));

                    try {
                        InputStream is = getAssets().open(clean);
                        String mime = "application/octet-stream";
                        if (clean.endsWith(".html")) mime = "text/html";
                        else if (clean.endsWith(".js")) mime = "text/javascript";
                        else if (clean.endsWith(".css")) mime = "text/css";
                        else if (clean.endsWith(".wasm")) mime = "application/wasm";
                        else if (clean.endsWith(".png")) mime = "image/png";
                        else if (clean.endsWith(".svg")) mime = "image/svg+xml";
                        else if (clean.endsWith(".json")) mime = "application/json";

                        Map<String, String> headers = new HashMap<>();
                        headers.put("Access-Control-Allow-Origin", "*");
                        return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, is);
                    } catch (Exception e) {
                        try {
                            InputStream is = getAssets().open("index.html");
                            return new WebResourceResponse("text/html", "UTF-8", is);
                        } catch (Exception ignored) {}
                    }
                }
                // External requests (like Chess.com API) pass straight through to network
                return null;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("http://localhost/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

# 7. Compile resources with aapt
echo "-> Compiling resources with aapt..."
aapt package -m -J "$BUILD_DIR/src" \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -I "$ANDROID_JAR"

# 8. Compile Java sources with javac
echo "-> Compiling Java sources..."
javac -source 8 -target 8 -cp "$ANDROID_JAR" \
    -d "$BUILD_DIR/obj" \
    "$BUILD_DIR/src/com/avelux/grand/R.java" \
    "$BUILD_DIR/src/com/avelux/grand/MainActivity.java"

# 9. Convert to Dalvik dex
echo "-> Converting class files to Dalvik classes.dex..."
/usr/bin/dalvik-exchange --dex --output="$BUILD_DIR/bin/classes.dex" "$BUILD_DIR/obj"

# 10. Create base APK package with aapt including all bundled assets
echo "-> Packaging APK with all web assets..."
aapt package -f \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -A "$BUILD_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR/bin/unaligned.apk"

# Add classes.dex
cd "$BUILD_DIR/bin"
if command -v zip >/dev/null 2>&1; then
    zip -uj unaligned.apk classes.dex
else
    python3 -c "import zipfile; z = zipfile.ZipFile('unaligned.apk', 'a'); z.write('classes.dex', 'classes.dex'); z.close()"
fi
cd -

# 11. 4-byte Zipalign
echo "-> Aligning APK..."
zipalign -f -p 4 "$BUILD_DIR/bin/unaligned.apk" "$BUILD_DIR/bin/aligned.apk"

# 12. Sign APK with RSA 2048 key (v1, v2, v3)
echo "-> Signing APK..."
KEYSTORE="/tmp/avelux.keystore"
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkeypair -v -keystore "$KEYSTORE" -alias avelux \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass avelux123 -keypass avelux123 \
        -dname "CN=Avelux Grand, OU=Chess, O=Avelux, L=Global, ST=Earth, C=US"
fi

apksigner sign --ks "$KEYSTORE" \
    --ks-key-alias avelux \
    --ks-pass pass:avelux123 \
    --key-pass pass:avelux123 \
    --min-sdk-version 21 \
    --out "public/avelux-grand.apk" \
    "$BUILD_DIR/bin/aligned.apk"

cp "public/avelux-grand.apk" "avelux-grand.apk"

echo "=== Verification ==="
apksigner verify -v public/avelux-grand.apk
aapt dump badging public/avelux-grand.apk | head -n 12
echo "=== 100% Offline Self-Contained APK Built: /public/avelux-grand.apk ==="
ls -lh public/avelux-grand.apk
