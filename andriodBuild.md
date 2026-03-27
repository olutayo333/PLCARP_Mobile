Guide: Building an Android APK with EAS
To build a standalone APK for testing or sharing, we will use EAS (Expo Application Services). This is the modern, professional way to handle builds in Expo.

Step 1: Install EAS CLI
Open your terminal (Command Prompt or PowerShell) and run:

bash
npm install -g eas-cli
Step 2: Login to Expo
Log in with your Expo account credentials:

bash
eas login
(If you don't have an account, create one at expo.dev)

Step 3: Configure your project
Initialize the EAS configuration in your project:

bash

Select "android" when prompted.

Step 4: Configure eas.json for APK
By default, EAS builds .aab (Android App Bundle) which is only for the Play Store. To get an .apk that you can install on your phone, you need to add a "preview" profile.

Open the newly created eas.json and ensure it has this profile:

json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
Step 5: Run the Build
Start the build process on the cloud:

bash
eas build -p android --profile preview
Step 6: Download & Install
Once the build finishes, you will get a URL in your terminal.
Open that URL on your phone's browser.
Download the APK and install it (you may need to allow "Unknown Sources" in your phone's settings).
Created by Antigravity on March 22, 2026


Comment
Ctrl+Alt+M