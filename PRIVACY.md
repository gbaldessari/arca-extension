# Privacy policy

[Español](PRIVACY.es.md)

Arca for Microsoft Edge, and the Arca app it talks to, are made by Giacomo Baldessari. This policy says what they access and where that data goes. Last updated on 1 October 2026.

## What Arca is for

The extension fills, suggests, and saves passwords for the site you have open. It does that by talking to the Arca app on the same computer. There is no Arca account and no Arca server.

The same extension can be installed in other browsers. The handling of your data does not change.

## What is accessed

On a sign-in or sign-up form, the extension reads the username and password fields, and the address of the current tab. A username may be an email address or a name. It does not read the rest of the page.

If you unlock Arca from the extension, the master password you type is sent to the app on this computer. It is not stored by the extension. If you use Windows Hello, the extension only asks the app to unlock. Your PIN, fingerprint, or face stays with Windows.

When you choose an entry, the app returns the username and password for that site, and only while the vault is unlocked. The extension then writes them into the form. The site receives them the same way it would if you had typed them.

## Where it is stored

The vault is an encrypted file on your computer, at `%APPDATA%\com.arca.vault\arca.db`. The extension does not keep a copy and does not decrypt it.

A username and password you just submitted stay in the browser's session storage for up to 3 minutes, so the extension can ask whether to save them. That copy is removed when you save, when you dismiss the prompt, when the tab closes, or when those 3 minutes pass.

The extension also stores one preference on this computer: whether Windows Hello is the default way to unlock. That preference is not a password.

Copying a password is done by the app. The app clears the clipboard after 30 seconds.

## What leaves this computer

Nothing the extension reads is sent to Giacomo Baldessari, to Microsoft, or to any other server. The extension has no analytics, no advertising, and no crash reporting.

The only program that receives your passwords is the Arca app on this computer, through the local host `com.arca.vault`. The key for that channel changes every time Arca starts.

Arca does not sell, rent, or share your data. It does not use it for credit, lending, or advertising, and it does not use it for anything other than filling, suggesting, and saving your own passwords.

## Your controls

You can turn browser integration off in the app's Settings. You can dismiss a save prompt. You can edit or delete entries in the app. You can remove the extension from Microsoft Edge. Removing it does not delete the vault.

Your data stays on your computer. There is no remote copy to request or erase. If you forget the master password, the vault cannot be opened.

## Children

Arca is not directed at children under 13.

## Changes

If this policy changes, the new text is published at this same address, with a new date.

## Contact

Questions go to the [issue tracker](https://github.com/gbaldessari/arca-extension/issues).
