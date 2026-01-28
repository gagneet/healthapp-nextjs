# HealthApp Documentation Index

**Last Updated:** 2026-01-28

---

## 🚀 Current Deployment (Use These)

### PM2 Deployment & Fixes
| Document | Purpose | Status |
|----------|---------|--------|
| [DEPLOYMENT-FIX-SUMMARY.md](./DEPLOYMENT-FIX-SUMMARY.md) | Quick summary of all deployment fixes | ✅ Current |
| [PM2-DEPLOYMENT-QUICKSTART.md](./PM2-DEPLOYMENT-QUICKSTART.md) | Quick reference for PM2 deployment | ✅ Current |
| [PM2-DEPLOYMENT-FIX.md](./PM2-DEPLOYMENT-FIX.md) | Technical details of deployment fixes | ✅ Current |
| [PRISMA-VERSION-FIX.md](./PRISMA-VERSION-FIX.md) | Prisma 6.x version locking explanation | ✅ Current |

### Quick Deploy Command
```bash
./scripts/deploy-pm2.sh --clean --clear-cache
```

---

## 📋 Future Planning (Reference Only)

### Prisma 7 Migration (DO NOT USE YET)
| Document | Purpose | Status |
|----------|---------|--------|
| [PRISMA-7-MIGRATION-GUIDE.md](./PRISMA-7-MIGRATION-GUIDE.md) | Comprehensive Prisma 7 upgrade guide | 📋 Planning |
| [PRISMA-7-QUICK-REFERENCE.md](./PRISMA-7-QUICK-REFERENCE.md) | Quick lookup for Prisma 7 changes | 📋 Planning |

**Recommendation:** Stay on Prisma 6.16.1 for now. Review these guides in Q2 2026.

---

## 🏥 Project Documentation (Historical)

### Architecture & Setup
| Document | Purpose |
|----------|---------|
| [architecture.md](./architecture.md) | Overall system architecture |
| [SETUP_AND_DEPLOYMENT_GUIDE.md](./SETUP_AND_DEPLOYMENT_GUIDE.md) | Initial setup guide |
| [project_folder_structure.md](./project_folder_structure.md) | Project structure overview |

### Deployment Guides (Older)
| Document | Purpose | Status |
|----------|---------|--------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | General deployment guide | 📚 Superseded |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Alternative deployment guide | 📚 Superseded |
| [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md) | Docker deployment | 📚 Reference |

**Note:** Use PM2-DEPLOYMENT guides above instead of these older docs.

### Implementation Guides
| Document | Purpose |
|----------|---------|
| [current_implementation_status.md](./current_implementation_status.md) | Current feature status |
| [patient-implementation.md](./patient-implementation.md) | Patient module implementation |
| [nextjs_healthcare_implementation_guide.md](./nextjs_healthcare_implementation_guide.md) | Next.js healthcare patterns |

### Database & Schema
| Document | Purpose |
|----------|---------|
| [patient-schema.md](./patient-schema.md) | Patient database schema |
| [SCHEMA_VALIDATION.md](./SCHEMA_VALIDATION.md) | Schema validation guide |
| [prisma_rules_and_migrations.md](./prisma_rules_and_migrations.md) | Prisma conventions |

### Testing & Development
| Document | Purpose |
|----------|---------|
| [TESTING_AND_DEVELOPMENT_GUIDE.md](./TESTING_AND_DEVELOPMENT_GUIDE.md) | Testing guide |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues & fixes |

### Business Requirements
| Document | Purpose |
|----------|---------|
| [al_business_analysis_for_application.md](./al_business_analysis_for_application.md) | Business analysis |
| [critical_medical_regional_enhancements.md](./critical_medical_regional_enhancements.md) | Medical enhancements |
| [future_plan_implementations.md](./future_plan_implementations.md) | Future roadmap |

---

## 🔧 What Was Fixed (January 2026)

### Issues Resolved
1. ✅ **Prisma Version Conflict** - Script now uses Prisma 6.16.1 (not 7.x)
2. ✅ **Nodemailer Peer Dependency** - Upgraded to v7.0.13
3. ✅ **NPM Cache Corruption** - Automatic retry and verification

