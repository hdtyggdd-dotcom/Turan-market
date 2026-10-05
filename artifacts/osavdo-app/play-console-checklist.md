# Turan Market — Play Console checklist

## Before creating the release

- [ ] Create or verify the Google Play Console developer account.
- [ ] Complete identity and developer profile verification.
- [ ] Publish the API server and confirm `/api/healthz` returns `{"status":"ok"}`.
- [ ] Add the production API domain to the Expo release build.
- [ ] Confirm the Privacy Policy URL opens publicly: `/api/privacy-policy`.
- [ ] Confirm account deletion/support contact details are real and monitored.

## Android release

- [ ] Keep application ID as `uz.turanmarket.app`.
- [ ] Build a signed Android App Bundle (`.aab`).
- [ ] Upload the `.aab` to an internal or closed testing track.
- [ ] Install the release build on physical Android devices.
- [ ] Test login, registration, image upload, location permission, listings, cargo and orders.
- [ ] Check that the production build does not show demo credentials.
- [ ] Confirm app icon, splash screen, orientation and back navigation.

## Play Console forms

- [ ] Store listing: name, descriptions, icon, screenshots and category.
- [ ] App access: provide reviewer instructions if login is required.
- [ ] Ads declaration.
- [ ] Data Safety form: account data, user content/photos, location and order data.
- [ ] Content rating questionnaire.
- [ ] Target audience and child safety declarations.
- [ ] Privacy Policy URL.
- [ ] Countries/regions and pricing settings.

## New personal developer account

Google may require a closed test with at least 12 opted-in testers continuously for 14 days before production access. Follow the exact requirement shown in the account’s Play Console.

## Production rollout

- [ ] Submit the closed-test build for review.
- [ ] Complete the production-access questionnaire if shown.
- [ ] Upload the production release after access is granted.
- [ ] Start with a staged rollout.
- [ ] Monitor crashes, login issues and API logs.