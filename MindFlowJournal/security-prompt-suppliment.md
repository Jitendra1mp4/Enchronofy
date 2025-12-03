## 7. Prompt for the LLM Coder
*If you paste this into ChatGPT/Claude to write the code, use this prompt:*

> "Act as a React Native Security Expert. I need a utility class called `CryptoManager`. It should use `react-native-quick-crypto`.
>
> Implement the following methods based on the 'Centralized Data Key' architecture:
> 1. `initializeVault(password, qaPairs)`: Returns a Vault object with DK encrypted by Password, QA, and a generated Recovery Key.
> 2. `unlockWithPassword(vault, password)`: Returns the decrypted DK.
> 3. `unlockWithAnswers(vault, qaPairs)`: Returns the decrypted DK (no vault update).
> 4. `recoverAndReset(vault, recoveryKey, newPassword)`: Returns `{ newVault, newRecoveryKey }`.
> 5. `encryptNote(dk, text)` and `decryptNote(dk, cipherObj)`.
>
> Use AES-256-GCM and PBKDF2. Ensure strict typing."