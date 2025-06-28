# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }

# Google Play Services / Google Sign-In
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Naver Login SDK
-keep class com.nhn.android.naverlogin.** { *; }
-dontwarn com.nhn.android.naverlogin.**
-keep class com.navercorp.nid.** { *; }
-dontwarn com.navercorp.nid.**

# React Native Google Sign-In
-keep class com.reactnativegooglesignin.** { *; }
-dontwarn com.reactnativegooglesignin.**

# React Native Seoul Naver Login
-keep class com.reactnativeseoul.naverlogin.** { *; }
-dontwarn com.reactnativeseoul.naverlogin.**

# OkHttp (네트워크 통신)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# JSON parsing
-keepattributes *Annotation*
-keepclassmembers class ** {
    @com.fasterxml.jackson.annotation.JsonProperty <fields>;
}

# General Android
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
