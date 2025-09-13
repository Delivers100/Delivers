# Delivers Platform

A B2B e-commerce and delivery platform for Colombian businesses.

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or use Vercel Postgres)

### Local Development Setup

1. **Clone and Install Dependencies**
   ```bash
   cd delivers-platform
   npm install
   ```

2. **Set up Environment Variables**
   - Copy `.env.local` and update database credentials
   - For local development, you can use a local PostgreSQL database
   - For production, use Vercel Postgres

3. **Database Setup**
   - The app will automatically create tables on first API call
   - No separate migration needed

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   App will be available at `http://localhost:3000`

### Features Implemented

✅ **Authentication System**
- User registration (buyer/seller)
- Login/logout
- Role-based access control
- JWT token authentication

✅ **Landing Page**
- Professional design
- Colombian Spanish content
- Role-based registration flow

✅ **Database Schema**
- Users table with role management
- Products table
- Orders and order items
- Document verification system

### Next Steps

🚧 **In Progress**
- Seller verification workflow
- Document upload system

📋 **Planned Features**
- Product catalog management
- Order processing system
- Admin dashboard
- Payment integration (Wompi)
- Daily payout automation

### Deployment

The app is designed to deploy seamlessly on Vercel:

1. Connect your GitHub repo to Vercel
2. Set up Vercel Postgres database
3. Add environment variables in Vercel dashboard
4. Deploy

### Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Vercel Postgres)
- **Authentication**: JWT + HTTP-only cookies
- **Deployment**: Vercel

### Project Structure

```
src/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── page.tsx           # Landing page
├── lib/
│   ├── auth.ts            # Authentication utilities
│   └── db.ts              # Database utilities
└── middleware.ts          # Route protection
```

---

Built for Colombian businesses in Medellín 🇨🇴
