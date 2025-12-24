# IMPROMPTU: Prof. NOTA's Console Prompt

---

---

## Maintenance by Prof. NOTA Evergreen Standard

This repo is intended to stay evergreen while remaining production-safe.

### Runtime

- Node: **24.x** (see `.nvmrc` and `package.json#engines`)
  - ~~example alternatives: 22.x / 20.x (adjust if platform requires)~~

- Package manager:
  - **Yarn** (lockfile: `yarn.lock`, repo-pinned to `yarn@4.12.0`)
  - ~~PNPM (lockfile: `pnpm-lock.yaml`)~~
  - ~~NPM (lockfile: `package-lock.json`)~~

- Deploy target:
  - **Vercel**
  - ~~Netlify~~
  - ~~Self-hosted / Docker~~
  - ~~Other platform (document explicitly)~~

### Monthly Safe Updates (recommended)

1. Check what’s outdated:
   - `yarn up -i` (interactive report)
   - ~~pnpm outdated~~
   - ~~npm outdated~~

2. Upgrade safe (patch/minor) versions:
   - `yarn up -i` (apply non-major only)
   - ~~pnpm update~~
   - ~~npm update~~
   - or upgrade specific packages shown as non-major

3. Verify:
   - `yarn npm audit --severity moderate`
   - ~~pnpm audit~~
   - ~~npm audit~~
   - `yarn build`
   - ~~pnpm build~~
   - ~~npm run build~~

4. Deploy:
   - **Vercel auto-deploy from `main`**
   - ~~manual deploy according to platform workflow~~

### Major Updates (quarterly / scheduled)

Major upgrades (framework, runtime, or core tooling) must be done one at a time, with a dedicated PR and full testing.

Examples:

- Node major version
- Next.js / React major version
- Tailwind CSS major version
- Package manager major version

---

---

> Shush, we are playing, learning, and working. 🤫 🤫 🤫 🤫

- 😄 &nbsp; We are [Prof. NOTA](https://deeplink.endhonesa.com/), per/pers.
- 🤙 &nbsp; We are currently playing.
- 🌱 &nbsp; We are currently learning.
- 🔭 &nbsp; We are currently working.
- 👯 &nbsp; We are not looking to collaborate.
- 🤔 &nbsp; We are not looking for help.
- 💬 &nbsp; Don't ask us about that.
- 📫 &nbsp; Don't try to reach us.
- ⚡ &nbsp; Fun fact: [The King's NFTs project](https://docs.endhonesa.com/)

> Here are some ideas to get you started:

## Building from source

```sh
# 1. Clone the repo
git clone https://github.com/myreceiptt/nota-console.git
cd nota-console

# 2. Install the necessary dependencies
yarn install

# 3. Run the app
yarn dev
```

> Regards
>
> [Prof. NOTA](https://deeplink.endhonesa.com/)
>
> [init.endhonesa.com](https://init.endhonesa.com/)
