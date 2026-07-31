# NFC pre-event preflight checklist (E10-S3)

**PRD-critical.** Web NFC can only be exercised with the client's **physical Samsung SmartTag2**
and the **actual reception Android device** — it can't be verified from a dev machine. Run this
checklist on-site before the event. The software side (UID → child lookup) is already verified;
this confirms the hardware read works end to end.

## How it works (so the test makes sense)

- The reception device runs **Chrome on Android** (the only browser exposing Web NFC / `NDEFReader`).
- Tapping a tag reads its **serial number (UID)**.
- That UID is looked up against the tag registered to a child (`nfc_uid`), exactly like typing the
  tag code by hand — so a tag only resolves if its UID was **saved to that child first**.

## Device setup

- [ ] Reception device is an **Android phone/tablet** with **Chrome** (latest).
- [ ] **NFC is turned on** (Settings → Connections → NFC).
- [ ] The app is opened over **HTTPS** (the live URL) — Web NFC requires a secure context.
- [ ] Signed in as a **receptionist** (or admin); the Dashboard shows a **Tap tag** button
      (not the "Chrome for Android only" hint). If you see the hint, NFC/browser isn't supported —
      use manual search as fallback.

## Register one real tag (do this once per tag, admin)

- [ ] Open the child → **Tag** section.
- [ ] Enter the tag **code** (e.g. `TAG-001`).
- [ ] Capture the **NFC UID**: on the Android device, tap the SmartTag2 to read its serial number,
      and put that value in **NFC UID**. Save.
- [ ] Confirm the tag section now shows the code **and** the UID.

## The end-to-end read test

- [ ] On the Dashboard, tap **Tap tag** → button shows **"Tap a tag…"**.
- [ ] Hold the **SmartTag2** to the back of the device.
- [ ] The **correct child's card opens** (the one the tag was registered to). ✅ core success criterion
- [ ] Tap **Check in** → status flips to **Checked in** with the time.
- [ ] Tap the tag again → **Check out** → choose collector → status **Checked out**.
- [ ] Repeat with a **second tag / second child** to rule out a one-off.

## Failure handling to verify

- [ ] Tapping an **unregistered** tag shows a "not found" result (does **not** crash).
- [ ] A misread shows **"Could not read the tag. Try again."** and lets you retry.
- [ ] **Fallback works:** with NFC off, the receptionist can still **search by name or tag code**
      and complete a full check-in / check-out. (This is the guaranteed path if any device lacks NFC.)

## Record the result

- [ ] Note device model, Android + Chrome version, and pass/fail per tag on the epic issue (#10).
- [ ] If NFC is unreliable on the venue devices, the **manual search path is the supported fallback** —
      flag it so the desk plans around it.
