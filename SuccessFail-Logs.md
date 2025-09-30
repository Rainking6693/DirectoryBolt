{

&nbsp; "function": "stage6CompareLogs",

&nbsp; "arguments": {

&nbsp;   "tasks": \[

&nbsp;     {

&nbsp;       "name": "Successful Netlify build log",

&nbsp;       "path": "logs/success.log",

&nbsp;       "contents": \[

&nbsp;         "2:43:23 PM: Build ready to start

2:43:24 PM: build-image version: e8c4c0b200e9701a8a8825b9ff63ea7e9f1740e2 (noble)

2:43:24 PM: buildbot version: a8227f684d13e2f14c4dff2ff89b1b5fbedbc9d9

2:43:24 PM: Fetching cached dependencies

2:43:24 PM: Starting to download cache of 641.1MB (Last modified: 2025-09-26 20:19:31 +0000 UTC)

2:43:25 PM: Finished downloading cache in 1.142s

2:43:25 PM: Starting to extract cache

2:43:35 PM: Finished extracting cache in 10.255s

2:43:35 PM: Finished fetching cache in 11.482s

2:43:35 PM: Starting to prepare the repo for build

2:43:35 PM: Preparing Git Reference refs/heads/main

2:43:36 PM: Custom edge functions path detected. Proceeding with the specified path: 'netlify/edge-functions'

2:43:37 PM: Starting to install dependencies

2:43:37 PM: Started restoring cached python cache

2:43:37 PM: Finished restoring cached python cache

2:43:37 PM: Started restoring cached ruby cache

2:43:38 PM: Finished restoring cached ruby cache

2:43:38 PM: Started restoring cached go cache

2:43:38 PM: Finished restoring cached go cache

2:43:38 PM: Started restoring cached Node.js version

2:43:39 PM: Finished restoring cached Node.js version

2:43:39 PM: Attempting Node.js version '20.18.1' from .nvmrc

2:43:39 PM: v20.18.1 is already installed.

2:43:39 PM: Now using node v20.18.1 (npm v10.8.2)

2:43:39 PM: Enabling Node.js Corepack

2:43:40 PM: Started restoring cached build plugins

2:43:40 PM: Finished restoring cached build plugins

2:43:40 PM: WARNING: The environment variable 'NODE\_ENV' is set to 'production'. Any 'devDependencies' in package.json will not be installed

2:43:40 PM: Started restoring cached corepack dependencies

2:43:40 PM: Finished restoring cached corepack dependencies

2:43:40 PM: No npm workspaces detected

2:43:40 PM: Started restoring cached node modules

2:43:40 PM: Finished restoring cached node modules

2:43:40 PM: Installing npm packages using npm version 10.8.2

2:43:41 PM: up to date in 2s

2:43:42 PM: npm packages installed

2:43:42 PM: Successfully installed dependencies

2:43:42 PM: Starting build script

2:43:42 PM: Detected 1 framework(s)

2:43:42 PM: "next" at version "14.2.32"

2:43:42 PM: Section completed: initializing

2:43:44 PM: 

2:43:44 PM: Netlify Build                                                 

2:43:44 PM: ────────────────────────────────────────────────────────────────

2:43:44 PM: 

2:43:44 PM: ❯ Version

2:43:44 PM:   @netlify/build 35.1.8

2:43:44 PM: 

2:43:44 PM: ❯ Flags

2:43:44 PM:   accountId: 685d5c82966d03cf5d38aef7

2:43:44 PM:   apiHost: api.netlify.com

2:43:44 PM:   baseRelDir: true

2:43:44 PM:   branch: main

2:43:44 PM:   buildId: 68d6faea3f429700089c1943

2:43:44 PM:   buildbotServerSocket: /tmp/netlify-buildbot-socket

2:43:44 PM:   cacheDir: /opt/build/cache

2:43:44 PM:   cachedConfigPath: /tmp/netlify\_config.json

2:43:44 PM:   context: production

2:43:44 PM:   cwd: /opt/build/repo

2:43:44 PM:   deployId: 68d6faea3f429700089c1945

2:43:44 PM:   edgeFunctionsDistDir: /tmp/edge-68d6faea3f429700089c1945

2:43:44 PM:   enhancedSecretScan: true

2:43:44 PM:   featureFlags:

2:43:44 PM:     - netlify\_build\_updated\_plugin\_compatibility

2:43:44 PM:   framework: next

2:43:44 PM:   functionsDistDir: /tmp/zisi-68d6faea3f429700089c1945

2:43:44 PM:   mode: buildbot

2:43:44 PM:   nodePath: /opt/buildhome/.nvm/versions/node/v20.18.1/bin/node

2:43:44 PM:   repositoryRoot: /opt/build/repo

2:43:44 PM:   saveConfig: true

2:43:44 PM:   sendStatus: true

2:43:44 PM:   siteId: d6821c31-a428-4b54-95e3-d92176e487e6

2:43:44 PM:   statsd:

2:43:44 PM:     host: 10.71.8.224

2:43:44 PM:     port: 8125

2:43:44 PM:   systemLogFile: 3

2:43:44 PM:   testOpts:

2:43:44 PM:     silentLingeringProcesses: ""

2:43:44 PM:   tracing:

2:43:44 PM:     baggageFilePath: /tmp/baggage.dump

2:43:44 PM:     enabled: "true"

2:43:44 PM:     host: 10.71.8.224

2:43:44 PM:     parentSpanId: 8ec23cff280017e9

2:43:44 PM:     preloadingEnabled: "true"

2:43:44 PM:     sampleRate: 4

2:43:44 PM:     traceFlags: "00"

2:43:44 PM:     traceId: 0ae103ccaebca342a168813b14f8d4fa

2:43:44 PM: 

2:43:44 PM: ❯ UI build settings

2:43:44 PM: baseRelDir: true

2:43:44 PM: build:

2:43:44 PM:   command: node -e "require('fs').copyFileSync('.env.netlify', '.env')" \&\& npm ci

2:43:44 PM:     --include=dev \&\& npm run optimize:pre-build \&\& npm run build

2:43:44 PM:   environment:

2:43:44 PM:     - ADMIN\_API\_KEY

2:43:44 PM:     - ALLOWED\_ORIGINS

2:43:44 PM:     - AUTOBOLT\_API\_KEY

2:43:44 PM:     - AUTOBOLT\_DEFAULT\_PERMISSIONS

2:43:44 PM:     - AUTOBOLT\_WEBHOOK\_URL

2:43:44 PM:     - BASE\_URL

2:43:44 PM:     - JWT\_ACCESS\_SECRET

2:43:44 PM:     - JWT\_REFRESH\_SECRET

2:43:44 PM:     - JWT\_SECRET

2:43:44 PM:     - NEXTAUTH\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_API\_BASE\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_APP\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_BASE\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

2:43:44 PM:     - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

2:43:44 PM:     - NEXT\_PUBLIC\_GTM\_ID

2:43:44 PM:     - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

2:43:44 PM:     - NEXT\_PUBLIC\_SUPABASE\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

2:43:44 PM:     - NODE\_ENV

2:43:44 PM:     - NODE\_VERSION

2:43:44 PM:     - OPENAI\_API\_KEY

2:43:44 PM:     - PUPPETEER\_EXECUTABLE\_PATH

2:43:44 PM:     - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

2:43:44 PM:     - SITE\_URL

2:43:44 PM:     - STAFF\_API\_KEY

2:43:44 PM:     - STRIPE\_CSV\_EXPORT\_PRICE\_ID

2:43:44 PM:     - STRIPE\_ENTERPRISE\_PRICE\_ID

2:43:44 PM:     - STRIPE\_GROWTH\_PRICE\_ID

2:43:44 PM:     - STRIPE\_PROFESSIONAL\_PRICE\_ID

2:43:44 PM:     - STRIPE\_PUBLISHABLE\_KEY

2:43:44 PM:     - STRIPE\_SECRET\_KEY

2:43:44 PM:     - STRIPE\_STARTER\_PRICE\_ID

2:43:44 PM:     - STRIPE\_WEBHOOK\_SECRET

2:43:44 PM:     - SUPABASE\_ANON\_KEY

2:43:44 PM:     - SUPABASE\_DATABASE\_URL

2:43:44 PM:     - SUPABASE\_JWT\_SECRET

2:43:44 PM:     - SUPABASE\_SERVICE\_ROLE\_KEY

2:43:44 PM:     - SUPABASE\_URL

2:43:44 PM:     - USER\_AGENT

2:43:44 PM:     - VAPID\_PRIVATE\_KEY

2:43:44 PM:     - WORKER\_AUTH\_TOKEN

2:43:44 PM:   publish: .next

2:43:44 PM: plugins:

2:43:44 PM:   - inputs: {}

2:43:44 PM:     package: "@netlify/plugin-nextjs"

2:43:44 PM: 

2:43:44 PM: ❯ Resolved build environment

2:43:44 PM: branch: main

2:43:44 PM: buildDir: /opt/build/repo

2:43:44 PM: configPath: /opt/build/repo/netlify.toml

2:43:44 PM: context: production

2:43:44 PM: env: \[]

2:43:44 PM: 

2:43:44 PM: ❯ Resolved config

2:43:44 PM: build:

2:43:44 PM:   command: node -e "require('fs').copyFileSync('.env.netlify', '.env')" \&\& npm ci

2:43:44 PM:     --include=dev \&\& npm run optimize:pre-build \&\& npm run build

2:43:44 PM:   commandOrigin: config

2:43:44 PM:   edge\_functions: /opt/build/repo/netlify/edge-functions

2:43:44 PM:   environment:

2:43:44 PM:     - ADMIN\_API\_KEY

2:43:44 PM:     - ALLOWED\_ORIGINS

2:43:44 PM:     - AUTOBOLT\_API\_KEY

2:43:44 PM:     - AUTOBOLT\_DEFAULT\_PERMISSIONS

2:43:44 PM:     - AUTOBOLT\_WEBHOOK\_URL

2:43:44 PM:     - BASE\_URL

2:43:44 PM:     - JWT\_ACCESS\_SECRET

2:43:44 PM:     - JWT\_REFRESH\_SECRET

2:43:44 PM:     - JWT\_SECRET

2:43:44 PM:     - NEXTAUTH\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_API\_BASE\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_APP\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_BASE\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

2:43:44 PM:     - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

2:43:44 PM:     - NEXT\_PUBLIC\_GTM\_ID

2:43:44 PM:     - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

2:43:44 PM:     - NEXT\_PUBLIC\_SUPABASE\_URL

2:43:44 PM:     - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

2:43:44 PM:     - NODE\_ENV

2:43:44 PM:     - NODE\_VERSION

2:43:44 PM:     - OPENAI\_API\_KEY

2:43:44 PM:     - PUPPETEER\_EXECUTABLE\_PATH

2:43:44 PM:     - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

2:43:44 PM:     - SITE\_URL

2:43:44 PM:     - STAFF\_API\_KEY

2:43:44 PM:     - STRIPE\_CSV\_EXPORT\_PRICE\_ID

2:43:44 PM:     - STRIPE\_ENTERPRISE\_PRICE\_ID

2:43:44 PM:     - STRIPE\_GROWTH\_PRICE\_ID

2:43:44 PM:     - STRIPE\_PROFESSIONAL\_PRICE\_ID

2:43:44 PM:     - STRIPE\_PUBLISHABLE\_KEY

2:43:44 PM:     - STRIPE\_SECRET\_KEY

2:43:44 PM:     - STRIPE\_STARTER\_PRICE\_ID

2:43:44 PM:     - STRIPE\_WEBHOOK\_SECRET

2:43:44 PM:     - SUPABASE\_ANON\_KEY

2:43:44 PM:     - SUPABASE\_DATABASE\_URL

2:43:44 PM:     - SUPABASE\_JWT\_SECRET

2:43:44 PM:     - SUPABASE\_SERVICE\_ROLE\_KEY

2:43:44 PM:     - SUPABASE\_URL

2:43:44 PM:     - USER\_AGENT

2:43:44 PM:     - VAPID\_PRIVATE\_KEY

2:43:44 PM:     - WORKER\_AUTH\_TOKEN

2:43:44 PM:     - NODE\_OPTIONS

2:43:44 PM:     - NETLIFY\_BUILD\_DEBUG

2:43:44 PM:     - BUILDING

2:43:44 PM:     - NETLIFY

2:43:44 PM:   publish: /opt/build/repo/.next

2:43:44 PM:   publishOrigin: config

2:43:44 PM: functions:

2:43:44 PM:   "\*":

2:43:44 PM:     node\_bundler: esbuild

2:43:44 PM: functionsDirectory: /opt/build/repo/netlify/functions

2:43:44 PM: headers:

2:43:44 PM:   - for: /api/ai/\*

&nbsp;   values:

&nbsp;     Cache-Control: no-cache, no-store, must-revalidate

&nbsp;     Referrer-Policy: strict-origin-when-cross-origin

&nbsp;     X-Content-Type-Options: nosniff

&nbsp;     X-Frame-Options: DENY

&nbsp;     X-Robots-Tag: noindex, nofollow

&nbsp;     X-XSS-Protection: 1; mode=block

&nbsp; - for: /\*

&nbsp;   values:

&nbsp;     Permissions-Policy: camera=(), microphone=(), geolocation=()

&nbsp;     Referrer-Policy: strict-origin-when-cross-origin

&nbsp;     X-Content-Type-Options: nosniff

&nbsp;     X-Frame-Options: DENY

headersOrigin: config

plugins:

&nbsp; - inputs: {}

&nbsp;   origin: config

&nbsp;   package: "@netlify/plugin-nextjs"

redirects:

&nbsp; - force: true

&nbsp;   from: /api/ai/health

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/ai-health-check

&nbsp; - force: true

&nbsp;   from: /api/puppeteer/\*

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/puppeteer-handler

&nbsp; - force: true

&nbsp;   from: /api/customer/validate

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/customer-validate

&nbsp; - force: true

&nbsp;   from: /api/extension/secure-validate

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/extension-secure-validate

&nbsp; - force: true

&nbsp;   from: /api/healthz

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/healthz

&nbsp; - force: true

&nbsp;   from: /api/version

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/version

&nbsp; - force: true

&nbsp;   from: /api/autobolt-status

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/autobolt-status

&nbsp; - force: true

&nbsp;   from: /api/jobs-next

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/jobs-next

&nbsp; - force: true

&nbsp;   from: /api/jobs-update

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/jobs-update

&nbsp; - force: true

&nbsp;   from: /api/jobs-complete

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/jobs-complete

&nbsp; - force: true

&nbsp;   from: /api/jobs-retry

&nbsp;   status: 200

&nbsp;   to: /.netlify/functions/jobs-retry

redirectsOrigin: config



2:43:44 PM: ❯ Current directory

2:43:44 PM:   /opt/build/repo

2:43:44 PM: 

2:43:44 PM: ❯ Config file

2:43:44 PM:   /opt/build/repo/netlify.toml

2:43:44 PM: 

2:43:44 PM: ❯ Resolved config

2:43:44 PM:   build:

2:43:44 PM:     command: node -e "require('fs').copyFileSync('.env.netlify', '.env')" \&\& npm ci

2:43:44 PM:       --include=dev \&\& npm run optimize:pre-build \&\& npm run build

2:43:44 PM:     commandOrigin: config

2:43:44 PM:     edge\_functions: /opt/build/repo/netlify/edge-functions

2:43:44 PM:     environment:

2:43:44 PM:       - ADMIN\_API\_KEY

2:43:44 PM:       - ALLOWED\_ORIGINS

2:43:44 PM:       - AUTOBOLT\_API\_KEY

2:43:44 PM:       - AUTOBOLT\_DEFAULT\_PERMISSIONS

2:43:44 PM:       - AUTOBOLT\_WEBHOOK\_URL

2:43:44 PM:       - BASE\_URL

2:43:44 PM:       - JWT\_ACCESS\_SECRET

2:43:44 PM:       - JWT\_REFRESH\_SECRET

2:43:44 PM:       - JWT\_SECRET

2:43:44 PM:       - NEXTAUTH\_URL

2:43:44 PM:       - NEXT\_PUBLIC\_API\_BASE\_URL

2:43:44 PM:       - NEXT\_PUBLIC\_APP\_URL

2:43:44 PM:       - NEXT\_PUBLIC\_BASE\_URL

2:43:44 PM:       - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

2:43:44 PM:       - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

2:43:44 PM:       - NEXT\_PUBLIC\_GTM\_ID

2:43:44 PM:       - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

2:43:44 PM:       - NEXT\_PUBLIC\_SUPABASE\_URL

2:43:44 PM:       - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

2:43:44 PM:       - NODE\_ENV

2:43:44 PM:       - NODE\_VERSION

2:43:44 PM:       - OPENAI\_API\_KEY

2:43:44 PM:       - PUPPETEER\_EXECUTABLE\_PATH

2:43:44 PM:       - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

2:43:44 PM:       - SITE\_URL

2:43:44 PM:       - STAFF\_API\_KEY

2:43:44 PM:       - STRIPE\_CSV\_EXPORT\_PRICE\_ID

2:43:44 PM:       - STRIPE\_ENTERPRISE\_PRICE\_ID

2:43:44 PM:       - STRIPE\_GROWTH\_PRICE\_ID

2:43:44 PM:       - STRIPE\_PROFESSIONAL\_PRICE\_ID

2:43:44 PM:       - STRIPE\_PUBLISHABLE\_KEY

2:43:44 PM:       - STRIPE\_SECRET\_KEY

2:43:44 PM:       - STRIPE\_STARTER\_PRICE\_ID

2:43:44 PM:       - STRIPE\_WEBHOOK\_SECRET

2:43:44 PM:       - SUPABASE\_ANON\_KEY

2:43:44 PM:       - SUPABASE\_DATABASE\_URL

2:43:44 PM:       - SUPABASE\_JWT\_SECRET

2:43:44 PM:       - SUPABASE\_SERVICE\_ROLE\_KEY

2:43:44 PM:       - SUPABASE\_URL

2:43:44 PM:       - USER\_AGENT

2:43:44 PM:       - VAPID\_PRIVATE\_KEY

2:43:44 PM:       - WORKER\_AUTH\_TOKEN

2:43:44 PM:       - NODE\_OPTIONS

2:43:44 PM:       - NETLIFY\_BUILD\_DEBUG

2:43:44 PM:       - BUILDING

2:43:44 PM:       - NETLIFY

2:43:44 PM:     publish: /opt/build/repo/.next

2:43:44 PM:     publishOrigin: config

2:43:44 PM:   functions:

2:43:44 PM:     "\*":

2:43:44 PM:       node\_bundler: esbuild

2:43:44 PM:   functionsDirectory: /opt/build/repo/netlify/functions

2:43:44 PM:   headers:

2:43:44 PM:     - for: /api/ai/\*

&nbsp;     values:

&nbsp;       Cache-Control: no-cache, no-store, must-revalidate

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp;       X-Robots-Tag: noindex, nofollow

&nbsp;       X-XSS-Protection: 1; mode=block

&nbsp;   - for: /\*

&nbsp;     values:

&nbsp;       Permissions-Policy: camera=(), microphone=(), geolocation=()

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp; headersOrigin: config

&nbsp; plugins:

&nbsp;   - inputs: {}

&nbsp;     origin: config

&nbsp;     package: "@netlify/plugin-nextjs"

&nbsp; redirects:

&nbsp;   - force: true

&nbsp;     from: /api/ai/health

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/ai-health-check

&nbsp;   - force: true

&nbsp;     from: /api/puppeteer/\*

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/puppeteer-handler

&nbsp;   - force: true

&nbsp;     from: /api/customer/validate

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/customer-validate

&nbsp;   - force: true

&nbsp;     from: /api/extension/secure-validate

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/extension-secure-validate

&nbsp;   - force: true

&nbsp;     from: /api/healthz

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/healthz

&nbsp;   - force: true

&nbsp;     from: /api/version

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/version

&nbsp;   - force: true

&nbsp;     from: /api/autobolt-status

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/autobolt-status

&nbsp;   - force: true

&nbsp;     from: /api/jobs-next

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-next

&nbsp;   - force: true

&nbsp;     from: /api/jobs-update

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-update

&nbsp;   - force: true

&nbsp;     from: /api/jobs-complete

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-complete

&nbsp;   - force: true

&nbsp;     from: /api/jobs-retry

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-retry

&nbsp; redirectsOrigin: config



❯ Context

&nbsp; production



2:43:44 PM: ❯ Available plugins

2:43:44 PM:    - @21yunbox/netlify-plugin-21yunbox-deploy-to-china-cdn@1.0.7

2:43:44 PM:    - @algolia/netlify-plugin-crawler@1.0.0

2:43:44 PM:    - @bharathvaj/netlify-plugin-airbrake@1.0.2

2:43:44 PM:    - @chiselstrike/netlify-plugin@0.1.0

2:43:44 PM:    - @commandbar/netlify-plugin-commandbar@0.0.4

2:43:44 PM:    - @helloample/netlify-plugin-replace@1.1.4

2:43:44 PM:    - @netlify/angular-runtime@2.4.0

2:43:44 PM:    - @netlify/feature-package-pilot@0.1.11

2:43:44 PM:    - @netlify/plugin-angular-universal@1.0.1

2:43:44 PM:    - @netlify/plugin-contentful-buildtime@0.0.3

2:43:44 PM:    - @netlify/plugin-emails@1.1.1

2:43:44 PM:    - @netlify/plugin-gatsby@3.8.4

2:43:44 PM:    - @netlify/plugin-lighthouse@6.0.1

2:43:44 PM:    - @netlify/plugin-nextjs@5.7.0-ipx.0

2:43:44 PM:    - @netlify/plugin-sitemap@0.8.1

2:43:44 PM:    - @newrelic/netlify-plugin@1.0.2

2:43:44 PM:    - @sentry/netlify-build-plugin@1.1.1

2:43:44 PM:    - @snaplet/netlify-preview-database-plugin@2.0.0

2:43:44 PM:    - @takeshape/netlify-plugin-takeshape@1.0.0

2:43:44 PM:    - @vgs/netlify-plugin-vgs@0.0.2

2:43:44 PM:    - netlify-build-plugin-dareboost@1.2.1

2:43:44 PM:    - netlify-build-plugin-debugbear@1.0.6

2:43:44 PM:    - netlify-build-plugin-perfbeacon@1.0.3

2:43:44 PM:    - netlify-build-plugin-speedcurve@2.0.0

2:43:44 PM:    - netlify-deployment-hours-plugin@0.0.10

2:43:44 PM:    - netlify-plugin-a11y@0.0.12

2:43:44 PM:    - netlify-plugin-add-instagram@0.2.2

2:43:44 PM:    - netlify-plugin-algolia-index@0.3.0

2:43:44 PM:    - netlify-plugin-amp-server-side-rendering@1.0.2

2:43:44 PM:    - netlify-plugin-brand-guardian@1.0.1

2:43:44 PM:    - netlify-plugin-build-logger@1.0.3

2:43:44 PM:    - netlify-plugin-bundle-env@0.2.2

2:43:44 PM:    - netlify-plugin-cache-nextjs@1.4.0

2:43:44 PM:    - netlify-plugin-cecil-cache@0.3.3

2:43:44 PM:    - netlify-plugin-checklinks@4.1.1

2:43:44 PM:    - netlify-plugin-chromium@1.1.4

2:43:44 PM:    - netlify-plugin-cloudinary@1.17.0

2:43:44 PM:    - netlify-plugin-contextual-env@0.3.0

2:43:44 PM:    - netlify-plugin-cypress@2.2.0

2:43:44 PM:    - netlify-plugin-debug-cache@1.0.4

2:43:44 PM:    - netlify-plugin-encrypted-files@0.0.5

2:43:44 PM:    - netlify-plugin-fetch-feeds@0.2.3

2:43:44 PM:    - netlify-plugin-flutter@1.1.0

2:43:44 PM:    - netlify-plugin-formspree@1.0.1

2:43:44 PM:    - netlify-plugin-gatsby-cache@0.3.0

2:43:44 PM:    - netlify-plugin-get-env-vars@1.0.0

2:43:44 PM:    - netlify-plugin-ghost-inspector@1.0.1

2:43:44 PM:    - netlify-plugin-ghost-markdown@3.1.0

2:43:44 PM:    - netlify-plugin-gmail@1.1.0

2:43:44 PM:    - netlify-plugin-gridsome-cache@1.0.3

2:43:44 PM:    - netlify-plugin-hashfiles@4.0.2

2:43:44 PM:    - netlify-plugin-html-validate@1.0.0

2:43:44 PM:    - netlify-plugin-hugo-cache-resources@0.2.1

2:43:44 PM:    - netlify-plugin-image-optim@0.4.0

2:43:44 PM:    - netlify-plugin-inline-critical-css@2.0.0

2:43:44 PM:    - netlify-plugin-inline-functions-env@1.0.8

2:43:44 PM:    - netlify-plugin-inline-source@1.0.4

2:43:44 PM:    - netlify-plugin-inngest@1.0.0

2:43:44 PM:    - netlify-plugin-is-website-vulnerable@2.0.3

2:43:44 PM:    - netlify-plugin-jekyll-cache@1.0.0

2:43:44 PM:    - netlify-plugin-js-obfuscator@1.0.20

2:43:44 PM:    - netlify-plugin-minify-html@0.3.1

2:43:44 PM:    - netlify-plugin-next-dynamic@1.0.9

2:43:44 PM:    - netlify-plugin-nimbella@2.1.0

2:43:44 PM:    - netlify-plugin-no-more-404@0.0.15

2:43:44 PM:    - netlify-plugin-nx-skip-build@0.0.7

2:43:44 PM:    - netlify-plugin-pagewatch@1.0.4

2:43:44 PM:    - netlify-plugin-playwright-cache@0.0.1

2:43:44 PM:    - netlify-plugin-prerender-spa@1.0.1

2:43:44 PM:    - netlify-plugin-prisma-provider@0.3.0

2:43:44 PM:    - netlify-plugin-pushover@0.1.1

2:43:44 PM:    - netlify-plugin-qawolf@1.2.0

2:43:44 PM:    - netlify-plugin-rss@0.0.8

2:43:44 PM:    - netlify-plugin-search-index@0.1.5

2:43:44 PM:    - netlify-plugin-snyk@1.2.0

2:43:44 PM:    - netlify-plugin-stepzen@1.0.4

2:43:44 PM:    - netlify-plugin-subfont@6.0.0

2:43:44 PM:    - netlify-plugin-submit-sitemap@0.4.0

2:43:44 PM:    - netlify-plugin-to-all-events@1.3.1

2:43:44 PM:    - netlify-plugin-use-env-in-runtime@1.2.1

2:43:44 PM:    - netlify-plugin-visual-diff@2.0.0

2:43:44 PM:    - netlify-plugin-webmentions@1.1.0

2:43:44 PM:    - netlify-purge-cloudflare-on-deploy@1.2.0

2:43:44 PM:    - strapi-plugin-netlify-deployments@2.0.1

2:43:44 PM: Used compatible version '5.13.3' for plugin '@netlify/plugin-nextjs' (pinned version is 5)

2:43:44 PM: 

2:43:44 PM: ❯ Installing extensions

2:43:44 PM:    - neon

2:43:45 PM: 

2:43:45 PM: ❯ Using Next.js Runtime - v5.13.3

2:43:45 PM: 

2:43:45 PM: ❯ Loading extensions

2:43:45 PM:    - neon

2:43:47 PM: 

2:43:47 PM: @netlify/plugin-nextjs (onPreBuild event)                     

2:43:47 PM: ────────────────────────────────────────────────────────────────

2:43:47 PM: 

2:43:47 PM: Step starting.

2:43:47 PM: Step started.

2:43:47 PM: Plugin logic started.

2:43:47 PM: Next.js cache restored

2:43:47 PM: Plugin logic ended.

2:43:47 PM: Stop closing.

2:43:47 PM: Step ended.

2:43:47 PM: Step completed.

2:43:47 PM: 

2:43:47 PM: (@netlify/plugin-nextjs onPreBuild completed in 263ms)

2:43:47 PM: Build step duration: @netlify/plugin-nextjs onPreBuild completed in 263ms

2:43:47 PM: 

2:43:47 PM: neon-buildhooks (onPreBuild event)                            

2:43:47 PM: ────────────────────────────────────────────────────────────────

2:43:47 PM: 

2:43:47 PM: Step starting.

2:43:47 PM: Step started.

2:43:47 PM: Plugin logic started.

2:43:47 PM: Plugin logic ended.

2:43:47 PM: Stop closing.

2:43:47 PM: Step ended.

2:43:47 PM: Step completed.

2:43:47 PM: 

2:43:47 PM: (neon-buildhooks onPreBuild completed in 9ms)

2:43:47 PM: Build step duration: neon-buildhooks onPreBuild completed in 9ms

2:43:47 PM: 

2:43:47 PM: build.command from netlify.toml                               

2:43:47 PM: ────────────────────────────────────────────────────────────────

2:43:47 PM: 

2:43:47 PM: $ node -e "require('fs').copyFileSync('.env.netlify', '.env')" \&\& npm ci --include=dev \&\& npm run optimize:pre-build \&\& npm run build

2:43:52 PM: npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.

2:43:53 PM: npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported

2:43:53 PM: npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported

2:43:53 PM: npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported

2:43:53 PM: npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported

2:43:54 PM: npm warn deprecated sourcemap-codec@1.4.8: Please use @jridgewell/sourcemap-codec instead

2:43:54 PM: npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead

npm warn deprecated npmlog@5.0.1: This package is no longer supported.

2:43:55 PM: npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported

2:43:55 PM: npm warn deprecated gauge@3.0.2: This package is no longer supported.

2:43:55 PM: npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.

2:43:57 PM: npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead

2:43:57 PM: npm warn deprecated @humanwhocodes/config-array@0.11.14: Use @eslint/config-array instead

2:43:58 PM: npm warn deprecated glob@7.1.7: Glob versions prior to v9 are no longer supported

2:44:03 PM: npm warn deprecated source-map@0.8.0-beta.0: The work that was done in this beta branch won't be included in future versions

npm warn deprecated eslint@8.51.0: This version is no longer supported. Please see https://eslint.org/version-support for other options.

2:44:12 PM: added 1576 packages, and audited 1577 packages in 25s

2:44:12 PM: 242 packages are looking for funding

2:44:12 PM:   run `npm fund` for details

2:44:12 PM: found 0 vulnerabilities

2:44:12 PM: > directorybolt@2.0.1-emergency-fix optimize:pre-build

2:44:12 PM: > npm run optimize:build \&\& npm run debug:env

2:44:12 PM: > directorybolt@2.0.1-emergency-fix optimize:build

2:44:12 PM: > node scripts/advanced-build-optimizer.js

2:44:12 PM: 🚀 Starting Advanced Build Optimization...

2:44:12 PM: Platform: netlify

2:44:12 PM: Environment: production

2:44:12 PM: 📊 Loaded previous build metrics for comparison

2:44:12 PM: 🔧 Optimizing dependencies...

2:44:12 PM: ⚙️ Optimizing Next.js configuration...

2:44:12 PM: 📦 Performing bundle analysis...

2:44:12 PM: 💾 Optimizing build cache...

2:44:12 PM: 📈 Monitoring build performance...

2:44:12 PM: 📋 Generating optimization report...

2:44:12 PM: 📊 BUILD OPTIMIZATION RESULTS

2:44:12 PM: =============================

2:44:12 PM: Build Score: 70/100

2:44:12 PM: Overall Health: GOOD

2:44:12 PM: Optimizations Applied: 2

2:44:12 PM: Recommendations: 2

2:44:12 PM: Duration Change: -0.0s

2:44:12 PM: Memory Change: -0.2MB

2:44:12 PM: Trend: stable

2:44:12 PM: 💡 TOP RECOMMENDATIONS:

2:44:12 PM:   1. \[HIGH] Consider using only @sparticuz/chromium in production to reduce bundle size

2:44:12 PM:   2. \[MEDIUM] High memory utilization detected

2:44:12 PM: 📋 NEXT STEPS:

2:44:12 PM:   IMMEDIATE: Address high-priority recommendations

2:44:12 PM:     - Consider using only @sparticuz/chromium in production to reduce bundle size

2:44:12 PM:   ONGOING: Monitor and maintain

2:44:12 PM:     - Run optimization checks regularly

2:44:12 PM:     - Review build metrics trends

2:44:12 PM:     - Update dependencies quarterly

2:44:12 PM: 📄 Detailed report saved to: /opt/build/repo/build-optimization-report.json

2:44:12 PM: ✅ Build optimization completed successfully

2:44:12 PM: > directorybolt@2.0.1-emergency-fix debug:env

2:44:12 PM: > node scripts/advanced-env-debug.js

2:44:12 PM: \[dotenv@17.2.2] injecting env (3) from .env -- tip: ⚙️  enable debug logging with { debug: true }

2:44:12 PM: 🚀 Starting Advanced Environment Debugging...

2:44:12 PM: Platform: netlify

2:44:12 PM: Environment: production

2:44:12 PM: 🔍 \[CRITICAL] Testing: Environment Variables

2:44:12 PM: ✅ Environment Variables: PASSED

2:44:12 PM: 🔍 \[CRITICAL] Testing: API Connectivity

2:44:13 PM: ✅ API Connectivity: PASSED

2:44:13 PM: 🔍 \[INFO] Testing: Build Artifacts

2:44:13 PM: ✅ Build Artifacts: PASSED

2:44:13 PM: 🔍 \[INFO] Testing: Performance Metrics

2:44:13 PM: ✅ Performance Metrics: PASSED

2:44:13 PM: 🔍 \[INFO] Testing: Security Configuration

2:44:13 PM: ✅ Security Configuration: PASSED

2:44:13 PM: 📊 DEBUGGING RESULTS

2:44:13 PM: ==================

2:44:13 PM: Overall Health: ✅ HEALTHY

2:44:13 PM: Overall Score: 100/100

2:44:13 PM: Critical Issues: 0

2:44:13 PM: Warnings: 0

2:44:13 PM: Recommendations: 3

2:44:13 PM: 💡 RECOMMENDATIONS:

2:44:13 PM:   - Performance: Consider optimizing memory usage or increasing heap size

2:44:13 PM:   - Security: Improve security configuration

2:44:13 PM:   - Platform: Consider implementing Netlify Edge Functions for better performance

2:44:13 PM: 📄 Detailed results saved to: /opt/build/repo/debug-results.json

2:44:13 PM: ✅ Environment debugging completed successfully

2:44:14 PM: > directorybolt@2.0.1-emergency-fix prebuild

2:44:14 PM: > npm run validate:guides

2:44:14 PM: > directorybolt@2.0.1-emergency-fix validate:guides

2:44:14 PM: > node scripts/validate-json-guides.js

2:44:14 PM: 🔍 Validating JSON guide files...

2:44:14 PM: 📁 Directory: /opt/build/repo/data/guides

2:44:14 PM: 📄 Found 50 JSON files

2:44:14 PM: ✅ airbnb-host-listing.json - Valid (9112 bytes)

2:44:14 PM: ✅ amazon-business-directory.json - Valid (18808 bytes)

2:44:14 PM: ✅ amazon-seller-central.json - Valid (8675 bytes)

2:44:14 PM: ✅ angie-list-business-listing.json - Valid (9530 bytes)

2:44:14 PM: ✅ apple-business-connect.json - Valid (15332 bytes)

2:44:14 PM: ✅ avvo-lawyer-directory.json - Valid (11979 bytes)

2:44:14 PM: ✅ behance-creative-portfolio.json - Valid (12219 bytes)

2:44:14 PM: ✅ better-business-bureau.json - Valid (18779 bytes)

2:44:14 PM: ✅ bing-places-business.json - Valid (14739 bytes)

2:44:14 PM: ✅ booking-com-property.json - Valid (9354 bytes)

2:44:14 PM: ✅ chamber-commerce-membership.json - Valid (12530 bytes)

2:44:14 PM: ✅ crunchbase-company-profile.json - Valid (17650 bytes)

2:44:14 PM: ✅ discord-community-server.json - Valid (10633 bytes)

2:44:14 PM: ✅ ebay-seller-account.json - Valid (9118 bytes)

2:44:14 PM: ✅ etsy-shop-optimization.json - Valid (11731 bytes)

2:44:14 PM: ✅ facebook-business-page-optimization.json - Valid (13809 bytes)

2:44:14 PM: ✅ facebook-marketplace-seller.json - Valid (9436 bytes)

2:44:14 PM: ✅ fiverr-seller-profile.json - Valid (12096 bytes)

2:44:14 PM: ✅ foursquare-business-claiming.json - Valid (18377 bytes)

2:44:14 PM: ✅ github-developer-profile.json - Valid (11813 bytes)

2:44:14 PM: ✅ glassdoor-company-profile.json - Valid (10042 bytes)

2:44:14 PM: ✅ google-ads-business.json - Valid (10118 bytes)

2:44:14 PM: ✅ google-business-profile.json - Valid (12310 bytes)

2:44:14 PM: ✅ google-my-business-setup.json - Valid (8864 bytes)

2:44:14 PM: ✅ healthgrades-doctor-profile.json - Valid (12060 bytes)

2:44:14 PM: ✅ homeadvisor-contractor-profile.json - Valid (9741 bytes)

2:44:14 PM: ✅ houzz-professional-profile.json - Valid (12899 bytes)

2:44:14 PM: ✅ indeed-employer-profile.json - Valid (10374 bytes)

2:44:14 PM: ✅ instagram-business-profile.json - Valid (12303 bytes)

2:44:14 PM: ✅ linkedin-company-directory.json - Valid (16529 bytes)

2:44:14 PM: ✅ manta-business-directory.json - Valid (10820 bytes)

2:44:14 PM: ✅ microsoft-advertising-bing.json - Valid (9803 bytes)

2:44:14 PM: ✅ nextdoor-business-profile.json - Valid (12227 bytes)

2:44:14 PM: ✅ pinterest-business-account.json - Valid (12509 bytes)

2:44:14 PM: ✅ product-hunt-launch-guide.json - Valid (11499 bytes)

2:44:14 PM: ✅ reddit-business-marketing.json - Valid (10346 bytes)

2:44:14 PM: ✅ shopify-store-directory.json - Valid (12732 bytes)

2:44:14 PM: ✅ squarespace-business-listing.json - Valid (12682 bytes)

2:44:14 PM: ✅ superpages-business-listing.json - Valid (12068 bytes)

2:44:14 PM: ✅ thumbtack-service-provider.json - Valid (9779 bytes)

2:44:14 PM: ✅ tiktok-business-account.json - Valid (12094 bytes)

2:44:14 PM: ✅ tripadvisor-business-listing.json - Valid (18587 bytes)

2:44:14 PM: ✅ twitter-business-profile.json - Valid (12207 bytes)

2:44:14 PM: ✅ upwork-freelancer-profile.json - Valid (12624 bytes)

2:44:14 PM: ✅ wix-business-directory.json - Valid (12713 bytes)

2:44:14 PM: ✅ wordpress-business-directory.json - Valid (12777 bytes)

2:44:14 PM: ✅ yellow-pages-online.json - Valid (17674 bytes)

2:44:14 PM: ✅ yelp-business-optimization.json - Valid (9514 bytes)

2:44:14 PM: ✅ youtube-business-channel.json - Valid (12655 bytes)

2:44:14 PM: ✅ zillow-agent-profile.json - Valid (12212 bytes)

2:44:14 PM: 📊 Validation Summary:

2:44:14 PM:    Total files: 50

2:44:14 PM:    Valid files: 50

2:44:14 PM:    Invalid files: 0

2:44:14 PM:    Files with warnings: 0

2:44:14 PM: ✅ All JSON files are valid! Build should succeed.

2:44:14 PM: > directorybolt@2.0.1-emergency-fix build

2:44:14 PM: > node scripts/verify-build.js \&\& cross-env NEXT\_TELEMETRY\_DISABLED=1 next build

2:44:14 PM: 🔍 Verifying build components...

2:44:14 PM: ✅ Found: AI-Powered Business Intelligence

2:44:14 PM: ✅ Found: $4,300 Worth of Business Intelligence

2:44:14 PM: ✅ Found: $299 ONE-TIME

2:44:14 PM: ✅ Found: Save 93% vs. consultant project fees

2:44:14 PM: ✅ Build verification passed - all required content found

2:44:14 PM: 🚀 Build timestamp: 2025-09-26T20:44:14.328Z

2:44:15 PM:   ▲ Next.js 14.2.32

2:44:15 PM:   - Environments: .env

2:44:15 PM:   - Experiments (use with caution):

2:44:15 PM:     · optimizeCss

2:44:15 PM:     · scrollRestoration

2:44:15 PM:    Creating an optimized production build ...

2:44:19 PM:  ✓ Compiled successfully

2:44:19 PM:    Skipping validation of types

2:44:19 PM:    Skipping linting

2:44:20 PM:    Collecting page data ...

2:44:22 PM:    Generating static pages (0/8) ...

2:44:22 PM:    Generating static pages (2/8)

2:44:23 PM: Inlined 2.14 kB (1% of original 139.31 kB) of \_next/static/css/b3b9e63db2b5f5ff.css.

2:44:23 PM: Time 180.859927

2:44:23 PM: Inlined 2.77 kB (1% of original 139.31 kB) of \_next/static/css/b3b9e63db2b5f5ff.css.

2:44:23 PM: Time 208.639029

2:44:23 PM:    Generating static pages (4/8)

2:44:23 PM: Inlined 7.48 kB (5% of original 139.31 kB) of \_next/static/css/b3b9e63db2b5f5ff.css.

2:44:23 PM: Time 264.698449

2:44:23 PM: Inlined 7.48 kB (5% of original 139.31 kB) of \_next/static/css/b3b9e63db2b5f5ff.css.

2:44:23 PM: Time 286.286539

2:44:23 PM: Inlined 2.14 kB (1% of original 139.31 kB) of \_next/static/css/b3b9e63db2b5f5ff.css.

2:44:23 PM: Time 286.214693

2:44:23 PM:    Generating static pages (6/8)

2:44:23 PM: Inlined 16.75 kB (12% of original 139.31 kB) of \_next/static/css/b3b9e63db2b5f5ff.css.

2:44:23 PM: Time 328.679398

2:44:23 PM:  ✓ Generating static pages (8/8)

2:44:24 PM:    Finalizing page optimization ...

2:44:24 PM:    Collecting build traces ...

2:44:51 PM: Route (app)                                  Size     First Load JS

2:44:51 PM: ┌ ƒ /api/push/send                           0 B                0 B

2:44:51 PM: └ ƒ /api/push/subscribe                      0 B                0 B

2:44:51 PM: + First Load JS shared by all                0 B

2:44:51 PM: Route (pages)                                Size     First Load JS

2:44:51 PM: ┌ ● / (674 ms)                               4.16 kB         207 kB

2:44:51 PM: ├   /\_app                                    0 B             202 kB

2:44:51 PM: ├ ○ /404                                     180 B           203 kB

2:44:51 PM: ├ ○ /admin-login (586 ms)                    2.2 kB          205 kB

2:44:51 PM: ├ ƒ /api/admin/alerts                        0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/alerts/\[alertId]/resolve      0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/api-keys                      0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/api-keys/\[keyId]              0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/api-keys/analytics            0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/auth-check                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/cleanup-test-customers        0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/config-check                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/customers/stats               0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/directories/stats             0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/login                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/logout                        0 B             202 kB

2:44:51 PM: ├ ƒ /api/admin/system/metrics                0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai-analysis                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai-enhanced-checkout                0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai-health                           0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai-portal/insights                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai-portal/refresh                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai-suggestions                      0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/business-analysis                0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/cache-management                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/competitive-benchmarking         0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/competitor-analysis              0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/competitor-seo-research          0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/content-gap-analysis             0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/content-optimization             0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/customer-dashboard               0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/enhanced-analysis                0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/generate-descriptions            0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/keyword-gap-analysis             0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/monitoring/dashboard             0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/seo-content-gap-analysis         0 B             202 kB

2:44:51 PM: ├ ƒ /api/ai/status                           0 B             202 kB

2:44:51 PM: ├ ƒ /api/analysis/website-analyze            0 B             202 kB

2:44:51 PM: ├ ƒ /api/analytics/engagement                0 B             202 kB

2:44:51 PM: ├ ƒ /api/analytics/errors                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/analytics/metrics                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/analytics/performance               0 B             202 kB

2:44:51 PM: ├ ƒ /api/analytics/track                     0 B             202 kB

2:44:51 PM: ├ ƒ /api/analyze                             0 B             202 kB

2:44:51 PM: ├ ƒ /api/analyze/progress                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/auth/api-keys                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/auth/login                          0 B             202 kB

2:44:51 PM: ├ ƒ /api/auth/logout                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/auth/refresh-token                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/auth/register                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/auth/reset-password                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/auth/sessions                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt-status                     0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/activity                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/activity-logger            0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/audit-trail                0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/capture-screenshot         0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/customer-data              0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/customer-status            0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/debug-mode                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/directories                0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/dynamic-mapping            0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/emergency-stop             0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/get-next-customer          0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/health                     0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/heartbeat                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/jobs/complete              0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/jobs/next                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/jobs/retry                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/jobs/update                0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/live-activity              0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/monitoring-overview        0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/pending-customers          0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/process-queue              0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/processing-queue           0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/queue                      0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/queue-status               0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/real-time-status           0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/stream                     0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/submission-logs            0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/test-submissions           0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/test-submissions-backup    0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/update-progress            0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/update-submission          0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/validate-access            0 B             202 kB

2:44:51 PM: ├ ƒ /api/autobolt/watch-mode                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/business-info/submit                0 B             202 kB

2:44:51 PM: ├ ƒ /api/checkout-session-details            0 B             202 kB

2:44:51 PM: ├ ƒ /api/checkout-session/\[sessionId]        0 B             202 kB

2:44:51 PM: ├ ƒ /api/create-checkout-session             0 B             202 kB

2:44:51 PM: ├ ƒ /api/create-one-time-checkout            0 B             202 kB

2:44:51 PM: ├ ƒ /api/create-subscription-checkout        0 B             202 kB

2:44:51 PM: ├ ƒ /api/csrf-token                          0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer-portal                     0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/auth                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/dashboard-data             0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/data                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/data-operations            0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/notifications              0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/progress                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/register-complete          0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/submissions                0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/supabase-lookup            0 B             202 kB

2:44:51 PM: ├ ƒ /api/customer/validate                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/dashboard/widgets                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/debug/add-test-customers            0 B             202 kB

2:44:51 PM: ├ ƒ /api/debug/check-headers                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/debug/env-vars                      0 B             202 kB

2:44:51 PM: ├ ƒ /api/debug/list-customers                0 B             202 kB

2:44:51 PM: ├ ƒ /api/debug/test-supabase                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/debug/update-status-to-pending      0 B             202 kB

2:44:51 PM: ├ ƒ /api/demo/sample-analysis                0 B             202 kB

2:44:51 PM: ├ ƒ /api/directories                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/directories/analyze-form            0 B             202 kB

2:44:51 PM: ├ ƒ /api/directories/discover                0 B             202 kB

2:44:51 PM: ├ ƒ /api/directories/process-enhanced        0 B             202 kB

2:44:51 PM: ├ ƒ /api/directories/seed                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/directories/solve-captcha           0 B             202 kB

2:44:51 PM: ├ ƒ /api/extension/create-test-customers     0 B             202 kB

2:44:51 PM: ├ ƒ /api/extension/debug-validation          0 B             202 kB

2:44:51 PM: ├ ƒ /api/extension/status/\[trackingId]       0 B             202 kB

2:44:51 PM: ├ ƒ /api/extension/submit                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/extension/test-customer             0 B             202 kB

2:44:51 PM: ├ ƒ /api/extension/validate                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/gdpr/deletion-request               0 B             202 kB

2:44:51 PM: ├ ƒ /api/guides                              0 B             202 kB

2:44:51 PM: ├ ƒ /api/guides-safe                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/guides/analyze                      0 B             202 kB

2:44:51 PM: ├ ƒ /api/health                              0 B             202 kB

2:44:51 PM: ├ ƒ /api/health/comprehensive                0 B             202 kB

2:44:51 PM: ├ ƒ /api/health/google-sheets                0 B             202 kB

2:44:51 PM: ├ ƒ /api/health/google-sheets-comprehensive  0 B             202 kB

2:44:51 PM: ├ ƒ /api/health/supabase                     0 B             202 kB

2:44:51 PM: ├ ƒ /api/jobs/complete                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/jobs/next                           0 B             202 kB

2:44:51 PM: ├ ƒ /api/jobs/update                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/leads/capture                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/monitor/deployment                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/monitor/rendering                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/onboarding/complete                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/onboarding/progress                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/onboarding/status                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/payments/create-checkout            0 B             202 kB

2:44:51 PM: ├ ƒ /api/payments/webhook                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue                               0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/\[customerId]                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/add                           0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/batch                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/complete                      0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/operations                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/pending                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/process                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/retry                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/queue/status                        0 B             202 kB

2:44:51 PM: ├ ƒ /api/robots                              0 B             202 kB

2:44:51 PM: ├ ƒ /api/security/dashboard                  0 B             202 kB

2:44:51 PM: ├ ƒ /api/security/monitoring-dashboard       0 B             202 kB

2:44:51 PM: ├ ƒ /api/security/test-admin-auth            0 B             202 kB

2:44:51 PM: ├ ƒ /api/security/test-xss                   0 B             202 kB

2:44:51 PM: ├ ƒ /api/sitemap                             0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/analytics                     0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/auth-check                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/autobolt-extensions           0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/autobolt-queue                0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/jobs/progress                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/jobs/push-to-autobolt         0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/login                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/logout                        0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/push-to-autobolt              0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/queue                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/staff/realtime-status               0 B             202 kB

2:44:51 PM: ├ ƒ /api/status                              0 B             202 kB

2:44:51 PM: ├ ƒ /api/stripe/create-checkout-session      0 B             202 kB

2:44:51 PM: ├ ƒ /api/stripe/webhook                      0 B             202 kB

2:44:51 PM: ├ ƒ /api/submissions                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/subscription-status                 0 B             202 kB

2:44:51 PM: ├ ƒ /api/system-status                       0 B             202 kB

2:44:51 PM: ├ ƒ /api/usage-stats                         0 B             202 kB

2:44:51 PM: ├ ƒ /api/user/dashboard                      0 B             202 kB

2:44:51 PM: ├ ƒ /api/user/preferences                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/user/tier-status                    0 B             202 kB

2:44:51 PM: ├ ƒ /api/user/upgrade                        0 B             202 kB

2:44:51 PM: ├ ƒ /api/webhook                             0 B             202 kB

2:44:51 PM: ├ ƒ /api/webhooks/stripe                     0 B             202 kB

2:44:51 PM: ├ ƒ /api/webhooks/stripe-one-time-payments   0 B             202 kB

2:44:51 PM: ├ ƒ /api/webhooks/stripe-secure              0 B             202 kB

2:44:51 PM: ├ ƒ /api/webhooks/stripe-subscription        0 B             202 kB

2:44:51 PM: ├ ƒ /api/websocket/dashboard-updates         0 B             202 kB

2:44:51 PM: ├ ○ /staff-dashboard (498 ms)                29.6 kB         232 kB

2:44:51 PM: └ ○ /staff-login (585 ms)                    2.23 kB         205 kB

2:44:51 PM: + First Load JS shared by all                222 kB

2:44:51 PM:   ├ chunks/pages/\_app-624744b2faf00f31.js    11.2 kB

2:44:51 PM:   ├ chunks/vendors-5772f1cb20998508.js       189 kB

2:44:51 PM:   ├ css/b3b9e63db2b5f5ff.css                 19.9 kB

2:44:51 PM:   └ other shared chunks (total)              1.77 kB

2:44:51 PM: ○  (Static)   prerendered as static content

2:44:51 PM: ●  (SSG)      prerendered as static HTML (uses getStaticProps)

2:44:51 PM: ƒ  (Dynamic)  server-rendered on demand

2:44:51 PM: > directorybolt@2.0.1-emergency-fix postbuild

2:44:51 PM: > next-sitemap

2:44:51 PM: ✨ \[next-sitemap] Loading next-sitemap config: file:///opt/build/repo/next-sitemap.config.js

2:44:51 PM: ✅ \[next-sitemap] Generation completed

2:44:51 PM: ┌───────────────┬────────┐

2:44:51 PM: │ (index)       │ Values │

2:44:51 PM: ├───────────────┼────────┤

2:44:51 PM: │ indexSitemaps │ 1      │

2:44:51 PM: │ sitemaps      │ 1      │

2:44:51 PM: └───────────────┴────────┘

2:44:51 PM: -----------------------------------------------------

2:44:51 PM:  SITEMAP INDICES

2:44:51 PM: -----------------------------------------------------

2:44:51 PM:    ○ https://directorybolt.com/sitemap.xml

2:44:51 PM: -----------------------------------------------------

2:44:51 PM:  SITEMAPS

2:44:51 PM: -----------------------------------------------------

2:44:51 PM:    ○ https://directorybolt.com/sitemap-0.xml

2:44:51 PM: 

2:44:51 PM: (build.command completed in 1m 4s)

2:44:51 PM: Build step duration: build.command completed in 64059ms

2:44:51 PM: 

2:44:51 PM: @netlify/plugin-nextjs (onBuild event)                        

2:44:51 PM: ────────────────────────────────────────────────────────────────

2:44:51 PM: 

2:44:51 PM: Step starting.

2:44:51 PM: Step started.

2:44:51 PM: Plugin logic started.

2:44:51 PM: Plugin logic started.

2:44:51 PM: Next.js cache saved

2:44:51 PM: Next.js cache saved

2:44:53 PM: Plugin logic ended.

2:44:53 PM: Plugin logic ended.

2:44:53 PM: Stop closing.

2:44:53 PM: Stop closing.

2:44:53 PM: Step ended.

2:44:53 PM: Netlify configuration property "headers" value changed to \[

2:44:53 PM:   {

2:44:53 PM:     for: '/api/ai/\*',

2:44:53 PM:     values: {

2:44:53 PM:       'Cache-Control': 'no-cache, no-store, must-revalidate',

2:44:53 PM:       'X-Content-Type-Options': 'nosniff',

2:44:53 PM:       'X-Frame-Options': 'DENY',

2:44:53 PM:       'X-XSS-Protection': '1; mode=block',

2:44:53 PM:       'Referrer-Policy': 'strict-origin-when-cross-origin',

2:44:53 PM:       'X-Robots-Tag': 'noindex, nofollow'

2:44:53 PM:     }

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     for: '/\*',

2:44:53 PM:     values: {

2:44:53 PM:       'X-Frame-Options': 'DENY',

2:44:53 PM:       'X-Content-Type-Options': 'nosniff',

2:44:53 PM:       'Referrer-Policy': 'strict-origin-when-cross-origin',

2:44:53 PM:       'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'

2:44:53 PM:     }

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     for: '/\_next/static/\*',

2:44:53 PM:     values: { 'Cache-Control': 'public, max-age=31536000, immutable' }

2:44:53 PM:   }

2:44:53 PM: ].

2:44:53 PM: Netlify configuration property "redirects" value changed to \[

2:44:53 PM:   {

2:44:53 PM:     from: '/api/ai/health',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/ai-health-check',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/puppeteer/\*',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/puppeteer-handler',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/customer/validate',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/customer-validate',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/extension/secure-validate',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/extension-secure-validate',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/healthz',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/healthz',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/version',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/version',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/autobolt-status',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/autobolt-status',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/jobs-next',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/jobs-next',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/jobs-update',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/jobs-update',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/jobs-complete',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/jobs-complete',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/api/jobs-retry',

2:44:53 PM:     query: {},

2:44:53 PM:     to: '/.netlify/functions/jobs-retry',

2:44:53 PM:     status: 200,

2:44:53 PM:     force: true,

2:44:53 PM:     conditions: {},

2:44:53 PM:     headers: {}

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/\_next/image',

2:44:53 PM:     query: { url: ':url', w: ':width', q: ':quality' },

2:44:53 PM:     to: '/.netlify/images?url=:url\&w=:width\&q=:quality',

2:44:53 PM:     status: 200

2:44:53 PM:   },

2:44:53 PM:   {

2:44:53 PM:     from: '/\_ipx/\*',

2:44:53 PM:     query: { url: ':url', w: ':width', q: ':quality' },

2:44:53 PM:     to: '/.netlify/images?url=:url\&w=:width\&q=:quality',

2:44:53 PM:     status: 200

2:44:53 PM:   }

2:44:53 PM: ].

2:44:53 PM: Netlify configuration property "images" value changed to {

2:44:53 PM:   remote\_images: \[

2:44:53 PM:     '^(?:http(?:s)?:\\\\/\\\\/localhost(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$',

2:44:53 PM:     '^(?:http(?:s)?:\\\\/\\\\/directorybolt\\\\.com(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$',

2:44:53 PM:     '^(?:http(?:s)?:\\\\/\\\\/images\\\\.unsplash\\\\.com(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$'

2:44:53 PM:   ]

2:44:53 PM: }.

2:44:53 PM: 

2:44:53 PM: ❯ Updated config

2:44:53 PM:   build:

2:44:53 PM:     command: node -e "require('fs').copyFileSync('.env.netlify', '.env')" \&\& npm ci

2:44:53 PM:       --include=dev \&\& npm run optimize:pre-build \&\& npm run build

2:44:53 PM:     commandOrigin: config

2:44:53 PM:     edge\_functions: /opt/build/repo/netlify/edge-functions

2:44:53 PM:     environment:

2:44:53 PM:       - ADMIN\_API\_KEY

2:44:53 PM:       - ALLOWED\_ORIGINS

2:44:53 PM:       - AUTOBOLT\_API\_KEY

2:44:53 PM:       - AUTOBOLT\_DEFAULT\_PERMISSIONS

2:44:53 PM:       - AUTOBOLT\_WEBHOOK\_URL

2:44:53 PM:       - BASE\_URL

2:44:53 PM:       - JWT\_ACCESS\_SECRET

2:44:53 PM:       - JWT\_REFRESH\_SECRET

2:44:53 PM:       - JWT\_SECRET

2:44:53 PM:       - NEXTAUTH\_URL

2:44:53 PM:       - NEXT\_PUBLIC\_API\_BASE\_URL

2:44:53 PM:       - NEXT\_PUBLIC\_APP\_URL

2:44:53 PM:       - NEXT\_PUBLIC\_BASE\_URL

2:44:53 PM:       - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

2:44:53 PM:       - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

2:44:53 PM:       - NEXT\_PUBLIC\_GTM\_ID

2:44:53 PM:       - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

2:44:53 PM:       - NEXT\_PUBLIC\_SUPABASE\_URL

2:44:53 PM:       - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

2:44:53 PM:       - NODE\_ENV

2:44:53 PM:       - NODE\_VERSION

2:44:53 PM:       - OPENAI\_API\_KEY

2:44:53 PM:       - PUPPETEER\_EXECUTABLE\_PATH

2:44:53 PM:       - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

2:44:53 PM:       - SITE\_URL

2:44:53 PM:       - STAFF\_API\_KEY

2:44:53 PM:       - STRIPE\_CSV\_EXPORT\_PRICE\_ID

2:44:53 PM:       - STRIPE\_ENTERPRISE\_PRICE\_ID

2:44:53 PM:       - STRIPE\_GROWTH\_PRICE\_ID

2:44:53 PM:       - STRIPE\_PROFESSIONAL\_PRICE\_ID

2:44:53 PM:       - STRIPE\_PUBLISHABLE\_KEY

2:44:53 PM:       - STRIPE\_SECRET\_KEY

2:44:53 PM:       - STRIPE\_STARTER\_PRICE\_ID

2:44:53 PM:       - STRIPE\_WEBHOOK\_SECRET

2:44:53 PM:       - SUPABASE\_ANON\_KEY

2:44:53 PM:       - SUPABASE\_DATABASE\_URL

2:44:53 PM:       - SUPABASE\_JWT\_SECRET

2:44:53 PM:       - SUPABASE\_SERVICE\_ROLE\_KEY

2:44:53 PM:       - SUPABASE\_URL

2:44:53 PM:       - USER\_AGENT

2:44:53 PM:       - VAPID\_PRIVATE\_KEY

2:44:53 PM:       - WORKER\_AUTH\_TOKEN

2:44:53 PM:       - NODE\_OPTIONS

2:44:53 PM:       - NETLIFY\_BUILD\_DEBUG

2:44:53 PM:       - BUILDING

2:44:53 PM:       - NETLIFY

2:44:53 PM:     publish: /opt/build/repo/.next

2:44:53 PM:     publishOrigin: config

2:44:53 PM:   functions:

2:44:53 PM:     "\*":

2:44:53 PM:       node\_bundler: esbuild

2:44:53 PM:   functionsDirectory: /opt/build/repo/netlify/functions

2:44:53 PM:   headers:

2:44:53 PM:     - for: /api/ai/\*

&nbsp;     values:

&nbsp;       Cache-Control: no-cache, no-store, must-revalidate

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp;       X-Robots-Tag: noindex, nofollow

&nbsp;       X-XSS-Protection: 1; mode=block

&nbsp;   - for: /\*

&nbsp;     values:

&nbsp;       Permissions-Policy: camera=(), microphone=(), geolocation=()

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp;   - for: /\_next/static/\*

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=31536000, immutable

&nbsp; headersOrigin: inline

&nbsp; plugins:

&nbsp;   - inputs: {}

&nbsp;     origin: config

&nbsp;     package: "@netlify/plugin-nextjs"

&nbsp; redirects:

&nbsp;   - force: true

&nbsp;     from: /api/ai/health

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/ai-health-check

&nbsp;   - force: true

&nbsp;     from: /api/puppeteer/\*

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/puppeteer-handler

&nbsp;   - force: true

&nbsp;     from: /api/customer/validate

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/customer-validate

&nbsp;   - force: true

&nbsp;     from: /api/extension/secure-validate

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/extension-secure-validate

&nbsp;   - force: true

&nbsp;     from: /api/healthz

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/healthz

&nbsp;   - force: true

&nbsp;     from: /api/version

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/version

&nbsp;   - force: true

&nbsp;     from: /api/autobolt-status

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/autobolt-status

&nbsp;   - force: true

&nbsp;     from: /api/jobs-next

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-next

&nbsp;   - force: true

&nbsp;     from: /api/jobs-update

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-update

&nbsp;   - force: true

&nbsp;     from: /api/jobs-complete

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-complete

&nbsp;   - force: true

&nbsp;     from: /api/jobs-retry

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-retry

&nbsp;   - from: /\_next/image

&nbsp;     query:

&nbsp;       q: :quality

&nbsp;       url: :url

&nbsp;       w: :width

&nbsp;     status: 200

&nbsp;     to: /.netlify/images?url=:url\&w=:width\&q=:quality

&nbsp;   - from: /\_ipx/\*

&nbsp;     query:

&nbsp;       q: :quality

&nbsp;       url: :url

&nbsp;       w: :width

&nbsp;     status: 200

&nbsp;     to: /.netlify/images?url=:url\&w=:width\&q=:quality

&nbsp; redirectsOrigin: inline

Step completed.

2:44:53 PM: 

2:44:53 PM: (@netlify/plugin-nextjs onBuild completed in 2.3s)

2:44:53 PM: Build step duration: @netlify/plugin-nextjs onBuild completed in 2318ms

2:44:53 PM: 

2:44:53 PM: Functions bundling                                            

2:44:53 PM: ────────────────────────────────────────────────────────────────

2:44:53 PM: 

2:44:53 PM: Packaging Functions from .netlify/functions-internal directory:

2:44:53 PM:  - \_\_\_netlify-server-handler/\_\_\_netlify-server-handler.mjs

2:44:53 PM: 

2:44:53 PM: Packaging Functions from netlify/functions directory:

2:44:53 PM:  - \_supabaseClient.js

2:44:53 PM:  - ai-health-check.js

2:44:53 PM:  - autobolt-status.js

2:44:53 PM:  - create-checkout-session.js

2:44:53 PM:  - customer-validate.js

2:44:53 PM:  - extension-secure-validate.js

2:44:53 PM:  - get-session.js

2:44:53 PM:  - health-supabase.js

2:44:53 PM:  - healthz.js

2:44:53 PM:  - jobs-complete.js

2:44:53 PM:  - jobs-next.js

2:44:53 PM:  - jobs-retry.js

2:44:53 PM:  - jobs-update.js

2:44:53 PM:  - puppeteer-handler.js

2:44:53 PM:  - version.js

2:44:53 PM: 

2:45:01 PM: 

2:45:01 PM: (Functions bundling completed in 8.1s)

2:45:01 PM: Build step duration: Functions bundling completed in 8109ms

2:45:01 PM: 

2:45:01 PM: Edge Functions bundling                                       

2:45:01 PM: ────────────────────────────────────────────────────────────────

2:45:01 PM: 

2:45:01 PM: Packaging Edge Functions from netlify/edge-functions directory:

2:45:01 PM:  - performance-optimizer

2:45:01 PM:  - waf

2:45:01 PM: Local version of types is up-to-date: 68d6b4025e3ffe0008047367

2:45:02 PM: Using global installation of Deno CLI

2:45:02 PM: Using global installation of Deno CLI

2:45:02 PM: Using global installation of Deno CLI

2:45:02 PM: Edge Functions manifest: {"bundles":\[{"asset":"a59f44428b5e95056cf9cd7827667ed096c3e223e1c7cc4f90654d505165012a.eszip","format":"eszip2"}],"routes":\[{"function":"waf","pattern":"^(?:/(.\*))/?$","excluded\_patterns":\["^/\_next(?:/(.\*))/?$","^/images(?:/(.\*))/?$","^/favicon\\\\.ico/?$","^/robots\\\\.txt/?$","^/sitemap\\\\.xml/?$"],"path":"/\*"}],"post\_cache\_routes":\[{"function":"performance-optimizer","pattern":"^(?:/(.\*))/?$","excluded\_patterns":\["^/api/auth(?:/(.\*))/?$","^/api/stripe(?:/(.\*))/?$"],"path":"/\*"}],"bundler\_version":"14.5.6","layers":\[],"import\_map":"netlify:import-map","function\_config":{"performance-optimizer":{"excluded\_patterns":\["^/api/auth(?:/(.\*))/?$","^/api/stripe(?:/(.\*))/?$"]},"waf":{"excluded\_patterns":\["^/\_next(?:/(.\*))/?$","^/images(?:/(.\*))/?$","^/favicon\\\\.ico/?$","^/robots\\\\.txt/?$","^/sitemap\\\\.xml/?$"]}}}

2:45:02 PM: 

2:45:02 PM: (Edge Functions bundling completed in 1s)

2:45:02 PM: Build step duration: Edge Functions bundling completed in 1029ms

2:45:02 PM: 

2:45:02 PM: @netlify/plugin-nextjs (onPostBuild event)                    

2:45:02 PM: ────────────────────────────────────────────────────────────────

2:45:02 PM: 

2:45:02 PM: Step starting.

2:45:02 PM: Step started.

2:45:02 PM: Plugin logic started.

2:45:02 PM: Plugin logic started.

2:45:02 PM: Plugin logic started.

2:45:02 PM: Plugin logic ended.

2:45:02 PM: Plugin logic ended.

2:45:02 PM: Plugin logic ended.

2:45:02 PM: Stop closing.

2:45:02 PM: Stop closing.

2:45:02 PM: Stop closing.

2:45:02 PM: Step ended.

2:45:02 PM: 

2:45:02 PM: ❯ Updated config

2:45:02 PM:   build:

2:45:02 PM:     command: node -e "require('fs').copyFileSync('.env.netlify', '.env')" \&\& npm ci

2:45:02 PM:       --include=dev \&\& npm run optimize:pre-build \&\& npm run build

2:45:02 PM:     commandOrigin: config

2:45:02 PM:     edge\_functions: /opt/build/repo/netlify/edge-functions

2:45:02 PM:     environment:

2:45:02 PM:       - ADMIN\_API\_KEY

2:45:02 PM:       - ALLOWED\_ORIGINS

2:45:02 PM:       - AUTOBOLT\_API\_KEY

2:45:02 PM:       - AUTOBOLT\_DEFAULT\_PERMISSIONS

2:45:02 PM:       - AUTOBOLT\_WEBHOOK\_URL

2:45:02 PM:       - BASE\_URL

2:45:02 PM:       - JWT\_ACCESS\_SECRET

2:45:02 PM:       - JWT\_REFRESH\_SECRET

2:45:02 PM:       - JWT\_SECRET

2:45:02 PM:       - NEXTAUTH\_URL

2:45:02 PM:       - NEXT\_PUBLIC\_API\_BASE\_URL

2:45:02 PM:       - NEXT\_PUBLIC\_APP\_URL

2:45:02 PM:       - NEXT\_PUBLIC\_BASE\_URL

2:45:02 PM:       - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

2:45:02 PM:       - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

2:45:02 PM:       - NEXT\_PUBLIC\_GTM\_ID

2:45:02 PM:       - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

2:45:02 PM:       - NEXT\_PUBLIC\_SUPABASE\_URL

2:45:02 PM:       - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

2:45:02 PM:       - NODE\_ENV

2:45:02 PM:       - NODE\_VERSION

2:45:02 PM:       - OPENAI\_API\_KEY

2:45:02 PM:       - PUPPETEER\_EXECUTABLE\_PATH

2:45:02 PM:       - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

2:45:02 PM:       - SITE\_URL

2:45:02 PM:       - STAFF\_API\_KEY

2:45:02 PM:       - STRIPE\_CSV\_EXPORT\_PRICE\_ID

2:45:02 PM:       - STRIPE\_ENTERPRISE\_PRICE\_ID

2:45:02 PM:       - STRIPE\_GROWTH\_PRICE\_ID

2:45:02 PM:       - STRIPE\_PROFESSIONAL\_PRICE\_ID

2:45:02 PM:       - STRIPE\_PUBLISHABLE\_KEY

2:45:02 PM:       - STRIPE\_SECRET\_KEY

2:45:02 PM:       - STRIPE\_STARTER\_PRICE\_ID

2:45:02 PM:       - STRIPE\_WEBHOOK\_SECRET

2:45:02 PM:       - SUPABASE\_ANON\_KEY

2:45:02 PM:       - SUPABASE\_DATABASE\_URL

2:45:02 PM:       - SUPABASE\_JWT\_SECRET

2:45:02 PM:       - SUPABASE\_SERVICE\_ROLE\_KEY

2:45:02 PM:       - SUPABASE\_URL

2:45:02 PM:       - USER\_AGENT

2:45:02 PM:       - VAPID\_PRIVATE\_KEY

2:45:02 PM:       - WORKER\_AUTH\_TOKEN

2:45:02 PM:       - NODE\_OPTIONS

2:45:02 PM:       - NETLIFY\_BUILD\_DEBUG

2:45:02 PM:       - BUILDING

2:45:02 PM:       - NETLIFY

2:45:02 PM:     publish: /opt/build/repo/.next

2:45:02 PM:     publishOrigin: config

2:45:02 PM:   functions:

2:45:02 PM:     "\*":

2:45:02 PM:       node\_bundler: esbuild

2:45:02 PM:   functionsDirectory: /opt/build/repo/netlify/functions

2:45:02 PM:   headers:

2:45:02 PM:     - for: /static/\*

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=31536000, immutable

&nbsp;   - for: /\*.jpg

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=2592000

&nbsp;   - for: /\*.jpeg

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=2592000

&nbsp;   - for: /\*.png

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=2592000

&nbsp;   - for: /\*.webp

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=2592000

&nbsp;   - for: /\*.svg

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=2592000

&nbsp;   - for: /\*.ico

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=2592000

&nbsp;   - for: /\*.woff

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=31536000, immutable

&nbsp;   - for: /\*.woff2

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=31536000, immutable

&nbsp;   - for: /\*.ttf

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=31536000, immutable

&nbsp;   - for: /\*.eot

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=31536000, immutable

&nbsp;   - for: /site.webmanifest

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=604800

&nbsp;   - for: /robots.txt

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=604800

&nbsp;   - for: /sitemap.xml

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=604800

&nbsp;   - for: /\*

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=600

&nbsp;   - for: /\*

&nbsp;     values:

&nbsp;       Cross-Origin-Embedder-Policy: require-corp

&nbsp;       Cross-Origin-Opener-Policy: same-origin

&nbsp;       Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp;       X-XSS-Protection: 1; mode=block

&nbsp;   - for: /api/ai/\*

&nbsp;     values:

&nbsp;       Cache-Control: no-cache, no-store, must-revalidate

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp;       X-Robots-Tag: noindex, nofollow

&nbsp;       X-XSS-Protection: 1; mode=block

&nbsp;   - for: /\*

&nbsp;     values:

&nbsp;       Permissions-Policy: camera=(), microphone=(), geolocation=()

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp;   - for: /\_next/static/\*

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=31536000, immutable

&nbsp; headersOrigin: inline

&nbsp; plugins:

&nbsp;   - inputs: {}

&nbsp;     origin: config

&nbsp;     package: "@netlify/plugin-nextjs"

&nbsp; redirects:

&nbsp;   - force: true

&nbsp;     from: https://www.directorybolt.com/\*

&nbsp;     status: 301

&nbsp;     to: https://directorybolt.com/:splat

&nbsp;   - force: true

&nbsp;     from: http://directorybolt.com/\*

&nbsp;     status: 301

&nbsp;     to: https://directorybolt.com/:splat

&nbsp;   - force: true

&nbsp;     from: http://www.directorybolt.com/\*

&nbsp;     status: 301

&nbsp;     to: https://directorybolt.com/:splat

&nbsp;   - force: true

&nbsp;     from: /api/ai/health

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/ai-health-check

&nbsp;   - force: true

&nbsp;     from: /api/puppeteer/\*

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/puppeteer-handler

&nbsp;   - force: true

&nbsp;     from: /api/customer/validate

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/customer-validate

&nbsp;   - force: true

&nbsp;     from: /api/extension/secure-validate

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/extension-secure-validate

&nbsp;   - force: true

&nbsp;     from: /api/healthz

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/healthz

&nbsp;   - force: true

&nbsp;     from: /api/version

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/version

&nbsp;   - force: true

&nbsp;     from: /api/autobolt-status

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/autobolt-status

&nbsp;   - force: true

&nbsp;     from: /api/jobs-next

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-next

&nbsp;   - force: true

&nbsp;     from: /api/jobs-update

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-update

&nbsp;   - force: true

&nbsp;     from: /api/jobs-complete

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-complete

&nbsp;   - force: true

&nbsp;     from: /api/jobs-retry

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-retry

&nbsp;   - from: /\_next/image

&nbsp;     query:

&nbsp;       q: :quality

&nbsp;       url: :url

&nbsp;       w: :width

&nbsp;     status: 200

&nbsp;     to: /.netlify/images?url=:url\&w=:width\&q=:quality

&nbsp;   - from: /\_ipx/\*

&nbsp;     query:

&nbsp;       q: :quality

&nbsp;       url: :url

&nbsp;       w: :width

&nbsp;     status: 200

&nbsp;     to: /.netlify/images?url=:url\&w=:width\&q=:quality

&nbsp; redirectsOrigin: inline

Step completed.

2:45:02 PM: 

2:45:02 PM: (@netlify/plugin-nextjs onPostBuild completed in 97ms)

2:45:02 PM: Build step duration: @netlify/plugin-nextjs onPostBuild completed in 97ms

2:45:02 PM: {"passedSecretKeys":\[""],"buildDir":"/opt/build/repo"}

2:45:05 PM: {"secretsScanFoundSecrets":false,"enhancedSecretsScanFoundSecrets":false,"secretsScanMatchesCount":0,"enhancedSecretsScanMatchesCount":0,"secretsFilesCount":3282,"keysToSearchFor":\[],"enhancedPrefixMatches":\[],"enhancedScanning":true,"enhancedScanActiveMode":true}

2:45:05 PM: 

2:45:05 PM: Scanning for secrets in code and build output.                

2:45:05 PM: ────────────────────────────────────────────────────────────────

2:45:05 PM: 

2:45:05 PM: Secrets scanning complete. 3282 file(s) scanned. No secrets detected in build output or repo code!

2:45:05 PM: 

2:45:05 PM: (Secrets scanning completed in 2.1s)

2:45:05 PM: Build step duration: Secrets scanning completed in 2172ms

2:45:05 PM: Uploading 6 blobs to deploy store...

2:45:05 PM: Uploading blob L2luZGV4

2:45:05 PM: Uploading blob NDA0Lmh0bWw

2:45:05 PM: Uploading blob NTAwLmh0bWw

2:45:05 PM: Uploading blob YWRtaW4tbG9naW4uaHRtbA

2:45:05 PM: Uploading blob c3RhZmYtZGFzaGJvYXJkLmh0bWw

2:45:05 PM: Uploading blob c3RhZmYtbG9naW4uaHRtbA

2:45:05 PM: Done uploading blobs to deploy store.

2:45:05 PM: Build step duration: Uploading blobs completed in 213ms

2:45:05 PM: 

2:45:05 PM: Deploy site                                                   

2:45:05 PM: ────────────────────────────────────────────────────────────────

2:45:05 PM: 

2:45:05 PM: 

2:45:05 PM: ❯ Uploaded config

2:45:05 PM:   \[dev]

2:45:05 PM:   targetPort = 3000

2:45:05 PM: 

2:45:05 PM:   \[images]

2:45:05 PM:   remote\_images = \[

2:45:05 PM:     "^(?:http(?:s)?:\\\\/\\\\/localhost(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$",

2:45:05 PM:     "^(?:http(?:s)?:\\\\/\\\\/directorybolt\\\\.com(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$",

2:45:05 PM:     "^(?:http(?:s)?:\\\\/\\\\/images\\\\.unsplash\\\\.com(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$"

2:45:05 PM:   ]

2:45:05 PM: 

2:45:05 PM:   \[build]

2:45:05 PM:   command = "node -e \\"require('fs').copyFileSync('.env.netlify', '.env')\\" \&\& npm ci --include=dev \&\& npm run optimize:pre-build \&\& npm run build"

2:45:05 PM:   publish = ".next"

2:45:05 PM: 

2:45:05 PM:     \[build.environment]

2:45:05 PM:     NODE\_VERSION = "20.18.1"

2:45:05 PM:     PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD = "true"

2:45:05 PM:     NODE\_OPTIONS = "--max-old-space-size=4096"

2:45:05 PM:     NETLIFY\_BUILD\_DEBUG = "true"

2:45:05 PM: 

2:45:05 PM:   \[\[plugins]]

2:45:05 PM:   package = "@netlify/plugin-nextjs"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/static/\*"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=31536000, immutable"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.jpg"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=2592000"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.jpeg"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=2592000"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.png"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=2592000"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.webp"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=2592000"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.svg"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=2592000"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.ico"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=2592000"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.woff"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=31536000, immutable"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.woff2"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=31536000, immutable"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.ttf"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=31536000, immutable"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*.eot"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=31536000, immutable"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/site.webmanifest"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=604800"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/robots.txt"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=604800"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/sitemap.xml"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=604800"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=600"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cross-Origin-Opener-Policy = "same-origin"

2:45:05 PM:     Cross-Origin-Embedder-Policy = "require-corp"

2:45:05 PM:     Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"

2:45:05 PM:     X-Frame-Options = "DENY"

2:45:05 PM:     X-Content-Type-Options = "nosniff"

2:45:05 PM:     Referrer-Policy = "strict-origin-when-cross-origin"

2:45:05 PM:     X-XSS-Protection = "1; mode=block"

2:45:05 PM:     Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(self)"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/api/ai/\*"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "no-cache, no-store, must-revalidate"

2:45:05 PM:     X-Content-Type-Options = "nosniff"

2:45:05 PM:     X-Frame-Options = "DENY"

2:45:05 PM:     X-XSS-Protection = "1; mode=block"

2:45:05 PM:     Referrer-Policy = "strict-origin-when-cross-origin"

2:45:05 PM:     X-Robots-Tag = "noindex, nofollow"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\*"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     X-Frame-Options = "DENY"

2:45:05 PM:     X-Content-Type-Options = "nosniff"

2:45:05 PM:     Referrer-Policy = "strict-origin-when-cross-origin"

2:45:05 PM:     Permissions-Policy = "camera=(), microphone=(), geolocation=()"

2:45:05 PM: 

2:45:05 PM:   \[\[headers]]

2:45:05 PM:   for = "/\_next/static/\*"

2:45:05 PM: 

2:45:05 PM:     \[headers.values]

2:45:05 PM:     Cache-Control = "public, max-age=31536000, immutable"

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "https://www.directorybolt.com/\*"

2:45:05 PM:   to = "https://directorybolt.com/:splat"

2:45:05 PM:   status = 301

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "http://directorybolt.com/\*"

2:45:05 PM:   to = "https://directorybolt.com/:splat"

2:45:05 PM:   status = 301

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "http://www.directorybolt.com/\*"

2:45:05 PM:   to = "https://directorybolt.com/:splat"

2:45:05 PM:   status = 301

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/ai/health"

2:45:05 PM:   to = "/.netlify/functions/ai-health-check"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/puppeteer/\*"

2:45:05 PM:   to = "/.netlify/functions/puppeteer-handler"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/customer/validate"

2:45:05 PM:   to = "/.netlify/functions/customer-validate"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/extension/secure-validate"

2:45:05 PM:   to = "/.netlify/functions/extension-secure-validate"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/healthz"

2:45:05 PM:   to = "/.netlify/functions/healthz"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/version"

2:45:05 PM:   to = "/.netlify/functions/version"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/autobolt-status"

2:45:05 PM:   to = "/.netlify/functions/autobolt-status"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/jobs-next"

2:45:05 PM:   to = "/.netlify/functions/jobs-next"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/jobs-update"

2:45:05 PM:   to = "/.netlify/functions/jobs-update"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/jobs-complete"

2:45:05 PM:   to = "/.netlify/functions/jobs-complete"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/api/jobs-retry"

2:45:05 PM:   to = "/.netlify/functions/jobs-retry"

2:45:05 PM:   status = 200

2:45:05 PM:   force = true

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/\_next/image"

2:45:05 PM:   to = "/.netlify/images?url=:url\&w=:width\&q=:quality"

2:45:05 PM:   status = 200

2:45:05 PM: 

2:45:05 PM:     \[redirects.query]

2:45:05 PM:     url = ":url"

2:45:05 PM:     w = ":width"

2:45:05 PM:     q = ":quality"

2:45:05 PM: 

2:45:05 PM:   \[\[redirects]]

2:45:05 PM:   from = "/\_ipx/\*"

2:45:05 PM:   to = "/.netlify/images?url=:url\&w=:width\&q=:quality"

2:45:05 PM:   status = 200

2:45:05 PM: 

2:45:05 PM:     \[redirects.query]

2:45:05 PM:     url = ":url"

2:45:05 PM:     w = ":width"

2:45:05 PM:     q = ":quality"

2:45:05 PM: 

2:45:05 PM:   \[context]

2:45:05 PM: 

2:45:05 PM:     \[context.production]

2:45:05 PM: 

2:45:05 PM:       \[context.production.environment]

2:45:05 PM:       NODE\_ENV = "production"

2:45:05 PM:       BUILDING = "true"

2:45:05 PM:       NETLIFY = "true"

2:45:05 PM: 

2:45:05 PM:       \[context.production.images]

2:45:05 PM:       remote\_images = \[

2:45:05 PM:         "^(?:http(?:s)?:\\\\/\\\\/localhost(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$",

2:45:05 PM:         "^(?:http(?:s)?:\\\\/\\\\/directorybolt\\\\.com(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$",

2:45:05 PM:         "^(?:http(?:s)?:\\\\/\\\\/images\\\\.unsplash\\\\.com(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$"

2:45:05 PM:       ]

2:45:05 PM: 

2:45:05 PM:       \[\[context.production.headers]]

2:45:05 PM:       for = "/api/ai/\*"

2:45:05 PM: 

2:45:05 PM:         \[context.production.headers.values]

2:45:05 PM:         Cache-Control = "no-cache, no-store, must-revalidate"

2:45:05 PM:         X-Content-Type-Options = "nosniff"

2:45:05 PM:         X-Frame-Options = "DENY"

2:45:05 PM:         X-XSS-Protection = "1; mode=block"

2:45:05 PM:         Referrer-Policy = "strict-origin-when-cross-origin"

2:45:05 PM:         X-Robots-Tag = "noindex, nofollow"

2:45:05 PM: 

2:45:05 PM:       \[\[context.production.headers]]

2:45:05 PM:       for = "/\*"

2:45:05 PM: 

2:45:05 PM:         \[context.production.headers.values]

2:45:05 PM:         X-Frame-Options = "DENY"

2:45:05 PM:         X-Content-Type-Options = "nosniff"

2:45:05 PM:         Referrer-Policy = "strict-origin-when-cross-origin"

2:45:05 PM:         Permissions-Policy = "camera=(), microphone=(), geolocation=()"

2:45:05 PM: 

2:45:05 PM:       \[\[context.production.headers]]

2:45:05 PM:       for = "/\_next/static/\*"

2:45:05 PM: 

2:45:05 PM:         \[context.production.headers.values]

2:45:05 PM:         Cache-Control = "public, max-age=31536000, immutable"

2:45:05 PM: 

2:45:05 PM:     \[context.deploy-preview]

2:45:05 PM: 

2:45:05 PM:       \[context.deploy-preview.environment]

2:45:05 PM:       NODE\_ENV = "development"

2:45:05 PM:       BUILDING = "true"

2:45:05 PM:       NETLIFY = "true"

2:45:05 PM: 

2:45:05 PM:     \[context.branch-deploy]

2:45:05 PM: 

2:45:05 PM:       \[context.branch-deploy.environment]

2:45:05 PM:       NODE\_ENV = "development"

2:45:05 PM:       BUILDING = "true"

2:45:05 PM:       NETLIFY = "true"

2:45:05 PM: 

2:45:05 PM:     \[context.main]

2:45:05 PM: Starting to deploy site from '.next'

2:45:05 PM: 

2:45:05 PM:       \[context.main.images]

2:45:05 PM:       remote\_images = \[

2:45:05 PM:         "^(?:http(?:s)?:\\\\/\\\\/localhost(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$",

2:45:05 PM:         "^(?:http(?:s)?:\\\\/\\\\/directorybolt\\\\.com(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$",

2:45:05 PM:         "^(?:http(?:s)?:\\\\/\\\\/images\\\\.unsplash\\\\.com(?:\\\\/(?!\\\\.)(?:(?:(?!(?:^|\\\\/)\\\\.).)\*?)|$))$"

2:45:05 PM:       ]

2:45:05 PM: 

2:45:05 PM:       \[\[context.main.headers]]

2:45:05 PM:       for = "/api/ai/\*"

2:45:05 PM: 

2:45:05 PM:         \[context.main.headers.values]

2:45:05 PM:         Cache-Control = "no-cache, no-store, must-revalidate"

2:45:05 PM:         X-Content-Type-Options = "nosniff"

2:45:05 PM:         X-Frame-Options = "DENY"

2:45:05 PM:         X-XSS-Protection = "1; mode=block"

2:45:05 PM:         Referrer-Policy = "strict-origin-when-cross-origin"

2:45:05 PM:         X-Robots-Tag = "noindex, nofollow"

2:45:05 PM: 

2:45:05 PM:       \[\[context.main.headers]]

2:45:05 PM:       for = "/\*"

2:45:05 PM: 

2:45:05 PM:         \[context.main.headers.values]

2:45:05 PM:         X-Frame-Options = "DENY"

2:45:05 PM:         X-Content-Type-Options = "nosniff"

2:45:05 PM:         Referrer-Policy = "strict-origin-when-cross-origin"

2:45:05 PM:         Permissions-Policy = "camera=(), microphone=(), geolocation=()"

2:45:05 PM: 

2:45:05 PM:       \[\[context.main.headers]]

2:45:05 PM:       for = "/\_next/static/\*"

2:45:05 PM: 

2:45:05 PM:         \[context.main.headers.values]

2:45:05 PM:         Cache-Control = "public, max-age=31536000, immutable"

2:45:05 PM: 

2:45:05 PM: ❯ Uploaded headers

2:45:05 PM:   No headers

2:45:05 PM: 

2:45:05 PM: ❯ Uploaded redirects

2:45:05 PM:   No redirects

2:45:05 PM: 

2:45:05 PM: Calculating files to upload

2:45:06 PM: 3 new file(s) to upload

2:45:06 PM: 14 new function(s) to upload

2:45:18 PM: Post processing - header rules

2:45:18 PM: Post processing done

2:45:18 PM: Section completed: postprocessing

2:45:18 PM: Skipping form detection

2:45:18 PM: Starting post processing

2:45:18 PM: Post processing - redirect rules

2:45:18 PM: Section completed: deploying

2:45:20 PM: Site is live ✨

2:45:20 PM: Finished waiting for live deploy in 2.059s

2:45:20 PM: Site deploy was successfully initiated

2:45:20 PM: 

2:45:20 PM: (Deploy site completed in 15.5s)

2:45:20 PM: Build step duration: Deploy site completed in 15514ms

2:45:20 PM: 

2:45:20 PM: @netlify/plugin-nextjs (onSuccess event)                      

2:45:20 PM: ────────────────────────────────────────────────────────────────

2:45:20 PM: 

2:45:20 PM: Step starting.

2:45:20 PM: Step started.

2:45:20 PM: Plugin logic started.

2:45:20 PM: Plugin logic started.

2:45:20 PM: Plugin logic started.

2:45:20 PM: Plugin logic started.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Step ended.

2:45:24 PM: Step completed.

2:45:24 PM: 

2:45:24 PM: (@netlify/plugin-nextjs onSuccess completed in 3.6s)

2:45:24 PM: Build step duration: @netlify/plugin-nextjs onSuccess completed in 3699ms

2:45:24 PM: (node:1961) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 unpipe listeners added to \[Socket]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit

2:45:24 PM: (Use `node --trace-warnings ...` to show where the warning was created)

2:45:24 PM: (node:1961) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 error listeners added to \[Socket]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit

2:45:24 PM: (node:1961) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 close listeners added to \[Socket]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit

2:45:24 PM: (node:1961) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 finish listeners added to \[Socket]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit

2:45:24 PM: (node:1961) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 unpipe listeners added to \[Socket]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit

2:45:24 PM: (node:1961) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 error listeners added to \[Socket]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit

2:45:24 PM: (node:1961) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 close listeners added to \[Socket]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit

2:45:24 PM: (node:1961) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 finish listeners added to \[Socket]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit

2:45:24 PM: 

2:45:24 PM: @netlify/plugin-nextjs (onEnd event)                          

2:45:24 PM: ────────────────────────────────────────────────────────────────

2:45:24 PM: 

2:45:24 PM: Step starting.

2:45:24 PM: Step started.

2:45:24 PM: Plugin logic started.

2:45:24 PM: Plugin logic started.

2:45:24 PM: Plugin logic started.

2:45:24 PM: Plugin logic started.

2:45:24 PM: Plugin logic started.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Plugin logic ended.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Step ended.

2:45:24 PM: 

2:45:24 PM: ❯ Updated config

2:45:24 PM:   build:

2:45:24 PM:     command: node -e "require('fs').copyFileSync('.env.netlify', '.env')" \&\& npm ci

2:45:24 PM:       --include=dev \&\& npm run optimize:pre-build \&\& npm run build

2:45:24 PM:     commandOrigin: config

2:45:24 PM:     edge\_functions: /opt/build/repo/netlify/edge-functions

2:45:24 PM:     environment:

2:45:24 PM:       - ADMIN\_API\_KEY

2:45:24 PM:       - ALLOWED\_ORIGINS

2:45:24 PM:       - AUTOBOLT\_API\_KEY

2:45:24 PM:       - AUTOBOLT\_DEFAULT\_PERMISSIONS

2:45:24 PM:       - AUTOBOLT\_WEBHOOK\_URL

2:45:24 PM:       - BASE\_URL

2:45:24 PM:       - JWT\_ACCESS\_SECRET

2:45:24 PM:       - JWT\_REFRESH\_SECRET

2:45:24 PM:       - JWT\_SECRET

2:45:24 PM:       - NEXTAUTH\_URL

2:45:24 PM:       - NEXT\_PUBLIC\_API\_BASE\_URL

2:45:24 PM:       - NEXT\_PUBLIC\_APP\_URL

2:45:24 PM:       - NEXT\_PUBLIC\_BASE\_URL

2:45:24 PM:       - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

2:45:24 PM:       - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

2:45:24 PM:       - NEXT\_PUBLIC\_GTM\_ID

2:45:24 PM:       - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

2:45:24 PM:       - NEXT\_PUBLIC\_SUPABASE\_URL

2:45:24 PM:       - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

2:45:24 PM:       - NODE\_ENV

2:45:24 PM:       - NODE\_VERSION

2:45:24 PM:       - OPENAI\_API\_KEY

2:45:24 PM:       - PUPPETEER\_EXECUTABLE\_PATH

2:45:24 PM:       - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

2:45:24 PM:       - SITE\_URL

2:45:24 PM:       - STAFF\_API\_KEY

2:45:24 PM:       - STRIPE\_CSV\_EXPORT\_PRICE\_ID

2:45:24 PM:       - STRIPE\_ENTERPRISE\_PRICE\_ID

2:45:24 PM:       - STRIPE\_GROWTH\_PRICE\_ID

2:45:24 PM:       - STRIPE\_PROFESSIONAL\_PRICE\_ID

2:45:24 PM:       - STRIPE\_PUBLISHABLE\_KEY

2:45:24 PM:       - STRIPE\_SECRET\_KEY

2:45:24 PM:       - STRIPE\_STARTER\_PRICE\_ID

2:45:24 PM:       - STRIPE\_WEBHOOK\_SECRET

2:45:24 PM:       - SUPABASE\_ANON\_KEY

2:45:24 PM:       - SUPABASE\_DATABASE\_URL

2:45:24 PM:       - SUPABASE\_JWT\_SECRET

2:45:24 PM:       - SUPABASE\_SERVICE\_ROLE\_KEY

2:45:24 PM:       - SUPABASE\_URL

2:45:24 PM:       - USER\_AGENT

2:45:24 PM:       - VAPID\_PRIVATE\_KEY

2:45:24 PM:       - WORKER\_AUTH\_TOKEN

2:45:24 PM:       - NODE\_OPTIONS

2:45:24 PM:       - NETLIFY\_BUILD\_DEBUG

2:45:24 PM:       - BUILDING

2:45:24 PM:       - NETLIFY

2:45:24 PM:     publish: /opt/build/repo/.next

2:45:24 PM:     publishOrigin: config

2:45:24 PM:   functions:

2:45:24 PM:     "\*":

2:45:24 PM:       node\_bundler: esbuild

2:45:24 PM:   functionsDirectory: /opt/build/repo/netlify/functions

2:45:24 PM:   headers:

2:45:24 PM:     - for: /api/ai/\*

&nbsp;     values:

&nbsp;       Cache-Control: no-cache, no-store, must-revalidate

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp;       X-Robots-Tag: noindex, nofollow

&nbsp;       X-XSS-Protection: 1; mode=block

&nbsp;   - for: /\*

&nbsp;     values:

&nbsp;       Permissions-Policy: camera=(), microphone=(), geolocation=()

&nbsp;       Referrer-Policy: strict-origin-when-cross-origin

&nbsp;       X-Content-Type-Options: nosniff

&nbsp;       X-Frame-Options: DENY

&nbsp;   - for: /\_next/static/\*

&nbsp;     values:

&nbsp;       Cache-Control: public, max-age=31536000, immutable

&nbsp; headersOrigin: inline

&nbsp; plugins:

&nbsp;   - inputs: {}

&nbsp;     origin: config

&nbsp;     package: "@netlify/plugin-nextjs"

&nbsp; redirects:

&nbsp;   - force: true

&nbsp;     from: /api/ai/health

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/ai-health-check

&nbsp;   - force: true

&nbsp;     from: /api/puppeteer/\*

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/puppeteer-handler

&nbsp;   - force: true

&nbsp;     from: /api/customer/validate

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/customer-validate

&nbsp;   - force: true

&nbsp;     from: /api/extension/secure-validate

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/extension-secure-validate

&nbsp;   - force: true

&nbsp;     from: /api/healthz

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/healthz

&nbsp;   - force: true

&nbsp;     from: /api/version

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/version

&nbsp;   - force: true

&nbsp;     from: /api/autobolt-status

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/autobolt-status

&nbsp;   - force: true

&nbsp;     from: /api/jobs-next

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-next

&nbsp;   - force: true

&nbsp;     from: /api/jobs-update

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-update

&nbsp;   - force: true

&nbsp;     from: /api/jobs-complete

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-complete

&nbsp;   - force: true

&nbsp;     from: /api/jobs-retry

&nbsp;     status: 200

&nbsp;     to: /.netlify/functions/jobs-retry

&nbsp;   - from: /\_next/image

&nbsp;     query:

&nbsp;       q: :quality

&nbsp;       url: :url

&nbsp;       w: :width

&nbsp;     status: 200

&nbsp;     to: /.netlify/images?url=:url\&w=:width\&q=:quality

&nbsp;   - from: /\_ipx/\*

&nbsp;     query:

&nbsp;       q: :quality

&nbsp;       url: :url

&nbsp;       w: :width

&nbsp;     status: 200

&nbsp;     to: /.netlify/images?url=:url\&w=:width\&q=:quality

&nbsp; redirectsOrigin: inline

Step completed.

2:45:24 PM: 

2:45:24 PM: (@netlify/plugin-nextjs onEnd completed in 94ms)

2:45:24 PM: Build step duration: @netlify/plugin-nextjs onEnd completed in 94ms

2:45:24 PM: Step starting.

2:45:24 PM: Step starting.

2:45:24 PM: Step started.

2:45:24 PM: Step started.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Stop closing.

2:45:24 PM: Step ended.

2:45:25 PM: Step ended.

2:45:25 PM: 

2:45:25 PM: Netlify Build Complete                                        

2:45:25 PM: ────────────────────────────────────────────────────────────────

2:45:25 PM: 

2:45:25 PM: (Netlify Build completed in 1m 40.8s)

2:45:25 PM: Build step duration: Netlify Build completed in 100861ms

2:45:25 PM: Caching artifacts

2:45:25 PM: Started saving node modules

2:45:25 PM: Finished saving node modules

2:45:25 PM: Started saving build plugins

2:45:25 PM: Finished saving build plugins

2:45:25 PM: Started saving bun cache

2:45:25 PM: Finished saving bun cache

2:45:25 PM: Started saving go cache

2:45:25 PM: Finished saving go cache

2:45:25 PM: Started saving python cache

2:45:25 PM: Finished saving python cache

2:45:25 PM: Started saving ruby cache

2:45:25 PM: Finished saving ruby cache

2:45:25 PM: Started saving corepack cache

2:45:25 PM: Finished saving corepack cache

2:45:25 PM: Started saving emacs cask dependencies

2:45:25 PM: Finished saving emacs cask dependencies

2:45:25 PM: Started saving maven dependencies

2:45:25 PM: Finished saving maven dependencies

2:45:25 PM: Started saving boot dependencies

2:45:25 PM: Finished saving boot dependencies

2:45:25 PM: Started saving rust rustup cache

2:45:25 PM: Finished saving rust rustup cache

2:45:25 PM: Build script success

2:45:25 PM: Section completed: building

2:45:33 PM: Uploading Cache of size 641.1MB

2:45:34 PM: Section completed: cleanup

2:45:34 PM: Finished processing build request in 2m10.051s"

&nbsp;       ],

&nbsp;       "notes": "This is the last known good deploy log from Netlify."

&nbsp;     },

&nbsp;     {

&nbsp;       "name": "Failed Netlify build log",

&nbsp;       "path": "logs/fail.log",

&nbsp;       "contents": \[

&nbsp;         "7:23:34 AM: build-image version: e8c4c0b200e9701a8a8825b9ff63ea7e9f1740e2 (noble)

7:23:34 AM: buildbot version: a8227f684d13e2f14c4dff2ff89b1b5fbedbc9d9

7:23:34 AM: Fetching cached dependencies

7:23:34 AM: Starting to download cache of 641.1MB (Last modified: 2025-09-26 20:45:34 +0000 UTC)

7:23:35 AM: Finished downloading cache in 1.044s

7:23:35 AM: Starting to extract cache

7:23:42 AM: Finished extracting cache in 7.159s

7:23:42 AM: Finished fetching cache in 8.291s

7:23:42 AM: Starting to prepare the repo for build

7:23:42 AM: Preparing Git Reference refs/heads/main

7:23:44 AM: Custom edge functions path detected. Proceeding with the specified path: 'netlify/edge-functions'

7:23:44 AM: Custom build command detected. Proceeding with the specified command: 'npm run build'

7:23:45 AM: Starting to install dependencies

7:23:45 AM: Started restoring cached python cache

7:23:45 AM: Finished restoring cached python cache

7:23:45 AM: Started restoring cached ruby cache

7:23:46 AM: Finished restoring cached ruby cache

7:23:46 AM: Started restoring cached go cache

7:23:46 AM: Finished restoring cached go cache

7:23:47 AM: Started restoring cached Node.js version

7:23:47 AM: Finished restoring cached Node.js version

7:23:47 AM: Attempting Node.js version '18' from .nvmrc

7:23:48 AM: Downloading and installing node v18.20.8...

7:23:48 AM: Downloading https://nodejs.org/dist/v18.20.8/node-v18.20.8-linux-x64.tar.xz...

7:23:48 AM: Computing checksum with sha256sum

7:23:48 AM: Checksums matched!

7:23:50 AM: Now using node v18.20.8 (npm v10.8.2)

7:23:51 AM: Enabling Node.js Corepack

7:23:51 AM: Started restoring cached build plugins

7:23:51 AM: Finished restoring cached build plugins

7:23:51 AM: WARNING: The environment variable 'NODE\_ENV' is set to 'production'. Any 'devDependencies' in package.json will not be installed

7:23:51 AM: Started restoring cached corepack dependencies

7:23:51 AM: Finished restoring cached corepack dependencies

7:23:51 AM: No npm workspaces detected

7:23:51 AM: Started restoring cached node modules

7:23:51 AM: Finished restoring cached node modules

7:23:51 AM: Installing npm packages using npm version 10.8.2

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'directorybolt@2.0.1-emergency-fix',

7:23:52 AM: npm warn EBADENGINE required: { node: '>=20.18.1', npm: '>=8.0.0' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'lru-cache@11.2.2',

7:23:52 AM: npm warn EBADENGINE required: { node: '20 || >=22' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'cheerio@1.1.2',

7:23:52 AM: npm warn EBADENGINE required: { node: '>=20.18.1' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'cssstyle@5.3.1',

7:23:52 AM: npm warn EBADENGINE required: { node: '>=20' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'data-urls@6.0.0',

7:23:52 AM: npm warn EBADENGINE required: { node: '>=20' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'jsdom@27.0.0',

7:23:52 AM: npm warn EBADENGINE required: { node: '>=20' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'lru-cache@11.2.2',

7:23:52 AM: npm warn EBADENGINE required: { node: '20 || >=22' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'tr46@6.0.0',

7:23:52 AM: npm warn EBADENGINE required: { node: '>=20' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'webidl-conversions@8.0.0',

7:23:52 AM: npm warn EBADENGINE required: { node: '>=20' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'whatwg-url@15.1.0',

7:23:52 AM: npm warn EBADENGINE required: { node: '>=20' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:23:52 AM: npm warn EBADENGINE Unsupported engine {

7:23:52 AM: npm warn EBADENGINE package: 'null-prototype-object@1.2.3',

7:23:52 AM: npm warn EBADENGINE required: { node: '>= 20' },

7:23:52 AM: npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }

7:23:52 AM: npm warn EBADENGINE }

7:24:06 AM: added 11 packages, removed 20 packages, and changed 117 packages in 15s

7:24:06 AM: npm packages installed

7:24:06 AM: Successfully installed dependencies

7:24:06 AM: Starting build script

7:24:07 AM: Detected 1 framework(s)

7:24:07 AM: "next" at version "14.2.33"

7:24:07 AM: Section completed: initializing

7:24:08 AM: 

7:24:08 AM: Netlify Build

7:24:08 AM: ────────────────────────────────────────────────────────────────

7:24:08 AM: 

7:24:08 AM: ❯ Version

7:24:08 AM: @netlify/build 35.1.8

7:24:08 AM: 

7:24:08 AM: ❯ Flags

7:24:08 AM: accountId: 685d5c82966d03cf5d38aef7

7:24:08 AM: apiHost: api.netlify.com

7:24:08 AM: baseRelDir: true

7:24:08 AM: branch: main

7:24:08 AM: buildId: 68da88553f18a90008f384d1

7:24:08 AM: buildbotServerSocket: /tmp/netlify-buildbot-socket

7:24:08 AM: cacheDir: /opt/build/cache

7:24:08 AM: cachedConfigPath: /tmp/netlify\_config.json

7:24:08 AM: context: production

7:24:08 AM: cwd: /opt/build/repo

7:24:08 AM: deployId: 68da88553f18a90008f384d3

7:24:08 AM: edgeFunctionsDistDir: /tmp/edge-68da88553f18a90008f384d3

7:24:08 AM: enhancedSecretScan: true

7:24:08 AM: featureFlags:

7:24:08 AM: - netlify\_build\_updated\_plugin\_compatibility

7:24:08 AM: framework: next

7:24:08 AM: functionsDistDir: /tmp/zisi-68da88553f18a90008f384d3

7:24:08 AM: mode: buildbot

7:24:08 AM: nodePath: /opt/buildhome/.nvm/versions/node/v18.20.8/bin/node

7:24:08 AM: repositoryRoot: /opt/build/repo

7:24:08 AM: saveConfig: true

7:24:08 AM: sendStatus: true

7:24:08 AM: siteId: d6821c31-a428-4b54-95e3-d92176e487e6

7:24:08 AM: statsd:

7:24:08 AM: host: 10.71.157.179

7:24:08 AM: port: 8125

7:24:08 AM: systemLogFile: 3

7:24:08 AM: testOpts:

7:24:08 AM: silentLingeringProcesses: ""

7:24:08 AM: tracing:

7:24:08 AM: baggageFilePath: /tmp/baggage.dump

7:24:08 AM: enabled: "true"

7:24:08 AM: host: 10.71.157.179

7:24:08 AM: parentSpanId: fadca87b3c05ddfc

7:24:08 AM: preloadingEnabled: "true"

7:24:08 AM: sampleRate: 4

7:24:08 AM: traceFlags: "00"

7:24:08 AM: traceId: 3942896a325e8ef85f7e3c7547286c19

7:24:08 AM: 

7:24:08 AM: ❯ UI build settings

7:24:08 AM: baseRelDir: true

7:24:08 AM: build:

7:24:08 AM: command: node -e "require('fs').copyFileSync('.env.netlify', '.env')" \&\& npm ci

7:24:08 AM: --include=dev \&\& npm run optimize:pre-build \&\& npm run build

7:24:08 AM: environment:

7:24:08 AM: - ADMIN\_API\_KEY

7:24:08 AM: - ALLOWED\_ORIGINS

7:24:08 AM: - AUTOBOLT\_API\_KEY

7:24:08 AM: - AUTOBOLT\_DEFAULT\_PERMISSIONS

7:24:08 AM: - AUTOBOLT\_WEBHOOK\_URL

7:24:08 AM: - BASE\_URL

7:24:08 AM: - JWT\_ACCESS\_SECRET

7:24:08 AM: - JWT\_REFRESH\_SECRET

7:24:08 AM: - JWT\_SECRET

7:24:08 AM: - NEXTAUTH\_URL

7:24:08 AM: - NEXT\_PUBLIC\_API\_BASE\_URL

7:24:08 AM: - NEXT\_PUBLIC\_APP\_URL

7:24:08 AM: - NEXT\_PUBLIC\_BASE\_URL

7:24:08 AM: - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

7:24:08 AM: - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

7:24:08 AM: - NEXT\_PUBLIC\_GTM\_ID

7:24:08 AM: - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

7:24:08 AM: - NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY

7:24:08 AM: - NEXT\_PUBLIC\_SUPABASE\_URL

7:24:08 AM: - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

7:24:08 AM: - NODE\_ENV

7:24:08 AM: - NODE\_VERSION

7:24:08 AM: - OPENAI\_API\_KEY

7:24:08 AM: - PUPPETEER\_EXECUTABLE\_PATH

7:24:08 AM: - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

7:24:08 AM: - SITE\_URL

7:24:08 AM: - STAFF\_API\_KEY

7:24:08 AM: - STRIPE\_CSV\_EXPORT\_PRICE\_ID

7:24:08 AM: - STRIPE\_ENTERPRISE\_PRICE\_ID

7:24:08 AM: - STRIPE\_GROWTH\_PRICE\_ID

7:24:08 AM: - STRIPE\_PROFESSIONAL\_PRICE\_ID

7:24:08 AM: - STRIPE\_PUBLISHABLE\_KEY

7:24:08 AM: - STRIPE\_SECRET\_KEY

7:24:08 AM: - STRIPE\_STARTER\_PRICE\_ID

7:24:08 AM: - STRIPE\_WEBHOOK\_SECRET

7:24:08 AM: - SUPABASE\_ANON\_KEY

7:24:08 AM: - SUPABASE\_DATABASE\_URL

7:24:08 AM: - SUPABASE\_JWT\_SECRET

7:24:08 AM: - SUPABASE\_SERVICE\_ROLE\_KEY

7:24:08 AM: - SUPABASE\_URL

7:24:08 AM: - USER\_AGENT

7:24:08 AM: - VAPID\_PRIVATE\_KEY

7:24:08 AM: - WORKER\_AUTH\_TOKEN

7:24:08 AM: publish: .next

7:24:08 AM: plugins:

7:24:08 AM: - inputs: {}

7:24:08 AM: package: "@netlify/plugin-nextjs"

7:24:09 AM: 

7:24:09 AM: ❯ Resolved build environment

7:24:09 AM: branch: main

7:24:09 AM: buildDir: /opt/build/repo

7:24:09 AM: configPath: /opt/build/repo/netlify.toml

7:24:09 AM: context: production

7:24:09 AM: env: \[]

7:24:09 AM: 

7:24:09 AM: ❯ Resolved config

7:24:09 AM: build:

7:24:09 AM: command: npm run build

7:24:09 AM: commandOrigin: config

7:24:09 AM: edge\_functions: /opt/build/repo/netlify/edge-functions

7:24:09 AM: environment:

7:24:09 AM: - ADMIN\_API\_KEY

7:24:09 AM: - ALLOWED\_ORIGINS

7:24:09 AM: - AUTOBOLT\_API\_KEY

7:24:09 AM: - AUTOBOLT\_DEFAULT\_PERMISSIONS

7:24:09 AM: - AUTOBOLT\_WEBHOOK\_URL

7:24:09 AM: - BASE\_URL

7:24:09 AM: - JWT\_ACCESS\_SECRET

7:24:09 AM: - JWT\_REFRESH\_SECRET

7:24:09 AM: - JWT\_SECRET

7:24:09 AM: - NEXTAUTH\_URL

7:24:09 AM: - NEXT\_PUBLIC\_API\_BASE\_URL

7:24:09 AM: - NEXT\_PUBLIC\_APP\_URL

7:24:09 AM: - NEXT\_PUBLIC\_BASE\_URL

7:24:09 AM: - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

7:24:09 AM: - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

7:24:09 AM: - NEXT\_PUBLIC\_GTM\_ID

7:24:09 AM: - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

7:24:09 AM: - NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY

7:24:09 AM: - NEXT\_PUBLIC\_SUPABASE\_URL

7:24:09 AM: - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

7:24:09 AM: - NODE\_ENV

7:24:09 AM: - NODE\_VERSION

7:24:09 AM: - OPENAI\_API\_KEY

7:24:09 AM: - PUPPETEER\_EXECUTABLE\_PATH

7:24:09 AM: - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

7:24:09 AM: - SITE\_URL

7:24:09 AM: - STAFF\_API\_KEY

7:24:09 AM: - STRIPE\_CSV\_EXPORT\_PRICE\_ID

7:24:09 AM: - STRIPE\_ENTERPRISE\_PRICE\_ID

7:24:09 AM: - STRIPE\_GROWTH\_PRICE\_ID

7:24:09 AM: - STRIPE\_PROFESSIONAL\_PRICE\_ID

7:24:09 AM: - STRIPE\_PUBLISHABLE\_KEY

7:24:09 AM: - STRIPE\_SECRET\_KEY

7:24:09 AM: - STRIPE\_STARTER\_PRICE\_ID

7:24:09 AM: - STRIPE\_WEBHOOK\_SECRET

7:24:09 AM: - SUPABASE\_ANON\_KEY

7:24:09 AM: - SUPABASE\_DATABASE\_URL

7:24:09 AM: - SUPABASE\_JWT\_SECRET

7:24:09 AM: - SUPABASE\_SERVICE\_ROLE\_KEY

7:24:09 AM: - SUPABASE\_URL

7:24:09 AM: - USER\_AGENT

7:24:09 AM: - VAPID\_PRIVATE\_KEY

7:24:09 AM: - WORKER\_AUTH\_TOKEN

7:24:09 AM: - NODE\_OPTIONS

7:24:09 AM: - NETLIFY\_BUILD\_DEBUG

7:24:09 AM: - NEXT\_DISABLE\_ESLINT

7:24:09 AM: - BUILDING

7:24:09 AM: - NETLIFY

7:24:09 AM: publish: /opt/build/repo/.next

7:24:09 AM: publishOrigin: config

7:24:09 AM: functions:

7:24:09 AM: "\*":

7:24:09 AM: node\_bundler: esbuild

7:24:09 AM: functionsDirectory: /opt/build/repo/netlify/functions

7:24:09 AM: headers:

7:24:09 AM: - for: /api/ai/\*

values:

Cache-Control: no-cache, no-store, must-revalidate

Referrer-Policy: strict-origin-when-cross-origin

X-Content-Type-Options: nosniff

X-Frame-Options: DENY

X-Robots-Tag: noindex, nofollow

X-XSS-Protection: 1; mode=block

\- for: /\*

values:

Permissions-Policy: camera=(), microphone=(), geolocation=()

Referrer-Policy: strict-origin-when-cross-origin

X-Content-Type-Options: nosniff

X-Frame-Options: DENY

headersOrigin: config

plugins:

\- inputs: {}

origin: config

package: "@netlify/plugin-nextjs"

redirects:

\- force: true

from: /api/ai/health

status: 200

to: /.netlify/functions/ai-health-check

\- force: true

from: /api/puppeteer/\*

status: 200

to: /.netlify/functions/puppeteer-handler

\- force: true

from: /api/customer/validate

status: 200

to: /.netlify/functions/customer-validate

\- force: true

from: /api/extension/secure-validate

status: 200

to: /.netlify/functions/extension-secure-validate

\- force: true

from: /api/healthz

status: 200

to: /.netlify/functions/healthz

\- force: true

from: /api/version

status: 200

to: /.netlify/functions/version

\- force: true

from: /api/autobolt-status

status: 200

to: /.netlify/functions/autobolt-status

\- force: true

from: /api/jobs-next

status: 200

to: /.netlify/functions/jobs-next

\- force: true

from: /api/jobs-update

status: 200

to: /.netlify/functions/jobs-update

\- force: true

from: /api/jobs-complete

status: 200

to: /.netlify/functions/jobs-complete

\- force: true

from: /api/jobs-retry

status: 200

to: /.netlify/functions/jobs-retry

redirectsOrigin: config



7:24:09 AM: ❯ Current directory

7:24:09 AM: /opt/build/repo

7:24:09 AM: 

7:24:09 AM: ❯ Config file

7:24:09 AM: /opt/build/repo/netlify.toml

7:24:09 AM: 

7:24:09 AM: ❯ Resolved config

7:24:09 AM: build:

7:24:09 AM: command: npm run build

7:24:09 AM: commandOrigin: config

7:24:09 AM: edge\_functions: /opt/build/repo/netlify/edge-functions

7:24:09 AM: environment:

7:24:09 AM: - ADMIN\_API\_KEY

7:24:09 AM: - ALLOWED\_ORIGINS

7:24:09 AM: - AUTOBOLT\_API\_KEY

7:24:09 AM: - AUTOBOLT\_DEFAULT\_PERMISSIONS

7:24:09 AM: - AUTOBOLT\_WEBHOOK\_URL

7:24:09 AM: - BASE\_URL

7:24:09 AM: - JWT\_ACCESS\_SECRET

7:24:09 AM: - JWT\_REFRESH\_SECRET

7:24:09 AM: - JWT\_SECRET

7:24:09 AM: - NEXTAUTH\_URL

7:24:09 AM: - NEXT\_PUBLIC\_API\_BASE\_URL

7:24:09 AM: - NEXT\_PUBLIC\_APP\_URL

7:24:09 AM: - NEXT\_PUBLIC\_BASE\_URL

7:24:09 AM: - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

7:24:09 AM: - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

7:24:09 AM: - NEXT\_PUBLIC\_GTM\_ID

7:24:09 AM: - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

7:24:09 AM: - NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY

7:24:09 AM: - NEXT\_PUBLIC\_SUPABASE\_URL

7:24:09 AM: - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

7:24:09 AM: - NODE\_ENV

7:24:09 AM: - NODE\_VERSION

7:24:09 AM: - OPENAI\_API\_KEY

7:24:09 AM: - PUPPETEER\_EXECUTABLE\_PATH

7:24:09 AM: - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

7:24:09 AM: - SITE\_URL

7:24:09 AM: - STAFF\_API\_KEY

7:24:09 AM: - STRIPE\_CSV\_EXPORT\_PRICE\_ID

7:24:09 AM: - STRIPE\_ENTERPRISE\_PRICE\_ID

7:24:09 AM: - STRIPE\_GROWTH\_PRICE\_ID

7:24:09 AM: - STRIPE\_PROFESSIONAL\_PRICE\_ID

7:24:09 AM: - STRIPE\_PUBLISHABLE\_KEY

7:24:09 AM: - STRIPE\_SECRET\_KEY

7:24:09 AM: - STRIPE\_STARTER\_PRICE\_ID

7:24:09 AM: - STRIPE\_WEBHOOK\_SECRET

7:24:09 AM: - SUPABASE\_ANON\_KEY

7:24:09 AM: - SUPABASE\_DATABASE\_URL

7:24:09 AM: - SUPABASE\_JWT\_SECRET

7:24:09 AM: - SUPABASE\_SERVICE\_ROLE\_KEY

7:24:09 AM: - SUPABASE\_URL

7:24:09 AM: - USER\_AGENT

7:24:09 AM: - VAPID\_PRIVATE\_KEY

7:24:09 AM: - WORKER\_AUTH\_TOKEN

7:24:09 AM: - NODE\_OPTIONS

7:24:09 AM: - NETLIFY\_BUILD\_DEBUG

7:24:09 AM: - NEXT\_DISABLE\_ESLINT

7:24:09 AM: - BUILDING

7:24:09 AM: - NETLIFY

7:24:09 AM: publish: /opt/build/repo/.next

7:24:09 AM: publishOrigin: config

7:24:09 AM: functions:

7:24:09 AM: "\*":

7:24:09 AM: node\_bundler: esbuild

7:24:09 AM: functionsDirectory: /opt/build/repo/netlify/functions

7:24:09 AM: headers:

7:24:09 AM: - for: /api/ai/\*

values:

Cache-Control: no-cache, no-store, must-revalidate

Referrer-Policy: strict-origin-when-cross-origin

X-Content-Type-Options: nosniff

X-Frame-Options: DENY

X-Robots-Tag: noindex, nofollow

X-XSS-Protection: 1; mode=block

\- for: /\*

values:

Permissions-Policy: camera=(), microphone=(), geolocation=()

Referrer-Policy: strict-origin-when-cross-origin

X-Content-Type-Options: nosniff

X-Frame-Options: DENY

headersOrigin: config

plugins:

\- inputs: {}

origin: config

package: "@netlify/plugin-nextjs"

redirects:

\- force: true

from: /api/ai/health

status: 200

to: /.netlify/functions/ai-health-check

\- force: true

from: /api/puppeteer/\*

status: 200

to: /.netlify/functions/puppeteer-handler

\- force: true

from: /api/customer/validate

status: 200

to: /.netlify/functions/customer-validate

\- force: true

from: /api/extension/secure-validate

status: 200

to: /.netlify/functions/extension-secure-validate

\- force: true

from: /api/healthz

status: 200

to: /.netlify/functions/healthz

\- force: true

from: /api/version

status: 200

to: /.netlify/functions/version

\- force: true

from: /api/autobolt-status

status: 200

to: /.netlify/functions/autobolt-status

\- force: true

from: /api/jobs-next

status: 200

to: /.netlify/functions/jobs-next

\- force: true

from: /api/jobs-update

status: 200

to: /.netlify/functions/jobs-update

\- force: true

from: /api/jobs-complete

status: 200

to: /.netlify/functions/jobs-complete

\- force: true

from: /api/jobs-retry

status: 200

to: /.netlify/functions/jobs-retry

redirectsOrigin: config



7:24:09 AM: ❯ Context

7:24:09 AM: production

7:24:09 AM: 

7:24:09 AM: ❯ Available plugins

7:24:09 AM: - @21yunbox/netlify-plugin-21yunbox-deploy-to-china-cdn@1.0.7

7:24:09 AM: - @algolia/netlify-plugin-crawler@1.0.0

7:24:09 AM: - @bharathvaj/netlify-plugin-airbrake@1.0.2

7:24:09 AM: - @chiselstrike/netlify-plugin@0.1.0

7:24:09 AM: - @commandbar/netlify-plugin-commandbar@0.0.4

7:24:09 AM: - @helloample/netlify-plugin-replace@1.1.4

7:24:09 AM: - @netlify/angular-runtime@2.4.0

7:24:09 AM: - @netlify/feature-package-pilot@0.1.11

7:24:09 AM: - @netlify/plugin-angular-universal@1.0.1

7:24:09 AM: - @netlify/plugin-contentful-buildtime@0.0.3

7:24:09 AM: - @netlify/plugin-emails@1.1.1

7:24:09 AM: - @netlify/plugin-gatsby@3.8.4

7:24:09 AM: - @netlify/plugin-lighthouse@6.0.1

7:24:09 AM: - @netlify/plugin-nextjs@5.7.0-ipx.0

7:24:09 AM: - @netlify/plugin-sitemap@0.8.1

7:24:09 AM: - @newrelic/netlify-plugin@1.0.2

7:24:09 AM: - @sentry/netlify-build-plugin@1.1.1

7:24:09 AM: - @snaplet/netlify-preview-database-plugin@2.0.0

7:24:09 AM: - @takeshape/netlify-plugin-takeshape@1.0.0

7:24:09 AM: - @vgs/netlify-plugin-vgs@0.0.2

7:24:09 AM: - netlify-build-plugin-dareboost@1.2.1

7:24:09 AM: - netlify-build-plugin-debugbear@1.0.6

7:24:09 AM: - netlify-build-plugin-perfbeacon@1.0.3

7:24:09 AM: - netlify-build-plugin-speedcurve@2.0.0

7:24:09 AM: - netlify-deployment-hours-plugin@0.0.10

7:24:09 AM: - netlify-plugin-a11y@0.0.12

7:24:09 AM: - netlify-plugin-add-instagram@0.2.2

7:24:09 AM: - netlify-plugin-algolia-index@0.3.0

7:24:09 AM: - netlify-plugin-amp-server-side-rendering@1.0.2

7:24:09 AM: - netlify-plugin-brand-guardian@1.0.1

7:24:09 AM: - netlify-plugin-build-logger@1.0.3

7:24:09 AM: - netlify-plugin-bundle-env@0.2.2

7:24:09 AM: - netlify-plugin-cache-nextjs@1.4.0

7:24:09 AM: - netlify-plugin-cecil-cache@0.3.3

7:24:09 AM: - netlify-plugin-checklinks@4.1.1

7:24:09 AM: - netlify-plugin-chromium@1.1.4

7:24:09 AM: - netlify-plugin-cloudinary@1.17.0

7:24:09 AM: - netlify-plugin-contextual-env@0.3.0

7:24:09 AM: - netlify-plugin-cypress@2.2.0

7:24:09 AM: - netlify-plugin-debug-cache@1.0.4

7:24:09 AM: - netlify-plugin-encrypted-files@0.0.5

7:24:09 AM: - netlify-plugin-fetch-feeds@0.2.3

7:24:09 AM: - netlify-plugin-flutter@1.1.0

7:24:09 AM: - netlify-plugin-formspree@1.0.1

7:24:09 AM: - netlify-plugin-gatsby-cache@0.3.0

7:24:09 AM: - netlify-plugin-get-env-vars@1.0.0

7:24:09 AM: - netlify-plugin-ghost-inspector@1.0.1

7:24:09 AM: - netlify-plugin-ghost-markdown@3.1.0

7:24:09 AM: - netlify-plugin-gmail@1.1.0

7:24:09 AM: - netlify-plugin-gridsome-cache@1.0.3

7:24:09 AM: - netlify-plugin-hashfiles@4.0.2

7:24:09 AM: - netlify-plugin-html-validate@1.0.0

7:24:09 AM: - netlify-plugin-hugo-cache-resources@0.2.1

7:24:09 AM: - netlify-plugin-image-optim@0.4.0

7:24:09 AM: - netlify-plugin-inline-critical-css@2.0.0

7:24:09 AM: - netlify-plugin-inline-functions-env@1.0.8

7:24:09 AM: - netlify-plugin-inline-source@1.0.4

7:24:09 AM: - netlify-plugin-inngest@1.0.0

7:24:09 AM: - netlify-plugin-is-website-vulnerable@2.0.3

7:24:09 AM: - netlify-plugin-jekyll-cache@1.0.0

7:24:09 AM: - netlify-plugin-js-obfuscator@1.0.20

7:24:09 AM: - netlify-plugin-minify-html@0.3.1

7:24:09 AM: - netlify-plugin-next-dynamic@1.0.9

7:24:09 AM: - netlify-plugin-nimbella@2.1.0

7:24:09 AM: - netlify-plugin-no-more-404@0.0.15

7:24:09 AM: - netlify-plugin-nx-skip-build@0.0.7

7:24:09 AM: - netlify-plugin-pagewatch@1.0.4

7:24:09 AM: - netlify-plugin-playwright-cache@0.0.1

7:24:09 AM: - netlify-plugin-prerender-spa@1.0.1

7:24:09 AM: - netlify-plugin-prisma-provider@0.3.0

7:24:09 AM: - netlify-plugin-pushover@0.1.1

7:24:09 AM: - netlify-plugin-qawolf@1.2.0

7:24:09 AM: - netlify-plugin-rss@0.0.8

7:24:09 AM: - netlify-plugin-search-index@0.1.5

7:24:09 AM: - netlify-plugin-snyk@1.2.0

7:24:09 AM: - netlify-plugin-stepzen@1.0.4

7:24:09 AM: - netlify-plugin-subfont@6.0.0

7:24:09 AM: - netlify-plugin-submit-sitemap@0.4.0

7:24:09 AM: - netlify-plugin-to-all-events@1.3.1

7:24:09 AM: - netlify-plugin-use-env-in-runtime@1.2.1

7:24:09 AM: - netlify-plugin-visual-diff@2.0.0

7:24:09 AM: - netlify-plugin-webmentions@1.1.0

7:24:09 AM: - netlify-purge-cloudflare-on-deploy@1.2.0

7:24:09 AM: - strapi-plugin-netlify-deployments@2.0.1

7:24:09 AM: Used compatible version '5.13.3' for plugin '@netlify/plugin-nextjs' (pinned version is 5)

7:24:09 AM: 

7:24:09 AM: ❯ Installing extensions

7:24:09 AM: - neon

7:24:11 AM: 

7:24:11 AM: ❯ Using Next.js Runtime - v5.13.3

7:24:11 AM: 

7:24:11 AM: ❯ Loading extensions

7:24:11 AM: - neon

7:24:12 AM: 

7:24:12 AM: @netlify/plugin-nextjs (onPreBuild event)

7:24:12 AM: ────────────────────────────────────────────────────────────────

7:24:12 AM: 

7:24:12 AM: Step starting.

7:24:12 AM: Step started.

7:24:12 AM: Plugin logic started.

7:24:13 AM: Next.js cache restored

7:24:13 AM: Plugin logic ended.

7:24:13 AM: Stop closing.

7:24:13 AM: Step ended.

7:24:13 AM: Step completed.

7:24:13 AM: 

7:24:13 AM: (@netlify/plugin-nextjs onPreBuild completed in 608ms)

7:24:13 AM: Build step duration: @netlify/plugin-nextjs onPreBuild completed in 608ms

7:24:13 AM: 

7:24:13 AM: neon-buildhooks (onPreBuild event)

7:24:13 AM: ────────────────────────────────────────────────────────────────

7:24:13 AM: 

7:24:13 AM: Step starting.

7:24:13 AM: Step started.

7:24:13 AM: Plugin logic started.

7:24:13 AM: Plugin logic ended.

7:24:13 AM: Stop closing.

7:24:13 AM: Step ended.

7:24:13 AM: Step completed.

7:24:13 AM: 

7:24:13 AM: (neon-buildhooks onPreBuild completed in 8ms)

7:24:13 AM: Build step duration: neon-buildhooks onPreBuild completed in 8ms

7:24:13 AM: 

7:24:13 AM: build.command from netlify.toml

7:24:13 AM: ────────────────────────────────────────────────────────────────

7:24:13 AM: 

7:24:13 AM: $ npm run build

7:24:13 AM: > directorybolt@2.0.1-emergency-fix prebuild

7:24:13 AM: > npm run validate:guides

7:24:13 AM: > directorybolt@2.0.1-emergency-fix validate:guides

7:24:13 AM: > node scripts/validate-json-guides.js

7:24:13 AM: 🔍 Validating JSON guide files...

7:24:13 AM: 📁 Directory: /opt/build/repo/data/guides

7:24:13 AM: 📄 Found 50 JSON files

7:24:13 AM: ✅ airbnb-host-listing.json - Valid (9112 bytes)

7:24:13 AM: ✅ amazon-business-directory.json - Valid (18808 bytes)

7:24:13 AM: ✅ amazon-seller-central.json - Valid (8675 bytes)

7:24:13 AM: ✅ angie-list-business-listing.json - Valid (9530 bytes)

7:24:13 AM: ✅ apple-business-connect.json - Valid (15332 bytes)

7:24:13 AM: ✅ avvo-lawyer-directory.json - Valid (11979 bytes)

7:24:13 AM: ✅ behance-creative-portfolio.json - Valid (12219 bytes)

7:24:13 AM: ✅ better-business-bureau.json - Valid (18779 bytes)

7:24:13 AM: ✅ bing-places-business.json - Valid (14739 bytes)

7:24:13 AM: ✅ booking-com-property.json - Valid (9354 bytes)

7:24:13 AM: ✅ chamber-commerce-membership.json - Valid (12530 bytes)

7:24:13 AM: ✅ crunchbase-company-profile.json - Valid (17650 bytes)

7:24:13 AM: ✅ discord-community-server.json - Valid (10633 bytes)

7:24:13 AM: ✅ ebay-seller-account.json - Valid (9118 bytes)

7:24:13 AM: ✅ etsy-shop-optimization.json - Valid (11731 bytes)

7:24:13 AM: ✅ facebook-business-page-optimization.json - Valid (13809 bytes)

7:24:13 AM: ✅ facebook-marketplace-seller.json - Valid (9436 bytes)

7:24:13 AM: ✅ fiverr-seller-profile.json - Valid (12096 bytes)

7:24:13 AM: ✅ foursquare-business-claiming.json - Valid (18377 bytes)

7:24:13 AM: ✅ github-developer-profile.json - Valid (11813 bytes)

7:24:13 AM: ✅ glassdoor-company-profile.json - Valid (10042 bytes)

7:24:13 AM: ✅ google-ads-business.json - Valid (10118 bytes)

7:24:13 AM: ✅ google-business-profile.json - Valid (12310 bytes)

7:24:13 AM: ✅ google-my-business-setup.json - Valid (8864 bytes)

7:24:13 AM: ✅ healthgrades-doctor-profile.json - Valid (12060 bytes)

7:24:13 AM: ✅ homeadvisor-contractor-profile.json - Valid (9741 bytes)

7:24:13 AM: ✅ houzz-professional-profile.json - Valid (12899 bytes)

7:24:13 AM: ✅ indeed-employer-profile.json - Valid (10374 bytes)

7:24:13 AM: ✅ instagram-business-profile.json - Valid (12303 bytes)

7:24:13 AM: ✅ linkedin-company-directory.json - Valid (16529 bytes)

7:24:13 AM: ✅ manta-business-directory.json - Valid (10820 bytes)

7:24:13 AM: ✅ microsoft-advertising-bing.json - Valid (9803 bytes)

7:24:13 AM: ✅ nextdoor-business-profile.json - Valid (12227 bytes)

7:24:13 AM: ✅ pinterest-business-account.json - Valid (12509 bytes)

7:24:13 AM: ✅ product-hunt-launch-guide.json - Valid (11499 bytes)

7:24:13 AM: ✅ reddit-business-marketing.json - Valid (10346 bytes)

7:24:13 AM: ✅ shopify-store-directory.json - Valid (12732 bytes)

7:24:13 AM: ✅ squarespace-business-listing.json - Valid (12682 bytes)

7:24:13 AM: ✅ superpages-business-listing.json - Valid (12068 bytes)

7:24:13 AM: ✅ thumbtack-service-provider.json - Valid (9779 bytes)

7:24:13 AM: ✅ tiktok-business-account.json - Valid (12094 bytes)

7:24:13 AM: ✅ tripadvisor-business-listing.json - Valid (18587 bytes)

7:24:13 AM: ✅ twitter-business-profile.json - Valid (12207 bytes)

7:24:13 AM: ✅ upwork-freelancer-profile.json - Valid (12624 bytes)

7:24:13 AM: ✅ wix-business-directory.json - Valid (12713 bytes)

7:24:13 AM: ✅ wordpress-business-directory.json - Valid (12777 bytes)

7:24:13 AM: ✅ yellow-pages-online.json - Valid (17674 bytes)

7:24:13 AM: ✅ yelp-business-optimization.json - Valid (9514 bytes)

7:24:13 AM: ✅ youtube-business-channel.json - Valid (12655 bytes)

7:24:13 AM: ✅ zillow-agent-profile.json - Valid (12212 bytes)

7:24:13 AM: 📊 Validation Summary:

7:24:13 AM: Total files: 50

7:24:13 AM: Valid files: 50

7:24:13 AM: Invalid files: 0

7:24:13 AM: Files with warnings: 0

7:24:13 AM: ✅ All JSON files are valid! Build should succeed.

7:24:13 AM: > directorybolt@2.0.1-emergency-fix build

7:24:13 AM: > node scripts/verify-build.js \&\& cross-env NEXT\_TELEMETRY\_DISABLED=1 next build

7:24:13 AM: 🔍 Verifying build components...

7:24:13 AM: ✅ Found: AI-Powered Business Intelligence

7:24:13 AM: ✅ Found: $4,300 Worth of Business Intelligence

7:24:13 AM: ✅ Found: $299 ONE-TIME

7:24:13 AM: ✅ Found: Save 93% vs. consultant project fees

7:24:13 AM: ✅ Build verification passed - all required content found

7:24:13 AM: 🚀 Build timestamp: 2025-09-29T13:24:13.380Z

7:24:13 AM: sh: 1: cross-env: not found

7:24:13 AM: 

7:24:13 AM: @netlify/plugin-nextjs (onEnd event)

7:24:13 AM: ────────────────────────────────────────────────────────────────

7:24:13 AM: 

7:24:13 AM: Step starting.

7:24:13 AM: Step started.

7:24:13 AM: Plugin logic started.

7:24:13 AM: Plugin logic started.

7:24:13 AM: Plugin logic ended.

7:24:13 AM: Plugin logic ended.

7:24:13 AM: Stop closing.

7:24:13 AM: Stop closing.

7:24:13 AM: Step ended.

7:24:13 AM: Step completed.

7:24:13 AM: 

7:24:13 AM: (@netlify/plugin-nextjs onEnd completed in 5ms)

7:24:13 AM: Build step duration: @netlify/plugin-nextjs onEnd completed in 5ms

7:24:13 AM: Step starting.

7:24:13 AM: Step starting.

7:24:13 AM: Step started.

7:24:13 AM: Step started.

7:24:13 AM: Stop closing.

7:24:13 AM: Stop closing.

7:24:13 AM: Step ended.

7:24:13 AM: Step ended.

7:24:13 AM: 

7:24:13 AM: "build.command" failed

7:24:13 AM: ────────────────────────────────────────────────────────────────

7:24:13 AM: 

7:24:13 AM: Error message

7:24:13 AM: Command failed with exit code 127: npm run build (https://ntl.fyi/exit-code-127)

7:24:13 AM: 

7:24:13 AM: Error location

7:24:13 AM: In build.command from netlify.toml:

7:24:13 AM: npm run build

7:24:13 AM: 

7:24:13 AM: Resolved config

7:24:13 AM: build:

7:24:13 AM: command: npm run build

7:24:13 AM: commandOrigin: config

7:24:13 AM: edge\_functions: /opt/build/repo/netlify/edge-functions

7:24:13 AM: environment:

7:24:13 AM: - ADMIN\_API\_KEY

7:24:13 AM: - ALLOWED\_ORIGINS

7:24:13 AM: - AUTOBOLT\_API\_KEY

7:24:13 AM: - AUTOBOLT\_DEFAULT\_PERMISSIONS

7:24:13 AM: - AUTOBOLT\_WEBHOOK\_URL

7:24:13 AM: - BASE\_URL

7:24:13 AM: - JWT\_ACCESS\_SECRET

7:24:13 AM: - JWT\_REFRESH\_SECRET

7:24:13 AM: - JWT\_SECRET

7:24:13 AM: - NEXTAUTH\_URL

7:24:13 AM: - NEXT\_PUBLIC\_API\_BASE\_URL

7:24:13 AM: - NEXT\_PUBLIC\_APP\_URL

7:24:13 AM: - NEXT\_PUBLIC\_BASE\_URL

7:24:13 AM: - NEXT\_PUBLIC\_GA\_MEASUREMENT\_ID

7:24:13 AM: - NEXT\_PUBLIC\_GOOGLE\_TAG\_ID

7:24:13 AM: - NEXT\_PUBLIC\_GTM\_ID

7:24:13 AM: - NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

7:24:13 AM: - NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY

7:24:13 AM: - NEXT\_PUBLIC\_SUPABASE\_URL

7:24:13 AM: - NEXT\_PUBLIC\_VAPID\_PUBLIC\_KEY

7:24:13 AM: - NODE\_ENV

7:24:13 AM: - NODE\_VERSION

7:24:13 AM: - OPENAI\_API\_KEY

7:24:13 AM: - PUPPETEER\_EXECUTABLE\_PATH

7:24:13 AM: - PUPPETEER\_SKIP\_CHROMIUM\_DOWNLOAD

7:24:13 AM: - SITE\_URL

7:24:13 AM: - STAFF\_API\_KEY

7:24:13 AM: - STRIPE\_CSV\_EXPORT\_PRICE\_ID

7:24:13 AM: - STRIPE\_ENTERPRISE\_PRICE\_ID

7:24:13 AM: - STRIPE\_GROWTH\_PRICE\_ID

7:24:13 AM: - STRIPE\_PROFESSIONAL\_PRICE\_ID

7:24:13 AM: - STRIPE\_PUBLISHABLE\_KEY

7:24:13 AM: - STRIPE\_SECRET\_KEY

7:24:13 AM: - STRIPE\_STARTER\_PRICE\_ID

7:24:13 AM: - STRIPE\_WEBHOOK\_SECRET

7:24:13 AM: - SUPABASE\_ANON\_KEY

7:24:13 AM: - SUPABASE\_DATABASE\_URL

7:24:13 AM: - SUPABASE\_JWT\_SECRET

7:24:13 AM: - SUPABASE\_SERVICE\_ROLE\_KEY

7:24:13 AM: - SUPABASE\_URL

7:24:13 AM: - USER\_AGENT

7:24:13 AM: - VAPID\_PRIVATE\_KEY

7:24:13 AM: - WORKER\_AUTH\_TOKEN

7:24:13 AM: - NODE\_OPTIONS

7:24:13 AM: - NETLIFY\_BUILD\_DEBUG

7:24:13 AM: - NEXT\_DISABLE\_ESLINT

7:24:13 AM: - BUILDING

7:24:13 AM: - NETLIFY

7:24:13 AM: publish: /opt/build/repo/.next

7:24:13 AM: publishOrigin: config

7:24:13 AM: functions:

7:24:13 AM: "\*":

7:24:13 AM: node\_bundler: esbuild

7:24:13 AM: functionsDirectory: /opt/build/repo/netlify/functions

7:24:13 AM: headers:

7:24:14 AM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)

7:24:14 AM: - for: /api/ai/\*

values:

Cache-Control: no-cache, no-store, must-revalidate

Referrer-Policy: strict-origin-when-cross-origin

X-Content-Type-Options: nosniff

X-Frame-Options: DENY

X-Robots-Tag: noindex, nofollow

X-XSS-Protection: 1; mode=block

\- for: /\*

values:

Permissions-Policy: camera=(), microphone=(), geolocation=()

Referrer-Policy: strict-origin-when-cross-origin

X-Content-Type-Options: nosniff

X-Frame-Options: DENY

headersOrigin: config

plugins:

\- inputs: {}

origin: config

package: "@netlify/plugin-nextjs"

redirects:

\- force: true

from: /api/ai/health

status: 200

to: /.netlify/functions/ai-health-check

\- force: true

from: /api/puppeteer/\*

status: 200

to: /.netlify/functions/puppeteer-handler

\- force: true

from: /api/customer/validate

status: 200

to: /.netlify/functions/customer-validate

\- force: true

from: /api/extension/secure-validate

status: 200

to: /.netlify/functions/extension-secure-validate

\- force: true

from: /api/healthz

status: 200

to: /.netlify/functions/healthz

\- force: true

from: /api/version

status: 200

to: /.netlify/functions/version

\- force: true

from: /api/autobolt-status

status: 200

to: /.netlify/functions/autobolt-status

\- force: true

from: /api/jobs-next

status: 200

to: /.netlify/functions/jobs-next

\- force: true

from: /api/jobs-update

status: 200

to: /.netlify/functions/jobs-update

\- force: true

from: /api/jobs-complete

status: 200

to: /.netlify/functions/jobs-complete

\- force: true

from: /api/jobs-retry

status: 200

to: /.netlify/functions/jobs-retry

redirectsOrigin: config

7:24:14 AM: Build failed due to a user error: Build script returned non-zero exit code: 2

7:24:14 AM: Failing build: Failed to build site

7:24:15 AM: Finished processing build request in 40.24s"

&nbsp;       ],

&nbsp;       "notes": "This is the recent failing deploy log from Netlify."

&nbsp;     }

&nbsp;   ],

&nbsp;   "notes": "Compare the two logs and explain exactly what changed between the successful and failing builds that could cause `exit code 127`. Identify whether the issue is Node version, dependency resolution, lockfile mismatch, or config difference."

&nbsp; }

}







