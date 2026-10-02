# Pharmex — Redesigned Screens (Flutter)

This is the redesigned UI (same design language used in the HTML mockups)
converted to Flutter widgets, ready to drop into your existing app.

## 1. Add the dependency

```
flutter pub add google_fonts
```

## 2. Copy the folders in

Copy `lib/theme/`, `lib/widgets/`, and `lib/screens/` into your existing
`lib/` folder. Nothing here depends on your current code, so it's safe to
add alongside what you already have — then swap your old screens for
these one at a time.

## 3. Apply the theme

```dart
import 'theme/app_theme.dart';

MaterialApp(
  theme: AppTheme.light(),
  home: const HomeScreen(),
);
```

## What's included

| File | Matches |
|---|---|
| `theme/app_colors.dart` | Color tokens (brand greens, mint, ink, muted, line, amber, violet) |
| `theme/app_theme.dart` | Manrope font + Material theme |
| `widgets/app_bottom_nav.dart` | Bottom nav with the raised green Call button |
| `widgets/dark_status_header.dart` | Dark gradient bar for status-bar consistency |
| `screens/home_screen.dart` | Home — greeting, search, Talk to a Doctor banner, categories, nearby pharmacies |
| `screens/orders_screen.dart` + `order_detail_sheet.dart` | My Orders list + detail bottom sheet |
| `screens/telemedicine_screen.dart` | Live Consultation banner + Book/Call cards |
| `screens/choose_pharmacy_screen.dart` | Pharmacy list with Call/Book actions |
| `screens/book_appointment_screen.dart` | Time slot picker + note field |
| `screens/prescriptions_screen.dart` + `prescription_detail_sheet.dart` | Rx list + detail bottom sheet |
| `screens/profile_screen.dart` | Account card + settings menu |
| `screens/notifications_screen.dart` | Unread (green border) vs read notifications |

## Wiring it to real data

Every screen takes plain constructor parameters or simple model classes
(`OrderItem`, `Prescription`, `AppNotification`) — no state management is
assumed, so you can feed them from Provider, Riverpod, Bloc, or whatever
you're already using. Replace the default sample values in each
screen's constructor with your API/DB results.

## Notes

- Colors match the web mockups exactly (see `app_colors.dart`).
- The bottom nav's `onTap` callbacks are stubs — wire them to your
  `Navigator` or router of choice.
- `DarkStatusHeader` is optional — only needed if you want the same dark
  status-bar backdrop on screens beyond Home; each inner screen here
  already uses the standard white `AppBar` (matching your screenshots),
  so you likely won't need it unless you add more hero-style screens.
