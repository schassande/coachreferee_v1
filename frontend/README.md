# RefCoach Mobile Apps

This is the project Referee Coach. It is an Ionic application for coaching refereee in Touch sport.

## 1 - Installation

### With the Ionic CLI

First install IOnic:

```bash
$ npm install -g ionic
$ npm install
```

1) Install android studio
2) Be sure to have at least Java8 on your computer
3) Connect your mobile device to your computer
4) Your mobile device should be in Dev mode

run `d:\Profiles\schassande\AppData\Local\Android\Sdk\platform-tools\adb -a` to know if your device is reconignzed by Windows
adb devices -l

To deploy on you mobile device `$ ionic cordova run android`


## 2 - Development

The `doc` sub directory contains documentation about development.

### 2.1 TODO List

- add comments in + to positive and improve feedback
- add menu entry to go to current coaching
- add link to game definition in page coaching game

## Packaging

### Creation de build ionic
ionic cordova build android --prod --release

### Creation d'une cle (si pas deja fait)
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sebastien

### Signer le jar
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../../my-release-key.jks platforms/android/build/outputs/apk/release/android-release-unsigned.apk sebastien
password: 22n77scb

### aligner
D:\Profiles\schassande\AppData\Local\Android\Sdk\build-tools\28.0.1\zipalign -v 4 platforms\android\build\outputs\apk\release\android-release-unsigned.apk RefCoach.apk

### Verifier
D:\Profiles\schassande\AppData\Local\Android\Sdk\build-tools\28.0.1\apksigner verify RefCoach.apk


