# Cleaning Service – Patch

This zip contains an updated Vue 3 + Vite 6 + Tailwind setup with:
- API client (axios) at `src/services/api.js`
- Services grid that calls your ASP.NET API `/api/Service`
- Tailwind/PostCSS config fixed
- `@` alias enabled

## Quick start

```bash
# 1) extract zip
cd cleaningservice_patch

# 2) install (pinned versions)
npm install

# 3) copy .env.example to .env and adjust if needed
cp .env.example .env

# 4) run
npm run dev
```

If you want to merge into an existing project, copy these files into your repo:

- `vite.config.js`, `postcss.config.js`, `tailwind.config.js`
- `src/assets/tailwind.css`
- `src/services/api.js`
- `src/components/ServiceCard.vue`
- `src/components/ServicesGrid.vue`
- `src/pages/Home.vue`, `src/pages/Services.vue`
- `src/router/index.js` (or merge routes)
- `src/main.js`
- `.env.example` → `.env`

Make sure your backend is running at `http://localhost:5203/api`.
