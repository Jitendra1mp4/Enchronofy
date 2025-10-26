Sprint 2 Progress Summary (10 Lines)
Here's what we've accomplished so far in Sprint 2:

Created Sprint 2 Branch: Set up sprint-2/authentication-and-recovery branch from develop

Encryption Service: Implemented PBKDF2 key derivation with 100,000 iterations for strong password-based encryption

AES Encryption: Built functions to encrypt/decrypt JSON objects and text using AES-256 encryption

Security Hashing: Added SHA-256 hashing for storing security question answers securely

Storage Service: Created comprehensive encrypted storage layer using AsyncStorage for journals, security questions, and app data

Re-encryption Support: Built functionality to re-encrypt all data when user changes password

Security Questions: Added 10 predefined security questions for password recovery

Auth Context: Implemented React Context to manage the encryption key in memory during user session

App Integration: Updated App.tsx to wrap the entire app with AuthProvider for session management