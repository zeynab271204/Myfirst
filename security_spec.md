# Security Specification for SageSupport Pro

## Data Invariants
1. A **Ticket** must be associated with a valid `companyId` and `clientId`.
2. A **Message** must belong to an existing **Ticket**.
3. **Clients** can only view and create tickets for their own company.
4. **Agents** can view and update all tickets.
5. **Admins** have full access to users, companies, and tickets.
6. **User Profiles** can only be edited by the owner (limited fields) or an Admin.

## The Dirty Dozen Payloads (Red Team Test Cases)
1. **Identity Theft (Ticket Creation)**: A client attempts to create a ticket for another company.
2. **Privilege Escalation (Role Change)**: A client attempts to update their own role from 'client' to 'admin'.
3. **Shadow Field Injection**: Creating a ticket with an unauthorized extra field `isResolvedByAI: true`.
4. **Status Shortcutting**: A client attempts to close a ticket that hasn't been started.
5. **Orphaned Message**: Attempting to post a message to a ticket ID that doesn't exist.
6. **Denial of Wallet**: Sending a 500kb string as a ticket title.
7. **Cross-Company Access**: Client A attempts to read tickets from Client B's company.
8. **PII Leak**: Client A attempts to read the private profile of Client B.
9. **Timestamp Spoofing**: Sending a `createdAt` value from 2020.
10. **ID Poisoning**: Using a 2kb special-character document ID.
11. **Admin Mockery**: Attempting to set `isAdmin: true` on a profile manually.
12. **Ghost Update**: Attempting to set `agentId` on a ticket without being an agent.

## Implementation Path
- **Phase 3**: Global helpers (isSignedIn, isAdmin, isValidId, etc.)
- **Phase 4**: Entity-specific validation helpers and match blocks.
- **Phase 5**: Final audit and deployment.
