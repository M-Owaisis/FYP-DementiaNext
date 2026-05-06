# DementiaNext — Deployment Tasks

A pure execution checklist. Work top to bottom. Anything in `backticks` is
copy-paste ready.

---

## The worksheet (your only notes file)

Open a scratchpad and keep this filled in as you go. At task **B1** you'll
bulk-paste it into the HF Space.

```
DJANGO_SECRET_KEY        = <PASTE_FROM_TASK_A1>
DJANGO_DEBUG             = false

DATABASE_URL             = <PASTE_FROM_NEON_A3>
R2_ACCESS_KEY_ID         = <PASTE_FROM_TASK_A4>
R2_SECRET_ACCESS_KEY     = <PASTE_FROM_TASK_A4>
R2_ENDPOINT_URL          = <PASTE_FROM_TASK_A4>
R2_BUCKET                = <YOUR_BUCKET_NAME>

HF_TOKEN                 = <PASTE_FROM_TASK_A5>
HF_MODEL_REPO            = <YOUR_USERNAME>/dementianext-models

MODAL_TOKEN_ID           = <PASTE_FROM_TASK_A7>      # without quotes
MODAL_TOKEN_SECRET       = <PASTE_FROM_TASK_A7>      # without quotes

GROQ_API_KEY             = <PASTE_FROM_BACKEND_DOT_ENV>
COMPANION_LLM_MODEL      = llama-3.3-70b-versatile

GOOGLE_CLIENT_ID         = <OPTIONAL_FROM_BACKEND_DOT_ENV>
GOOGLE_CLIENT_SECRET     = <OPTIONAL_FROM_BACKEND_DOT_ENV>

CORS_ALLOWED_ORIGINS     = <YOUR_VERCEL_URL_AFTER_C3>
```

> Keep your real values in a local notes file outside this repo. Never commit
> them — `DEPLOY.md` is in git, anything you paste here gets pushed to GitHub
> and triggers Push Protection.

---

## Part A — Provision (15 min, all in browser except A7)

### A1. Generate Django secret key

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```
Paste output into worksheet → `DJANGO_SECRET_KEY`.

### A2. Sign up everywhere

Open these in tabs, sign up with GitHub on each:
- https://neon.tech
- https://cloudflare.com
- https://huggingface.co
- https://modal.com
- https://vercel.com
- https://uptimerobot.com

### A3. Neon — create database

1. Console → **New Project** → region near you → Create.
2. **Connect** button → copy the `postgresql://...` string.
3. Paste into worksheet → `DATABASE_URL`.

### A4. Object storage — Cloudflare R2 OR Backblaze B2

Both are free, S3-compatible, and use the **same `R2_*` env var names**.
Pick whichever works for you.

#### Option A — Cloudflare R2 (preferred, free egress)

1. Cloudflare dashboard → **R2** in left nav → enable if asked (may need to
   confirm the free tier subscription first, no card needed for the basic
   free tier).
2. **Create bucket** → name: `dementianext-mri` → Create.
3. R2 → **Manage R2 API Tokens** → **Create API Token**.
4. Permissions: **Object Read & Write**, scope to your bucket. TTL: forever.
5. Copy into worksheet:
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT_URL`

#### Option B — Backblaze B2 (use if R2 sign-up fails)

1. Sign up at https://www.backblaze.com → verify email.
2. **B2 Cloud Storage** → **Buckets** → **Create a Bucket**.
   - Name: `dementianext-mri-<your-initials>` (must be globally unique)
   - Files in Bucket: **Private**. Object Lock: Disable.
3. Note the **Endpoint** shown under the bucket — e.g.
   `s3.us-west-002.backblazeb2.com` (region varies).
4. **Application Keys** → **Add a New Application Key**.
   - Name: `dementianext`
   - Allow access to: select the bucket you just created
   - Type of Access: **Read and Write**
   - **Create New Key** — the secret is shown ONCE, copy now.
5. Map to worksheet:
   - `R2_ACCESS_KEY_ID` = the `keyID` value
   - `R2_SECRET_ACCESS_KEY` = the `applicationKey` value
   - `R2_ENDPOINT_URL` = `https://` + the endpoint (e.g. `https://s3.us-west-002.backblazeb2.com`)
   - `R2_BUCKET` = your bucket name from step 2

