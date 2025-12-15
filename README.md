# 🎭 Ditto

> Transform memes and anime screenshots with your own characters using AI

Ditto is a modern web platform that allows users to browse various famous 2D/3D images (memes, anime screenshots, comics, album art) and replace the main character with their own virtual character. No complex prompt writing required - just select, upload, and generate!

## ✨ Features

- 🖼️ **Image Gallery** - Browse a wide collection of meme templates, anime screenshots, and more
- 🤖 **AI-Powered Generation** - Replace characters in images using advanced AI models
- 👤 **GitHub Authentication** - Simple sign-in with your GitHub account
- 📤 **Upload Templates** - Share your own prompt templates with the community
- 🌐 **Multi-language Support** - Available in English, Chinese (简体中文), and Japanese (日本語)
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI** - Built with Shadcn UI and Tailwind CSS

## 🛠️ Tech Stack

### Core Technologies

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth with GitHub OAuth
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Validation**: [Zod](https://github.com/colinhacks/zod)
- **Internationalization**: [next-intl](https://next-intl.dev/)

### AI Services

- **Image Generation**: OpenRouter API (supports multiple models)
- **Image Upscaling**: browser side waifu2x from [nunif](https://github.com/nagadomi/nunif) on GitHub

GPL-3.0-only ライセンスに基づき、nagadomi (unlimited.waifu2x.net) さんの ONNX モデルを利用させていただきました。すばらしい技術をご提供いただき、誠にありがとうございます。また、モデルの使用に関して著作権侵害等の問題がございましたら、遠慮なくご連絡ください。速やかに対応いたします。

### Development Tools

- **Code Formatting**: Prettier
- **Linting**: ESLint
- **Type Checking**: TypeScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20.x or higher
- npm or pnpm
- Git
- A Supabase account
- A GitHub OAuth App (for authentication)
- OpenRouter API key (for AI generation)

## 🚀 Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/ditto.git
cd ditto
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install

# or

pnpm install
\`\`\`

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Wait for the project to be fully set up

#### Run the Database Schema

1. Navigate to your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of `supabase/schema.sql` and execute it
4. This will create all necessary tables, policies, and triggers

#### Set Up GitHub OAuth

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable the **GitHub** provider
3. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps > New OAuth App
   - **Application name**: Ditto (or your preferred name)
   - **Homepage URL**: \`http://localhost:3000\` (for development)
   - **Authorization callback URL**: Your Supabase Auth callback URL
     - Found in Supabase: Authentication > Providers > GitHub
     - Format: \`https://<your-project-ref>.supabase.co/auth/v1/callback\`
4. Copy the **Client ID** and **Client Secret** to your Supabase GitHub provider settings
5. Save the configuration

### 4. Configure Environment Variables

1. Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

2. Edit \`.env.local\` with your credentials:

\`\`\`env

# Supabase Configuration

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL (for OpenRouter API integration)

NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: For image upscaling

REAL_ESRGAN_API_KEY=your-real-esrgan-api-key

# Site URL (for production)

NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

**Where to find Supabase credentials:**

- Go to your Supabase project dashboard
- Click on the **Settings** icon (⚙️) in the left sidebar
- Navigate to **API**
- Copy the **Project URL** and **anon public** key

**OpenRouter API Key:**

- Sign up at [OpenRouter](https://openrouter.ai/)
- Go to your account settings to get your API key

### 5. Run the Development Server

\`\`\`bash
npm run dev

# or

pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

\`\`\`
ditto/
├── app/
│ ├── [locale]/ # Internationalized routes
│ │ ├── (main)/ # Main application pages
│ │ │ ├── gallery/ # Image gallery
│ │ │ ├── image/ # Image detail pages
│ │ │ ├── upload/ # Upload template page
│ │ │ ├── profile/ # User profile
│ │ │ └── signin/ # Sign in page
│ │ └── layout.tsx # Locale layout
│ ├── api/ # API routes
│ │ ├── auth/ # Authentication endpoints
│ │ └── generate/ # Image generation endpoint
│ └── auth/ # Auth callback
├── components/
│ ├── ui/ # Shadcn UI components
│ ├── Navigation.tsx # Navigation bar
│ └── Footer.tsx # Footer component
├── i18n/
│ ├── config.ts # i18n configuration
│ └── routing.ts # Locale routing
├── lib/
│ ├── supabase/ # Supabase clients
│ └── utils.ts # Utility functions
├── messages/ # Translation files
│ ├── en.json # English translations
│ ├── zh.json # Chinese translations
│ └── ja.json # Japanese translations
├── store/ # Zustand stores
│ ├── userStore.ts # User state
│ └── galleryStore.ts # Gallery state
├── supabase/
│ └── schema.sql # Database schema
├── types/
│ └── index.ts # TypeScript types
└── middleware.ts # Next.js middleware
\`\`\`

## 🎨 Customization

### Adding New Translations

1. Edit the translation files in the \`messages/\` directory:
   - \`en.json\` - English
   - \`zh.json\` - Chinese (Simplified)
   - \`ja.json\` - Japanese

2. Add your new keys following the existing structure:

\`\`\`json
{
"common": {
"newKey": "New translation"
}
}
\`\`\`

3. Use the translation in your components:

\`\`\`tsx
const t = useTranslations('common');
// ...

<p>{t('newKey')}</p>
\`\`\`

### Customizing Theme

The project uses Shadcn UI with Tailwind CSS. To customize:

1. Edit \`app/globals.css\` for color schemes
2. Modify \`tailwind.config.ts\` for theme extensions
3. Update \`components.json\` for Shadcn configuration

## 🔧 Development Commands

\`\`\`bash

# Start development server

npm run dev

# Build for production

npm run build

# Start production server

npm run start

# Run linting

npm run lint

# Format code with Prettier

npm run format

# Check code formatting

npm run format:check

# Type checking

npm run type-check
\`\`\`

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/) and import your repository
3. Configure environment variables in Vercel dashboard
4. Deploy!

**Important**: Update your GitHub OAuth callback URL to include your production domain.

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Use the Netlify CLI or connect your GitHub repo
- **Cloudflare Pages**: Deploy via their dashboard
- **AWS Amplify**: Connect your repository
- **Self-hosted**: Build with \`npm run build\` and run with \`npm start\`

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-key
OPENROUTER_API_KEY=your-api-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
\`\`\`

## 🔐 Security Considerations

- Never commit \`.env.local\` to version control
- Use Supabase Row Level Security (RLS) policies (already configured in schema)
- Keep your API keys secure and rotate them regularly
- Configure CORS properly in production
- Enable rate limiting for API endpoints

## 📝 TODO / Future Enhancements

The following features are planned but not yet implemented:

- [x] **AI Image Generation Integration**
  - Connect OpenRouter API for actual image generation
  - Implement prompt engineering logic
  - Add support for multiple AI models
- [ ] **Image Upscaling**
  - Integrate Real-ESRGAN for image enhancement
  - Add waifu2x support for anime-style images
- [x] **Advanced Features**
  - User favorites/bookmarks
  - Image generation history
  - Social sharing capabilities
  - Template categories and filtering
  - Search functionality with full-text search
  - User reputation system
  - Image moderation queue
- [ ] **Performance Optimizations**
  - Image CDN integration
  - Lazy loading and infinite scroll
  - Edge caching
  - Optimize bundle size

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components
- [OpenRouter](https://openrouter.ai/) - AI model routing
- [Vercel](https://vercel.com/) - Hosting platform

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ using Next.js and Supabase
