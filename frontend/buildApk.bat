ionic cordova build android --prod --release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../../my-release-key.jks platforms/android/build/outputs/apk/release/android-release-unsigned.apk sebastien
D:\Profiles\schassande\AppData\Local\Android\Sdk\build-tools\28.0.1\zipalign -v 4 platforms\android\build\outputs\apk\release\android-release-unsigned.apk RefCoach.apk
D:\Profiles\schassande\AppData\Local\Android\Sdk\build-tools\28.0.1\apksigner verify RefCoach.apk