### A5. Hugging Face Hub — model weights repo

1. Avatar → **+ New Model** → name: `dementianext-models` → Create.
2. **Files and versions** → upload from your local machine:
   - `backend/models/dementia_detector.pth`
   - `backend/models/subtype_classifier.pth`
3. Avatar → **Settings** → **Access Tokens** → **New token** → Read scope → Create.
4. Paste into worksheet → `HF_TOKEN`.
5. Worksheet → `HF_MODEL_REPO` = `<your-username>/dementianext-models`.

### A6. Hugging Face Space — create empty Docker space

1. Avatar → **+ New Space** → name: `dementianext-backend`.
2. SDK: **Docker** → **Blank** template. Hardware: **CPU basic**. Public.
3. Click **Create Space**. Don't push code yet.
4. Note your Space URL — it's `https://<your-username>-dementianext-backend.hf.space`.

### A7. Modal — install CLI, get tokens, set spend cap

```bash
pip install modal
modal token new          # browser opens, click Approve
cat ~/.modal.toml        # reveals token_id and token_secret
```

1. Paste both into worksheet → `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`.
2. https://modal.com/dashboard → **Settings** → **Billing** → set hard limit
   to $0 above the free credit. (Or simply don't add a card — it'll fail
   loudly when credit runs out.)

---

## Part B — Configure HF Space secrets (5 min)

### B1. Paste the worksheet into the HF Space

