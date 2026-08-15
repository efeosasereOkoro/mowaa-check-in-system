# Manual test plan — Child Check-In / Check-Out

A run-it-yourself checklist covering every flow and role. Tick each box; note anything that
doesn't match the **Expected** result.

## Before you start
- **Logins you need:** an **Admin**, a **Receptionist**, and a **Health Officer** account. (Use the
  accounts set up in the app — provision them under **Users** if needed. Passwords aren't listed here
  on purpose.)
- ⚠️ **This system holds real data.** Don't delete children or suspend users you don't own during
  testing — use a dedicated **test child** and **test user** for the destructive steps (A6, F3), and
  remove them afterwards.
- **Current day:** check-in / check-out only works on the **current** event day (06:00–22:00 GMT+1).
  On a past/future day you'll see a notice and no check-in buttons (that's correct).
- **Switching roles on one browser:** click **Sign out** fully between roles — the desk is single-session,
  so the next person must sign in as themselves.
- **Test on two sizes:** once on a **laptop** and once on a **phone** (or narrow the browser < 672px) to
  check the bottom tab bar and the collapsible tables.

Legend: **[ ]** = to test · Expected = what should happen · 🚩 = security-sensitive.

---

## A. Admin — registration & setup
- [ ] **A1 Register a child.** Children → fill Add child (name, age, guardian, phone, address, health) → Add.
  **Expected:** child appears in the list; success message.
- [ ] **A2 Tag number (auto-assigned).** After registering, open the child → Tag number.
  **Expected:** a tag number was assigned **automatically** at registration; it's searchable and prints
  on the card. Reassigning issues a new number and deactivates the old one.
- [ ] **A3 Print QR ID cards.** Children → **Print QR ID cards →** (opens `/cards`).
  **Expected:** one card per child with event name + name + **QR** + tag number; **Print cards** works.
- [ ] **A4 Add pickup person.** Open the child → Authorized pickup persons → add name + relationship → Add.
  **Expected:** person listed; available at check-out.
- [ ] **A5 Edit a child.** Open a child → change a field → Save changes. **Expected:** change persists.
- [ ] **A6 Delete confirmation.** Open a child → Delete child. **Expected:** a confirmation prompt appears
  before anything is deleted.

## B. Receptionist — the desk
- [ ] **B1 Find by search.** Dashboard → Find a child → type a name or tag number → Search.
  **Expected:** the child's card opens.
- [ ] **B2 Find by QR scan** *(phone).* Tap **Scan QR** → allow camera → point at a printed/on-screen card.
  **Expected:** the correct child opens. (No camera → clear message + search still works.)
- [ ] **B3 Check in.** On the child's card → **Check in**. **Expected:** status → **Checked in** with the time;
  dashboard **On-site** count goes up.
- [ ] **B4 Check out.** Find the checked-in child → **Check out** → **choose the collector** → confirm.
  **Expected:** status → **Checked out** with time + collector name recorded.
- [ ] **B5 Multiple visits per day.** Check the same child **in** again after checking out.
  **Expected:** allowed and logged with a new time — children may check in/out **more than once a day**.
  (There is no once-per-day limit and no admin override.)
- [ ] 🚩 **B7 Field visibility.** On any child card as receptionist. **Expected:** you see name, tag, age,
  guardian, phone — but **no home address and no health/medical info** anywhere.
- [ ] **B8 Dashboard.** Check the counters (Registered / On-site / Checked out / Not arrived), the roster
  filter chips + search, and the day picker (‹ ›, "All days", "Go to today"). **Expected:** all consistent.

## C. Admin — override *(retired)*
The once-per-day limit and admin override were removed — children may now check in/out multiple times a
day (decision **D-035**). Nothing to test here; re-entry is covered by **B5**. Historical rows that were
flagged as overrides still render in reports.

## D. Health Officer
- [ ] **D1 Health dashboard.** Health → search a child. **Expected:** list with status, health flags, last note.
- [ ] **D2 Add medical note.** Open a child → add a note: pick severity (Routine / Incident / Emergency),
  text, "guardian notified" → save. **Expected:** note saved with time + author.
- [ ] **D3 Emergency flag.** Add an **Emergency** note. **Expected:** a red indicator shows on that child today;
  it counts in the report's "Emergency notes today".
- [ ] 🚩 **D4 Health field visibility.** As Health Officer. **Expected:** you **see health details** but **not the
  home address**; you cannot check children in/out.
- [ ] 🚩 **D5 Health RBAC.** Try to open `/children`, `/reports`, `/users`, `/dashboard`.
  **Expected:** you're redirected to the Health area — no access to those.

## E. Reports & export (Admin)
- [ ] **E1 Per-day report.** Reports → pick a day. **Expected:** every check-in/out with time, child,
  action (**In** / **Out** status tag), staff, collector.
- [ ] **E2 All days.** Switch the selector to **All days**. **Expected:** a Day column appears; all days listed.
- [ ] **E3 End-of-day flags.** For a day. **Expected:** "Still checked in (N)" list + "Emergency notes today" count.
- [ ] **E4 Export attendance CSV.** Click **Export attendance (CSV)**. **Expected:** a `.csv` downloads and opens
  cleanly in Excel (accented names look right); rows match the table.
- [ ] **E5 Export register CSV.** Click **Export register (CSV)**. **Expected:** full children list with address,
  health, tag, pickup persons.

## F. User management (Admin)
- [ ] **F1 Add a user.** Users → Add user (name, email, role, temporary password / Suggest) → Add.
  **Expected:** success; user appears as **Active** (or Invited); your own session stays signed in.
- [ ] **F2 New user logs in.** Sign out → sign in as the new user with that temp password.
  **Expected:** they reach their role's home.
- [ ] 🚩 **F3 Suspend.** As Admin, Users → **Suspend** a user (confirm). Then sign in as that user.
  **Expected:** they get an **"Account suspended"** page — no access to any section.
- [ ] **F4 Reactivate.** Users → **Reactivate** the same user. **Expected:** access restored.
- [ ] 🚩 **F5 Guards.** Try to suspend **yourself**. **Expected:** blocked ("cannot suspend your own account").

## G. Access control (negative) 🚩
- [ ] **G1 Receptionist blocked from admin areas.** As receptionist, open `/children`, `/reports`, `/users`.
  **Expected:** redirected to the dashboard — no access.
- [ ] **G2 Signed-out.** Open any page while signed out. **Expected:** redirected to Sign in.
- [ ] **G3 Wrong password.** Try to sign in with a bad password. **Expected:** clear "invalid email or password".

## H. Responsive / mobile
- [ ] **H1 Bottom nav.** On a phone (or width 320px), check the **bottom tab bar** — every tab reachable, **no
  sideways scrolling**.
- [ ] **H2 Collapsible tables.** On mobile, Roster / Users / Health / Children / Reports tables show **two
  columns + a chevron**; tapping a row **expands** to reveal the rest (and any action/link). No horizontal scroll.

---

### If something fails
Note the **role, page, steps, what you expected vs. saw**, and a screenshot. Security-sensitive items (🚩 —
field visibility, RBAC, suspended access) are the highest priority — flag those first.
