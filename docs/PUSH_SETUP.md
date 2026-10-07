# Phone notification setup

The in-app reminder inbox works without these keys. Phone push still needs Railway configuration and an actual delivery check.

In the Railway backend service's Variables tab, add the following variables yourself. Keep private keys out of chat and Git.

1. Add `VAPID_PRIVATE_KEY`. Run this PowerShell command to copy the existing locally generated key, then paste into Railway's Value field and click Add:

```powershell
(Get-Content 'D:\stryk\backend\.env.push-keys\private_key.pem' | Where-Object { $_ -notmatch '^-----' }) -join '' | Set-Clipboard
```

2. Add `VAPID_PUBLIC_KEY`. Run this command, paste into Value, and click Add:

```powershell
& 'D:\stryk\backend\.venv\Scripts\vapid.exe' --private-key 'D:\stryk\backend\.env.push-keys\private_key.pem' --applicationServerKey | Where-Object { $_ -match '^Application Server Key = ' } | ForEach-Object { $_ -replace '^Application Server Key = ', '' } | Set-Clipboard
```

3. Deploy Railway's staged changes and wait for the backend to become active.
4. Open STRYK Notifications, turn Match reminders on, and choose Enable phone notifications. Approve notification permission yourself. On iPhone, use the installed Home Screen app.
5. Tell me when setup is complete so actual reminder delivery can be verified before the next feature.

Do not regenerate the keys once devices subscribe: changing them requires those devices to subscribe again.
