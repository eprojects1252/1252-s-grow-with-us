# Sri Amirthaa E-Commerce — Version 1.0

A responsive Next.js storefront prototype with a premium glass-inspired visual direction.

## Included in V1
- Responsive storefront for desktop and mobile
- 26 main categories with subcategory navigation
- Product search and category filtering (sample product data)
- Shopping cart with quantity controls (client-side state)
- Sri Amirthaa ID sign-in entry UI (not connected to authentication yet)
- Mobile recharge request form (demo only; no payment or operator recharge)
- Admin category/subcategory management preview at `/admin` (not secured or persisted)

## Requirements
- Node.js 20.9+ recommended
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Build
```bash
npm run build
npm start
```

## Deploy
1. Create a GitHub repository named `amirthaa-ecommerce`.
2. Upload the project files to the repository root.
3. Import the repository into Vercel.
4. Use the default Next.js build settings.
5. Deploy and open the Preview URL on your phone.

## Important before production
This is a frontend-first V1 prototype. Do not accept real payments or real recharge orders yet.
- Connect the central Sri Amirthaa ID authentication service using a secure OpenID Connect flow.
- Protect `/admin` with server-verified admin roles; the current admin route is a demo and must not be treated as secure.
- Persist categories/products/orders in a database with authorization policies.
- Integrate a payment gateway and verify payment server-side/webhooks before creating paid orders.
- Implement manual recharge operations with admin audit logs, payment verification, idempotency, failure/refund states and customer notifications.
- Configure allowed redirect URLs and OAuth credentials for Google/Apple providers.
- Add privacy policy, terms, refund policy, shipping policy and support contact details.
- Replace sample emoji product art and sample data with real approved product images and inventory.

## Project notes
- Product inventory and prices are sample placeholders.
- Cart currently lives only in browser memory and clears on refresh.
- Recharge form does not collect money, submit to an operator, or create a real order.
- Authentication buttons show integration notices only.
