# Next.js 14 + Supabase + Bootstrap Website

A modern, full-stack web application built with the latest technologies including Next.js 14, Supabase, Bootstrap 5, and more.

## 🚀 Technologies Used

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Styling**: Bootstrap 5, Bootstrap Icons
- **Components**: 
  - Swiper.js for interactive carousels
  - Recharts for data visualization and analytics
- **Notifications**: React Hot Toast for beautiful notifications
- **Development**: ESLint, Tailwind CSS (integrated with Bootstrap)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Bootstrap imports
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page showcasing all features
├── components/            # Reusable React components
│   ├── AnalyticsChart.tsx # Recharts visualization component
│   ├── AuthComponent.tsx  # Supabase authentication
│   ├── Button.tsx         # Bootstrap button component
│   ├── Card.tsx           # Bootstrap card component
│   ├── Carousel.tsx       # Swiper.js carousel component
│   └── ToastProvider.tsx  # React Hot Toast provider
├── lib/
│   └── supabase.ts        # Supabase client configuration
├── types/
│   └── index.ts           # TypeScript type definitions
└── styles/                # Additional CSS modules
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager
- Supabase account (optional, for auth features)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup (Optional)**
   
   For Supabase authentication to work, create a `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🎨 Features Showcase

### 🔔 React Hot Toast Notifications
- Success, error, and info toast messages
- Customizable positioning and styling
- Beautiful animations and icons

### 🎠 Swiper.js Carousels  
- Touch-friendly, responsive carousels
- Autoplay, navigation, and pagination
- Smooth transitions and effects

### 📊 Recharts Analytics
- Interactive bar, line, and pie charts
- Responsive design for all screen sizes
- Beautiful data visualizations

### 🔐 Supabase Authentication
- User sign up and sign in
- Secure authentication flow
- Real-time auth state management

### 🎨 Bootstrap 5 Components
- Modern, responsive UI components
- Bootstrap Icons integration
- Custom styling with CSS variables

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📦 Key Dependencies

### Frontend & UI
- `next` - React framework with App Router
- `react` - UI library
- `bootstrap` - CSS framework
- `bootstrap-icons` - Icon library

### Backend & Data
- `@supabase/supabase-js` - Supabase client

### Components & Utilities
- `swiper` - Touch slider component
- `recharts` - Charting library
- `react-hot-toast` - Notification system

### Development
- `typescript` - Type safety
- `eslint` - Code linting
- `tailwindcss` - Utility-first CSS (integrated with Bootstrap)

## 🌐 Deployment

This project can be deployed to:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Digital Ocean App Platform**
- Any hosting service that supports Node.js

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

## 🔧 Customization

### Adding New Components
1. Create component in `src/components/`
2. Add TypeScript types in `src/types/index.ts`
3. Import and use in your pages

### Styling
- Global styles in `src/app/globals.css`
- Bootstrap classes available throughout
- Custom CSS modules in `src/styles/`

### Database Setup
1. Create a Supabase project
2. Set up your database schema
3. Configure authentication providers
4. Update environment variables

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Bootstrap Documentation](https://getbootstrap.com/docs)
- [Swiper.js Documentation](https://swiperjs.com/)
- [Recharts Documentation](https://recharts.org/)

---

**Built with ❤️ using modern web technologies**
