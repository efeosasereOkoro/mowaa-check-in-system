# QR scan test (E11-S5)

Replaces the old NFC hardware test. Unlike NFC, this needs **no special hardware** — any device
with a camera works, so it can be checked well before the event on the actual reception device(s).

## What's already proven (in the build)
- Each child has an opaque QR token; the printed card encodes it as a QR.
- **Encode → decode round-trip verified in code:** every card's QR decodes (with the same jsQR the
  scanner uses) back to the exact token, which `lookup()` resolves to the right child.
- Live: entering a token in search opens the correct child; the **Scan QR** button appears and
  degrades gracefully when no camera / permission is available.

So this on-site test is only confirming the **physical camera capture** on the real device(s).

## Setup
- [ ] Print (or display on a second screen) a child's ID card from **Children → Print QR ID cards**.
- [ ] Open the app on the reception device over **HTTPS**, signed in as a receptionist or admin.
- [ ] Confirm the Dashboard shows a **Scan QR** button (if it says "QR scan needs a camera", that
      device has no usable camera — use search there).

## The test
- [ ] Tap **Scan QR** → allow camera access when prompted → the camera overlay opens.
- [ ] Point at the child's QR → the **correct child's card opens** automatically. ✅ core success criterion
- [ ] Tap **Check in** → status flips to **Checked in** with the time.
- [ ] Scan again → **Check out** → choose collector → status **Checked out**.
- [ ] Repeat with a **second child's card** to rule out a one-off.

## Failure handling to confirm
- [ ] Scanning a QR that isn't one of ours (any random QR) shows a **"No child found"** note (no crash).
- [ ] **Deny** camera permission once → clear message ("Camera permission was blocked… or use search")
      and the **Search** box still completes a full check-in / check-out.
- [ ] Poor light / blurry: the scanner keeps trying; **Cancel** closes the camera cleanly.

## Record the result
- [ ] Note each device model + browser and pass/fail on the epic issue (#63).
- [ ] If a venue device has no camera or unreliable capture, **search by name / tag number is the
      supported fallback** — flag it so the desk plans around it.
