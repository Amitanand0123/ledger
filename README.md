# Ledger 🚀

![Ledger Banner](https://via.placeholder.com/1200x630/8DBCC7/000000?text=Ledger)

**The ultimate tool to manage and track your job applications with ease. Stop juggling spreadsheets and start landing interviews.**

This full-stack monorepo application provides a beautiful, intuitive dashboard to track every stage of your job search, from initial application to final offer. It features a React/Next.js frontend, a robust Node.js/Express backend, and is deployed on a modern, scalable cloud architecture.

---

### ✨ Live Demo

-   **Application (Vercel):** [**https://ledger-app-gamma.vercel.app/**](https://ledger-app-gamma.vercel.app/)

> **Note:** The backend is hosted on Render's free tier and may "spin down" if inactive. The first request might take 20-30 seconds to wake up the server.

---

### 🌟 Key Features

*   **💼 Intuitive Job Board:** View all your applications in a clean, organized table.
*   **🖱️ Drag-and-Drop Reordering:** Easily prioritize your applications by dragging them into your preferred order.
*   **✅ Status Tracking:** Update job statuses with a simple, colorful combobox (Pending, OA, Interview, Hired, etc.).
*   **🔍 Advanced Filtering & Searching:** Quickly find applications by company, position, status, salary range, or application date.
*   **📊 Rich User Dashboard:** Visualize your job search progress with statistics on applications over time and a funnel chart of your statuses.
*   **📄 Document Management:** Securely upload and associate resumes and cover letters with specific job applications.
*   **🧠 AI-Powered Insights:** Generate an AI-powered summary and analysis of any job description to identify key skills and responsibilities (powered by Google Gemini).
*   **🔐 Secure Authentication:** Full user authentication system with email/password registration and Google OAuth for easy sign-in.
*   **📱 Fully Responsive Design:** A seamless experience on desktop, tablet, and mobile devices.
*   **🌓 Light & Dark Mode:** Automatic theme switching to match your system preference.

---

### 📸 Screenshots

| Desktop Dashboard | Job Form Modal |
| :---: | :---: |
| ![Dashboard Screenshot](https://via.placeholder.com/800x500?text=Dashboard+View) | ![Job Form Screenshot](https://via.placeholder.com/800x500?text=Job+Form+Modal) |

| Mobile View | Statistics Page |
| :---: | :---: |
| ![Mobile View Screenshot](https://via.placeholder.com/400x700?text=Mobile+View) | ![Stats Screenshot](https://via.placeholder.com/800x500?text=Statistics+Page) |


---

### 🛠️ Tech Stack & Architecture

This project is a monorepo managed with **npm workspaces**.

#### **Frontend** (`/frontend`)
-   **Framework:** [Next.js](https://nextjs.org/) 14 (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [Shadcn/UI](https://ui.shadcn.com/)
-   **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/) & [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
-   **Drag & Drop:** [dnd-kit](https://dndkit.com/)
-   **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
-   **Charts:** [Recharts](https://recharts.org/)

#### **Backend** (`/backend`)
-   **Framework:** [Express.js](https://expressjs.com/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Database:** [PostgreSQL](https://www.postgresql.org/)
-   **ORM:** [Prisma](https://www.prisma.io/)
-   **Authentication:** [JWT](https://jwt.io/), [NextAuth.js](https://next-auth.js.org/) (integration), [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
-   **Real-time:** [Socket.IO](https://socket.io/) (for future real-time updates)
-   **AI Integration:** [Google Gemini API](https://ai.google.dev/)

#### **DevOps & Deployment**
-   **CI/CD:** [GitHub Actions](https://github.com/features/actions) for continuous integration.
-   **Frontend Hosting:** [Vercel](https://vercel.com/) for continuous deployment.
-   **Backend Hosting:** [Render](https://render.com/) for continuous deployment.
-   **File Storage:** [Amazon S3](https://aws.amazon.com/s3/) for secure document uploads.
-   **Containerization:** [Docker](https://www.docker.com/)

---

### 🚀 Getting Started Locally

Follow these steps to set up and run the project on your local machine.

#### **Prerequisites**
-   [Node.js](https://nodejs.org/en/) (v20.x or later)
-   [npm](https://www.npmjs.com/) (v9.x or later)
-   [PostgreSQL](https://www.postgresql.org/download/) database running locally or on a service like Supabase.
-   An AWS S3 bucket with IAM user credentials.
-   A Google Gemini API Key.

#### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/jobtracker-pro-monorepo.git
cd jobtracker-pro-monorepo
Use code with caution.
Markdown
2. Install Dependencies
This command installs dependencies for the root, frontend, and backend workspaces.
Generated bash
npm run install:all
Use code with caution.
Bash
3. Set Up Environment Variables
Backend (/backend/.env):
Create a .env file in the /backend directory and fill it with your credentials.
Generated dotenv
# Your local PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# AWS S3 credentials
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
AWS_REGION=...

# A random string for JWT
JWT_SECRET=your_super_secret_string

# Gemini API Key
GEMINI_API_KEY=...

# Your local frontend URL
CLIENT_URL=http://localhost:3021
PORT=5000
Use code with caution.
Dotenv
Frontend (/frontend/.env.local):
Create a .env.local file in the /frontend directory.
Generated dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
Use code with caution.
Dotenv
4. Set Up the Database
Run Prisma Migrate to set up your database schema.
Generated bash
npm run db:migrate --workspace=backend
Use code with caution.
Bash
Optionally, seed the database with sample data:
Generated bash
npm run db:seed --workspace=backend
Use code with caution.
Bash
5. Run the Application
This command uses npm-run-all to start both the backend and frontend servers concurrently.
Generated bash
npm run dev
Use code with caution.
Bash
Backend API will be available at http://localhost:5000
Frontend will be available at http://localhost:3021
👨‍💻 Author
Amit anand
GitHub: @Amitanand0123
LinkedIn: Amit Anand
