# Prisma 7 Migration Quick Reference

**⚠️ DO NOT MIGRATE YET** - This is for future reference only

---

## TL;DR: What Changed in Prisma 7?

### 1. Database URL Configuration

**Before (Prisma 6):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ❌ Remove
}
```

**After (Prisma 7):**
```typescript
// NEW FILE: prisma/prisma.config.ts
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL')
  }
})
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  // url removed - now in prisma.config.ts
}
```

### 2. PrismaClient Initialization

**Before (Prisma 6):**
```typescript
new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
})
```

**After (Prisma 7):**
```typescript
import { PrismaPostgres } from '@prisma/adapter-postgres'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPostgres(pool)

new PrismaClient({ adapter })  // Adapter required!
```

### 3. CLI Commands

**Before:**
```bash
prisma migrate dev        # Auto-generates client ✅
prisma db push            # Auto-generates client ✅
```

**After:**
```bash
prisma migrate dev        # Does NOT auto-generate ❌
prisma generate           # Must run explicitly ✅

# Update package.json scripts:
"migrate": "prisma migrate deploy && prisma generate"
```

---

## Migration Checklist (When Ready)

### Pre-Migration
- [ ] Read full guide: `/docs/PRISMA-7-MIGRATION-GUIDE.md`
- [ ] Backup production database
- [ ] Create test environment
- [ ] Schedule 2-3 days for migration + testing
- [ ] Check Auth.js compatibility

### Migration Steps
1. [ ] Create `prisma/prisma.config.ts`
2. [ ] Remove `url` from `schema.prisma` datasource
3. [ ] Install Prisma 7: `npm install -D prisma@^7.0.0`
4. [ ] Install adapter: `npm install @prisma/adapter-postgres`
5. [ ] Update `lib/prisma.ts` with adapter
6. [ ] Update `package.json` scripts
7. [ ] Run `npm run db:generate`
8. [ ] Test all authentication flows
9. [ ] Test all database operations
10. [ ] Run full test suite

### Post-Migration
- [ ] Monitor for 48 hours
- [ ] Verify performance metrics
- [ ] Check error logs
- [ ] Confirm Auth.js sessions work
- [ ] Update team documentation

---

## When Should You Migrate?

### ✅ Migrate When:
- Prisma 6 reaches end-of-life
- You need edge runtime support (Cloudflare Workers)
- You have 2-3 days for testing
- Production is stable
- No urgent feature releases

### ❌ Don't Migrate When:
- You're in the middle of a major release
- Production is unstable
- Healthcare regulatory audit pending
- Team is short-staffed
- Prisma 6 is working perfectly (like now)

---

## Current Recommendation

🟢 **STAY ON PRISMA 6.16.1**

Your healthcare application requires maximum stability. Migrate only when:
1. Prisma 6 nears EOL (not yet)
2. You need Prisma 7 features (you don't)
3. Planned maintenance window (Q2 2026)

**Next Review Date:** July 2026

---

## Quick Commands

### Check Current Version
```bash
npm ls prisma @prisma/client
# Should show: 6.16.1
```

### If You Need Help
```bash
# Full migration guide
cat docs/PRISMA-7-MIGRATION-GUIDE.md

# Prisma version comparison
cat docs/PRISMA-VERSION-FIX.md
```

### Emergency Rollback
```bash
git checkout master
rm -rf node_modules package-lock.json
npm install
npm run db:generate
pm2 restart healthapp-nextjs
```

---

## Resources

- **Full Guide:** `/docs/PRISMA-7-MIGRATION-GUIDE.md` (comprehensive, 10+ pages)
- **This Reference:** `/docs/PRISMA-7-QUICK-REFERENCE.md` (quick lookup)
- **Official Docs:** https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7

---

**Last Updated:** 2026-01-28
**Status:** Planning Only - Do Not Execute
