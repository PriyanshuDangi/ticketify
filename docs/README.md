# Ticketify Documentation

**Version**: 1.0  
**Last Updated**: October 21, 2025

Welcome to the Ticketify documentation! This folder contains all technical specifications and guides needed to build and deploy the Ticketify platform.

---

## 📚 Documentation Overview

### Core Documents

1. **[Implementation Plan](./implementation-plan.md)** ⭐ START HERE
   - Complete step-by-step development guide
   - 14-day implementation timeline
   - Testing criteria for each step
   - ~1,700 lines of detailed instructions

2. **[Database Specification](./database-spec.md)**
   - Complete Mongoose schemas for User, Event, and Ticket models
   - Field types, validations, and constraints
   - Indexes and relationships
   - Common queries and examples

3. **[API Specification](./api-spec.md)**
   - All REST API endpoints
   - Request/response formats
   - Authentication flow
   - Error codes and handling

4. **[Environment Setup Guide](./environment-setup.md)**
   - Step-by-step setup for all services
   - Environment variables reference
   - External services configuration
   - Troubleshooting common issues

5. **[Design Document](./design-doc.md)**
   - Product requirements and features
   - User flows and UI mockups
   - Business model and roadmap

6. **[Architecture](./architecture.md)** (To be populated)
   - System architecture diagrams
   - Data flow and component interactions

---

## 🚀 Quick Start

### For Developers

1. **Start with**: [Implementation Plan](./implementation-plan.md)
2. **Reference**: [Database Spec](./database-spec.md) and [API Spec](./api-spec.md) as needed
3. **Setup**: Follow [Environment Setup Guide](./environment-setup.md)

### For Product/Business

1. **Start with**: [Design Document](./design-doc.md)
2. **Review**: Implementation plan for timeline

---

## 📖 Documentation Structure

```
docs/
├── README.md                    # This file
├── implementation-plan.md       # ⭐ Main development guide
├── database-spec.md             # Database schemas and models
├── api-spec.md                  # REST API specification
├── environment-setup.md         # Setup instructions
├── design-doc.md                # Product requirements
├── architecture.md              # System architecture (TBD)
└── progress.md                  # Implementation progress tracking
```

---

## 🎯 Key Features

**Technology Stack**:
- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn/ui, Zustand
- **Backend**: Node.js 22.21.0, Express.js, Mongoose
- **Database**: MongoDB with Mongoose ODM
- **Blockchain**: Solidity, Hardhat 3, Ethers.js v6
- **Integrations**: Google Calendar API, PYUSD, Privy, SendGrid

**Core Functionality**:
- ✅ Event creation with Google Calendar integration
- ✅ PYUSD ticket purchasing via smart contract
- ✅ Automatic attendee addition to Google Meet
- ✅ Organizer dashboard with revenue tracking
- ✅ Email notifications with calendar invites

---

## 🔑 Key Specifications

| Specification | Value |
|---------------|-------|
| Node.js Version | 22.21.0 |
| Database | MongoDB + Mongoose |
| Authentication | JWT (7-day expiry, no refresh) |
| Image Storage | Base64 in MongoDB (8MB max) |
| Timezone | UTC in DB, local display via moment.js |
| PYUSD Decimals | 6 (display max 2) |
| Network | Ethereum Sepolia (Chain ID: 11155111) |
| Ticket States | created → blockchain_added → calendar_added |

---

## 📋 Business Rules

- **One Ticket Per Event**: One wallet can only purchase one ticket per event
- **One Wallet Per Account**: Strict 1:1 wallet-to-account mapping
- **Withdrawal**: Organizers can withdraw revenue anytime
- **Event Editing**: After tickets sold, only title/description/image editable
- **Event Deletion**: Not allowed once any tickets sold
- **Refunds**: Not in MVP (placeholder in contract)
- **Contract**: Immutable (no proxy pattern)

---

## 🔗 External Resources

**Project Links**:
- GitHub Repository: `https://github.com/yourusername/ticketify`
- Live Demo (Sepolia): TBD
- Frontend (Production): TBD
- Backend API (Production): TBD

**External Documentation**:
- [Google Calendar API](https://developers.google.com/calendar)
- [Privy](https://docs.privy.io)
- [Hardhat](https://hardhat.org)
- [Shadcn/ui](https://ui.shadcn.com)
- [PYUSD](https://www.paypal.com/us/digital-wallet/manage-money/crypto/pyusd)
- [Mongoose](https://mongoosejs.com)
- [Moment.js](https://momentjs.com)
- [SendGrid](https://docs.sendgrid.com)

---

## 🎓 Learning Path

**New to the Project?**

1. Read [Design Document](./design-doc.md) to understand the product (30 min)
2. Review [Implementation Plan Overview](./implementation-plan.md#overview) (10 min)
3. Set up your environment using [Environment Setup Guide](./environment-setup.md) (2-3 hours)
4. Start Phase 1 of implementation (Day 1)

**Need Specific Info?**

- **Database questions?** → [database-spec.md](./database-spec.md)
- **API endpoints?** → [api-spec.md](./api-spec.md)
- **Setup issues?** → [environment-setup.md](./environment-setup.md)
- **Implementation questions?** → [implementation-plan.md](./implementation-plan.md)

---

## 📞 Support

**During Development**:
- Check [Troubleshooting](./environment-setup.md#troubleshooting) section
- Review error codes in [API Spec](./api-spec.md#error-responses)
- Refer to specific phase in [Implementation Plan](./implementation-plan.md)

---

## ✅ Documentation Status

| Document | Status | Completeness |
|----------|--------|--------------|
| Implementation Plan | ✅ Complete | 100% |
| Database Spec | ✅ Complete | 100% |
| API Spec | ✅ Complete | 100% |
| Environment Setup | ✅ Complete | 100% |
| Design Doc | ✅ Complete | 100% |
| Architecture | ⏳ Pending | 0% |
| Progress Tracking | ⏳ Empty | 0% |

---

## 🔄 Version History

**v1.0 - October 21, 2025**
- Initial documentation complete
- Implementation plan with 14-day timeline
- Complete database, API, and environment specs
- All business rules and constraints defined

---

## 📝 Notes

- All timestamps in documentation are in UTC
- Code examples use JavaScript (no TypeScript)
- Follow the "keep it simple" principle throughout
- Reference these docs whenever implementation questions arise

---

**Ready to start?** → Go to [Implementation Plan](./implementation-plan.md) and begin with Phase 1!

