---
name: Interface language policy
description: Whole-app language selection, customer-content boundaries, and verification of custom locale transforms.
---

The selected interface language must apply throughout the application, not only to login labels. Language and country remain independent choices.

**Why:** The owner explicitly requested that selecting a language makes all application writing use that language, after finding mixed-language screens.

**How to apply:** Include navigation, forms, errors, guides, public category labels and new AI replies. Preserve the saved selection and account/session state when switching. Keep native language names as recognizable endonyms. Customer names and private messages remain original.

Public product listing titles and descriptions should automatically display in the selected language, while the seller's saved original remains unchanged and available to view.

**Why:** The owner explicitly extended whole-app language selection to posted product ads; requiring a separate translate action is no longer the desired browsing flow.

**How to apply:** Label AI translations and allow viewing the original. Preserve numbers and contact details; do not claim untranslated fallback text is translated when the provider or budget is unavailable. Keep owner-funded AI reservations and cache translations by content and language; derived text must be erased when its listing or account is deleted.

Custom Babel-transform changes can leave Metro serving stale application JavaScript even when an isolated transformation passes.

**Why:** A localization transform initially prevented nested TypeScript assertions from being removed. After the source fix, the served bundle still contained the previous invalid JavaScript until Metro's transform-cache identity changed.

**How to apply:** Test the actual emitted JavaScript, not merely parsing source with TypeScript enabled. Ensure custom-transform changes invalidate Metro's persistent cache; a workflow restart alone is not proof that the fix is being served.

Pass the selected language explicitly through render-time translation helpers, even when a language-store subscription triggers rerenders.

**Why:** React Compiler memoized static-label translation by its unchanged children because the language dependency was hidden in global state. Dynamic country labels changed, while static titles and buttons remained in the previous language.

**How to apply:** Treat locale as an explicit input to translated render computations and test language switches with the compiler enabled and unchanged label props.
