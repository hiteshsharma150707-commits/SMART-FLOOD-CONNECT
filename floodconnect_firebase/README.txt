# FloodConnect – Firebase-connected prototype

## Files
- `index.html` – dashboard interface
- `style.css` – dashboard styling
- `script.js` – Firebase Authentication + Cloud Firestore connection and demo logic

## 1. Configure Firebase Authentication
1. Open https://console.firebase.google.com/
2. Select your `FloodConnect` project.
3. Open **Authentication** (under Build or use Search for products).
4. Click **Get started** if prompted.
5. Open **Sign-in method**.
6. Select **Anonymous** and enable it. Save.

## 2. Set Firestore security rules
1. Open **Firestore Database**.
2. Open the **Rules** tab.
3. Replace the rules with the following demo-only rules and click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appData/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

IMPORTANT: These rules require a signed-in Firebase session, but anonymous sign-in is available to any visitor. This is ONLY a classroom demonstration with fictional records. It is NOT role-based access control and is NOT suitable for real family, missing-person, rescue or other sensitive information. For a real system, use verified accounts, role-based rules, backend validation, audit logs and a security review.

## 3. Run the website
1. Extract this ZIP.
2. Open the `floodconnect_firebase` folder in VS Code.
3. Install/enable the VS Code **Live Server** extension if you do not already have it.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Wait for the left sidebar status to say **Firebase connected · Demo data sync on**.

Use Live Server or another local web server. Do not open the file directly with `file://`.

## 4. Test sync
1. Open the site in one browser window.
2. Open the same Live Server URL in another browser/device.
3. Add a fictional family or camp in one window.
4. Check that the other window updates.

Both sessions use the same shared demonstration data. Do not enter real personal or emergency information.

## Data design and limitations
- Demo records are stored together in the Firestore document `appData/main`.
- The app uses Firebase anonymous authentication, not separate Admin/Family/Rescue accounts.
- All authenticated demo sessions can read and write the same document.
- Matching remains the original simple name/age rule; it is not a trained AI model.
- Firebase sync requires internet access. This version does not implement offline queueing, GPS, SMS, or emergency dispatch.
- The dashboard keeps a browser LocalStorage fallback if Firebase is not configured correctly.