1. Open your Space (from A6) → **Settings** → **Variables and secrets**.
2. For each row in your worksheet, click **New secret** and paste key + value.
3. Mandatory now (Space won't boot without these):
   - `DJANGO_SECRET_KEY` `DJANGO_DEBUG`
   - `DATABASE_URL`
   - `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` `R2_ENDPOINT_URL` `R2_BUCKET`
   - `HF_TOKEN` `HF_MODEL_REPO`
   - `MODAL_TOKEN_ID` `MODAL_TOKEN_SECRET`
   - `GROQ_API_KEY` `COMPANION_LLM_MODEL`
4. Optional now (only if you want Sign in with Google):
   - `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET`
5. Skip `CORS_ALLOWED_ORIGINS` — added in D1 after Vercel URL exists.

---

## Part C — Deploy (35 min, mostly waiting)

### C1. Deploy Modal preprocessing function (~15 min — FSL install)

```bash
cd backend
modal deploy modal_app.py
```

Wait for `App deployed!`. Verify at https://modal.com/dashboard → Apps →
`dementianext-preprocess` shows **status: deployed**.

### C2. Deploy backend to HF Space (~15 min — first build)

**First create a separate WRITE-scoped HF token** (the `HF_TOKEN` from A5
is read-only — git push will reject it):

1. https://huggingface.co/settings/tokens → **New token**.
2. Name: `git-push-write`. Type: **Write**. Generate.
3. Copy it — you'll paste it in the next command. This token only lives on
   your laptop; it does NOT go into any HF Space secret.

Now push the code. From the **repo root**:

```bash
git clone https://huggingface.co/spaces/<your-username>/dementianext-backend hf-space
cp -r backend/* hf-space/
cd hf-space
git add .
git commit -m "Initial deploy"

# Push using the WRITE token in the URL (one-shot):
git push https://<your-username>:<WRITE_TOKEN>@huggingface.co/spaces/<your-username>/dementianext-backend main
```

If you'd rather save the token so future pushes work without it in the URL:

```bash
pip install huggingface_hub
huggingface-cli login --token <WRITE_TOKEN> --add-to-git-credential
git push
```

Watch the build at `https://huggingface.co/spaces/<your-username>/dementianext-backend` → **Logs**.

When you see `Listening at: http://0.0.0.0:7860`, sanity-check:

```bash
curl https://<your-username>-dementianext-backend.hf.space/api/health
# expect: {"status": "ok"}
```

### C3. Deploy frontend to Vercel (~5 min)

1. Vercel → **Add New Project** → **Import Git Repository** → select your repo.
2. **Root Directory**: `frontend`. Framework auto-detects as Next.js.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://<your-username>-dementianext-backend.hf.space`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = (paste your `GOOGLE_CLIENT_ID` from `backend/.env`, optional)
4. **Deploy**.
5. Note the URL Vercel gives you (e.g. `https://dementianext.vercel.app`).

---

## Part D — Wire up the live URL (5 min)

### D1. Tell the backend about the frontend (CORS)

1. HF Space → **Settings** → **Variables and secrets** → **New secret**:
   - Key: `CORS_ALLOWED_ORIGINS`
   - Value: your Vercel URL (no trailing slash), e.g. `https://dementianext.vercel.app`
2. Space auto-restarts in ~30 s.

### D2. (Optional) Authorize Vercel URL in Google OAuth

Skip if you don't use Sign in with Google.

1. https://console.cloud.google.com → **APIs & Services** → **Credentials**.
2. Click your existing OAuth 2.0 Client ID (matches your `GOOGLE_CLIENT_ID`).
3. **Authorized JavaScript origins** → **+ Add URI** → paste your Vercel URL.
4. **Save**. Wait 1 min for propagation.

### D3. Keep the Space awake (UptimeRobot)

1. UptimeRobot → **Add New Monitor** → Type: **HTTP(S)**.
2. URL: `https://<your-username>-dementianext-backend.hf.space/api/health`.
3. Interval: **5 minutes**. Save.

---

## Part E — Verify (5 min)

1. Open your Vercel URL.
2. Sign up two accounts: one as **doctor**, one as **patient**.
3. Patient → request appointment → doctor approves.
4. Patient → upload a small `.nii.gz` MRI.
5. Doctor → dashboard → **Run AI Detection**.
6. Watch:
   - First call: 30–60 s Modal cold start + 2–4 min preprocessing.
   - Subsequent calls within 5 min: <2 min total.
7. Dashboard auto-refreshes when result lands.

If you see a result classification + confidence percentage, **you're done**.

---

## Appendix — If something breaks

### Where logs live

| Component | Where |
|---|---|
| HF Space (Django + worker) | Space page → **Logs** tab |
| Modal preprocessing | https://modal.com/apps → `dementianext-preprocess` → Logs |
| Vercel build | Vercel project → Deployments → click the deployment |
| Neon connections | Neon dashboard → your project → Monitoring |

### Common failures

| Symptom | Fix |
|---|---|
| HF Space build fails on first push | Logs usually show a missing secret. Recheck **all** Mandatory secrets in B1. |
| `502 Bad Gateway` after deploy | Space hasn't finished booting — wait 60 s and retry the URL. |
| Detection stuck on `processing` forever | Modal call probably failed. Check Modal logs; common cause is missing `MODAL_TOKEN_*` secrets in HF Space. |
| `psycopg2 SSL connection closed` on first call after a quiet period | Neon idle-suspends after 5 min — just retry once. |
| `redirect_uri_mismatch` on Google sign-in | Did D2. Allow 1 min for Google to propagate. |
| `502` after weekend of zero traffic | UptimeRobot ping (D3) prevents this — verify monitor is active. |
| Modal credit running out | Modal dashboard → Usage. Cheapest fix: drop `gpu="T4"` to `gpu=None` in `modal_app.py` — preprocessing slows to ~10 min but stays free. |

### How to update after deploying

| Changed | Re-deploy |
|---|---|
| `backend/pipeline/*` | `cd backend && modal deploy modal_app.py` |
| anything else in `backend/` | `cd hf-space && cp -r ../backend/* . && git commit -am "..." && git push` |
| `frontend/*` | push to GitHub — Vercel auto-deploys |

### Security note

`backend/.env` is gitignored so your local secrets won't leak through git.
After your FYP defense, rotate keys you've shared in chat or screenshots:
- Groq: console.groq.com → API Keys → revoke + regenerate
- Google: console.cloud.google.com → Credentials → Reset client secret
