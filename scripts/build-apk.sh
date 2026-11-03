#!/bin/bash
set -e

echo "=== Building Avelux Grand Android APK ==="

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
BUILD_DIR="/tmp/avelux_apk_build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/com/avelux/grand"
mkdir -p "$BUILD_DIR/res/layout"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$BUILD_DIR/obj"
mkdir -p "$BUILD_DIR/bin"

# 1. Copy icons
cp public/pwa-192x192.png "$BUILD_DIR/res/mipmap-hdpi/ic_launcher.png"
cp public/pwa-192x192.png "$BUILD_DIR/res/mipmap-xhdpi/ic_launcher.png"
cp public/pwa-512x512.png "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"

# 2. Create strings.xml & styles.xml
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

# 3. Create AndroidManifest.xml
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
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:screenOrientation="unspecified">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 4. Create MainActivity.java with modern WebView configuration
APP_URL="${APP_URL:-https://ais-dev-wrjukk3553zsmjcwtxwacg-996588444002.asia-east1.run.app}"

cat << EOF > "$BUILD_DIR/src/com/avelux/grand/MainActivity.java"
package com.avelux.grand;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;

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
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient());

        webView.loadUrl("${APP_URL}");
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

# 5. Compile R.java using aapt
echo "-> Compiling resources with aapt..."
aapt package -m -J "$BUILD_DIR/src" \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -I "$ANDROID_JAR"

# 6. Compile Java sources with javac (source/target 8 for max Dalvik compatibility)
echo "-> Compiling Java sources with javac..."
javac -source 8 -target 8 -cp "$ANDROID_JAR" \
    -d "$BUILD_DIR/obj" \
    "$BUILD_DIR/src/com/avelux/grand/R.java" \
    "$BUILD_DIR/src/com/avelux/grand/MainActivity.java"

# 7. Convert class files to Dalvik classes.dex
echo "-> Converting to Dalvik classes.dex..."
/usr/bin/dalvik-exchange --dex --output="$BUILD_DIR/bin/classes.dex" "$BUILD_DIR/obj"

# 8. Package initial unsigned APK with aapt
echo "-> Packaging APK with aapt..."
aapt package -f \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -A "$BUILD_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR/bin/unaligned.apk"

# Add classes.dex into the APK
cd "$BUILD_DIR/bin"
zip -uj unaligned.apk classes.dex
cd -

# 9. Align APK with zipalign (4 bytes)
echo "-> Zipaligning APK..."
zipalign -f -p 4 "$BUILD_DIR/bin/unaligned.apk" "$BUILD_DIR/bin/aligned.apk"

# 10. Generate keystore if not exists and sign APK with apksigner
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
    --out "public/avelux-grand.apk" \
    "$BUILD_DIR/bin/aligned.apk"

# Also copy to root for quick access
cp "public/avelux-grand.apk" "avelux-grand.apk"

echo "=== Success! APK generated at: public/avelux-grand.apk and /avelux-grand.apk ==="
ls -lh public/avelux-grand.apk