### Files Modified
- `package.json` - nodemailer v7.0.13
- `scripts/deploy-pm2.sh` - Enhanced installation logic
- Documentation created (see Current Deployment section above)

---

## 📖 How to Use This Documentation

### For Immediate Deployment
1. Start with: [DEPLOYMENT-FIX-SUMMARY.md](./DEPLOYMENT-FIX-SUMMARY.md)
2. Quick reference: [PM2-DEPLOYMENT-QUICKSTART.md](./PM2-DEPLOYMENT-QUICKSTART.md)
3. Run: `./scripts/deploy-pm2.sh --clean --clear-cache`

### For Understanding Issues
1. Read: [PM2-DEPLOYMENT-FIX.md](./PM2-DEPLOYMENT-FIX.md)
2. Read: [PRISMA-VERSION-FIX.md](./PRISMA-VERSION-FIX.md)

### For Future Prisma Upgrade
1. Read: [PRISMA-7-MIGRATION-GUIDE.md](./PRISMA-7-MIGRATION-GUIDE.md)
2. Quick ref: [PRISMA-7-QUICK-REFERENCE.md](./PRISMA-7-QUICK-REFERENCE.md)
3. **Don't migrate yet** - stay on Prisma 6.16.1

### For Project Understanding
1. Start with: [architecture.md](./architecture.md)
2. Current status: [current_implementation_status.md](./current_implementation_status.md)
3. Database: [patient-schema.md](./patient-schema.md)

---

## 🆘 Quick Help

### Deploy the Application
```bash
./scripts/deploy-pm2.sh --clean --clear-cache
```

### Check What's Running
```bash
pm2 status
pm2 logs healthapp-nextjs
```

### Verify Prisma Version
```bash
npm ls prisma
# Should show: prisma@6.16.1
```

### View Package Versions
```bash
npm ls nodemailer         # Should show: 7.0.13
npm ls @prisma/client     # Should show: 6.16.1
npm ls next-auth          # Should show: 5.0.0-beta.29
```

### Get Help
```bash
./scripts/deploy-pm2.sh --help
```

---

## 📅 Document Review Schedule

| Document Category | Next Review | Frequency |
|------------------|-------------|-----------|
| Deployment Guides | March 2026 | Quarterly |
| Prisma 7 Migration | July 2026 | Semi-annually |
| Architecture Docs | June 2026 | Annually |
| Implementation Status | Monthly | Monthly |

---

## 🎯 Current Priorities (January 2026)

1. ✅ **Deployment Stability** - COMPLETE
   - Fixed Prisma version issues
   - Fixed nodemailer conflicts
   - Enhanced deployment script

2. ⏭️ **Next Steps** - As needed by team
   - Continue feature development
   - Monitor production stability
   - Consider Node.js upgrade to v22 (optional)

3. 📋 **Future Consideration**
   - Prisma 7 migration (Q2 2026)
   - Documentation consolidation
   - Testing coverage improvements

---

## 🤝 Contributing to Documentation

### Adding New Documentation
1. Create new `.md` file in `/docs`
2. Add entry to this INDEX.md
3. Use clear, descriptive titles
4. Include examples and code snippets
5. Add creation date and author

### Updating Existing Documentation
1. Update the document
2. Change "Last Updated" date
3. Update status in INDEX.md if needed
4. Note changes in CHANGELOG (if exists)

### Deprecating Documentation
1. Mark as "📚 Superseded" in INDEX.md
2. Add note pointing to replacement
3. Keep for historical reference
4. Don't delete (may be useful)

---

## 📞 Support

### Internal Team
- Development questions: Check troubleshooting docs first
- Deployment issues: See PM2 deployment guides
- Architecture questions: Review architecture.md

### External Resources
- Prisma: https://www.prisma.io/docs
- Next.js: https://nextjs.org/docs
- Auth.js: https://authjs.dev

---

**Maintained By:** Development Team
**Last Major Update:** 2026-01-28 (Deployment Fixes)
**Documentation Version:** 2.0
