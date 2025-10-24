# Frontend Integration Checklist

**Reference**: See [@api-spec.md](./api-spec.md) for complete API documentation.

**Last Updated**: October 24, 2025

---

## 🔴 CRITICAL CHANGES

### 1. Authentication - Cookie-based (Not Token-based)

**Issue**: Frontend uses `Authorization: Bearer` tokens. API spec requires cookie-based auth with wallet address.

**Files to Update**:

**1. `client/lib/api.js`**
- ❌ Remove token interceptor
- ✅ Add `withCredentials: true` to axios config

**2. `client/store/authStore.js`**
- ❌ Remove `token` from state
- ❌ Remove localStorage token persistence

**3. `client/components/AuthSync.jsx` (NEW FILE - Create this)**
- ✅ Import `usePrivy` and `useEffect`
- ✅ Watch Privy's `ready`, `authenticated`, and `user.wallet.address`
- ✅ When authenticated → Set cookie: `document.cookie = 'walletAddress=0x...; path=/; SameSite=Lax'`
- ✅ When not authenticated → Remove cookie: `document.cookie = 'walletAddress=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'`
- ✅ Runs on mount (page load) and auth state changes

**4. `client/components/Providers.jsx`**
- ✅ Import AuthSync component
- ✅ Render `<AuthSync />` as first child inside `<PrivyProvider>`

**Why AuthSync?** 
- Privy persists wallet connection across reloads automatically
- But cookies need manual sync with Privy's auth state
- AuthSync keeps them in sync on every page load

**Cookie Format** (session-based, no expiry):
```javascript
// Set: document.cookie = 'walletAddress=0x123...; path=/; SameSite=Lax'
// Remove: document.cookie = 'walletAddress=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
```

**Reference**: @api-spec.md - Authentication section (lines 34-65)

---

### 2. Event Creation - 3-Step Process

**Issue**: Current implementation tries to create events in one step. API requires 3 steps.

**Correct Flow**:
1. **POST /api/events** → Backend creates draft (contractEventId: null)
2. **Smart Contract** → Frontend calls blockchain, gets contractEventId
3. **PATCH /api/events/:id/contract-id** → Activate event

**Files to Update**:
- `client/app/events/create/page.jsx`
  - Remove placeholder contractEventId generation
  - Add blockchain smart contract integration
  - Call PATCH endpoint after blockchain confirmation
  
- `client/lib/api.js`
  - ✅ Add: `updateEventContractId: (id, contractEventId) => api.patch(\`/api/events/\${id}/contract-id\`, { contractEventId })`

**Reference**: @api-spec.md - Event Creation Flow (lines 911-956)

---

### 3. API Response Structure

**Issue**: All API responses wrapped in `{ success: true, data: {...} }`

**Change Needed**:
- Update all handlers from `response.data.X` → `response.data.data.X`
- Update errors from `error.message` → `error.response?.data?.error?.message`

**Affects**: All pages, stores, components that call API

**Reference**: @api-spec.md - Error Responses (lines 732-822)

---

## ⚠️ IMPORTANT UPDATES

### 4. Missing API Endpoints

**In `client/lib/api.js`**:

**Add**:
- `updateEventContractId(id, contractEventId)` - PATCH /api/events/:id/contract-id

**Remove**:
- `login()` and `register()` - not needed (auto-registration)

**Fix**:
- `googleCallback()` - Change POST to GET with params

**Reference**: @api-spec.md - Table of Contents (lines 23-31)

---

### 5. Google Calendar OAuth

**Add**:
- Create `client/app/google-callback/page.jsx`
- Handle OAuth code parameter
- Call backend API with code
- Redirect to dashboard on success

**Fix Response Path**:
- `response.data.isGoogleCalendarAdded` → `response.data.data.isConnected`

**Reference**: @api-spec.md - Users API (lines 137-203)

---

## 📝 NICE TO HAVE

### 6. Pagination

- Add pagination UI to event lists
- Include `page`, `limit` params in API calls
- Handle pagination response data

**Reference**: @api-spec.md - GET /api/events (lines 325-378)

---

### 7. Filtering & Search

- Search input (title, description)
- Price range filters (minPrice, maxPrice)
- Sort options (dateTime, price, createdAt)
- Upcoming/past toggle

**Reference**: @api-spec.md - Query Parameters (lines 331-339)

---

### 8. PYUSD Decimal Conversion

**Critical for Blockchain**:
- Backend: 2 decimals (10.50)
- Blockchain: 6 decimals (10500000)

**Add Utilities**:
```javascript
backendToBlockchain(price) // multiply by 1,000,000
blockchainToBackend(price) // divide by 1,000,000
```

**Reference**: @api-spec.md - Notes for Frontend (line 903)

---

## 🛠️ FILE CHECKLIST

### Priority 1 (Blocking)
- [x] `client/lib/api.js` - Cookie auth + withCredentials
- [x] `client/store/authStore.js` - Remove tokens
- [x] `client/components/AuthSync.jsx` - Create cookie sync component
- [x] `client/components/Providers.jsx` - Add AuthSync component
- [x] `client/app/events/create/page.jsx` - 3-step flow
- [ ] All API handlers - Update response structure

### Priority 2 (Important)
- [x] `client/lib/api.js` - Add/remove endpoints
- [ ] `client/app/google-callback/page.jsx` - Create OAuth handler
- [ ] Error handlers - Use correct error structure

### Priority 3 (Polish)
- [ ] Add pagination to event lists
- [ ] Add search and filters
- [ ] Create PYUSD conversion utilities

---

## 📋 TESTING

After implementation, verify:

**Cookie Auth & Persistence:**
1. ✅ Cookie set on wallet connect
2. ✅ Cookie sent with all requests (withCredentials: true)
3. ✅ Cookie removed on wallet disconnect
4. ✅ Page reload maintains wallet connection AND cookie
5. ✅ Tab close & reopen restores connection AND cookie
6. ✅ Manual cookie deletion → Cookie recreated on reload

**Features:**
7. ✅ Event creation 3-step flow works
8. ✅ Google Calendar OAuth completes
9. ✅ Error messages display correctly
10. ✅ 401 errors prompt reconnect

---

**Status**: Ready for Implementation  
**Full API Documentation**: [@api-spec.md](./api-spec.md)

