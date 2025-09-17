CLEAN UI UPDATE - DROP-IN FILES
================================

These files are intended to be dropped into your existing Vue 3 + Vite + Tailwind project.
They include:
- Role-based router guard (src/router/index.ts)
- Cleaner screen with confirm/decline (src/pages/MyCleaning.vue)
- Customer bookings screen (src/pages/MyBookings.vue)
- Polished Login, Cart, Checkout
- New AppNav and AppFooter components
- Optional CSS utilities (src/assets/ui.css)

Instructions
-----------
1) Backup your project.
2) Copy the "src" folder content into your project "src" (merge/overwrite).
3) Ensure your auth store exposes:
   - isAuth: boolean
   - user: { role?: string, roles?: string[], customerId?: string, cleanerId?: string, id?: string }
   - login(payload) to set current user
4) Ensure you have a working axios service at '@/services/api' that exports default axios instance.
5) Add <AppNav /> at top and <AppFooter /> at bottom inside App.vue layout.

Router
------
- Customers -> /my-bookings
- Cleaners  -> /my-cleaning
Both routes are protected via meta.role and a global guard.
