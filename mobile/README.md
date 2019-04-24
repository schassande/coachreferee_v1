# RefCoach Mobile Apps

This is the project Referee Coach. It is an Ionic application for coaching refereee in Touch sport.

## 1 - Installation

To develop, you need the following software :

- ionic
- Java 8+
- Android studio

### Install IOnic:

```bash
$ npm install -g ionic
$ npm install
```

## 2 - Development

The `doc` sub directory contains documentation about development.


## 3 run the application on your computer

run `ionic serve`
It should open your browser on url: http://localhost:8100
Swtich to mobile (F12 on chrome). Use the console to see what happen in case of error

## 4 Deploy on it's on device connected in USB

1) Install android studio (Once time) and put <USER_HOME>\AppData\Local\Android\Sdk\platform-tools\ in your PATH
2) Be sure to have at least Java8 on your computer
3) Connect your mobile device to your computer
4) Switch your mobile device in Dev mode, and in USB debug
5) run `adb devices -l` to know if your device is reconignzed by Windows. adb is a command provided by Android studio/sdk  (<USER_HOME>\AppData\Local\Android\Sdk\platform-tools\adb)
6) To deploy on you mobile device run `ionic cordova run android`

## 5 Packaging the application as android package .apk

1) Update the version number in config.xml to match to the version from VersionService.ts source file.
2) build the apk by running `ionic cordova build android --prod --release`
3) The first time you have to build a key to sign the package
`keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sebastien`
4) Sign the .apk file 
`jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../../my-release-key.jks platforms/android/build/outputs/apk/release/android-release-unsigned.apk sebastien`
The password is : 22n77scb
5) Remove the old package 
`rm RefCoach.apk`
6) Align the package
`D:\Profiles\schassande\AppData\Local\Android\Sdk\build-tools\28.0.1\zipalign -v 4 platforms\android\build\outputs\apk\release\android-release-unsigned.apk RefCoach.apk`
1) Verify the package
`D:\Profiles\schassande\AppData\Local\Android\Sdk\build-tools\28.0.1\apksigner verify RefCoach.apk`

## 6 Publish the application on Android store

1) Go on Android console: https://play.google.com/apps/publish/?account=8445017305226421264#AppListPlace
2) Select the RefCoach application
3) From the left Menu, selection `Gestion de publication` then => `Versions de l'application`
4) Inside the page, in the block `Version de production` => click on `gerer`
5) Click on `Creer une version`
6) Update the new apk file 
7) Upudate the comments of the version
8) Click on `Enregistrer` button
9) Click on `Verifier` button
10) Click on `LANCER LE DÉPLOIEMENT EN VERSION PRODUCTION` button

Now the Android will publish your version. It takes time to be visible by all users, approximatively 12 hours.