
# Ledger 🚀

![Ledger Banner](https://via.placeholder.com/1200x630/8DBCC7/000000?text=Ledger%20-%20Job%20Application%20Tracker)

**The ultimate tool to manage and track your job applications with ease. Stop juggling spreadsheets and start landing interviews.**

This full-stack monorepo application provides a beautiful, intuitive dashboard to track every stage of your job search, from initial application to final offer. It features a React/Next.js frontend, a robust Node.js/Express backend, an AI-powered analysis service, and a Chrome Extension for quickly saving jobs from the web.

---

### ✨ Live Demo

-   **Application (Vercel):** [**https://ledger-app-gamma.vercel.app/**](https://ledger-app-gamma.vercel.app/)

> **Note:** The backend services are hosted on Render's free tier and may "spin down" if inactive. The first request might take 20-30 seconds to wake up the servers.

---

### 🌟 Key Features

*   **💼 Intuitive Job Board:** View all your applications in a clean, filterable, and sortable table.
*   **🖱️ Drag-and-Drop Reordering:** Easily prioritize your applications by dragging them into your preferred order.
*   **✅ Advanced Status Tracking:** Update job statuses with a simple, colorful combobox (Pending, OA, Interview, Hired, etc.).
*   **🌐 Chrome Extension Clipper:** Quickly scrape and save job postings from LinkedIn, Indeed, and more directly to your board.
*   **🧠 AI-Powered Insights:**
    *   **AI Career Coach:** Get personalized advice on how to tailor your resume for a specific job description.
    *   **AI Summary:** Generate an AI-powered summary of any job description to identify key skills and responsibilities.
    *   **AI Resume Rebuilder:** Automatically rewrite the content of your LaTeX resume to be perfectly tailored for a job and generate a new PDF.
*   **📊 Rich User Dashboard:** Visualize your job search progress with statistics on applications over time and a funnel chart of your statuses.
*   **📄 Secure Document Management:** Upload and associate resumes and cover letters with specific job applications via secure AWS S3 storage.
*   **📅 Google Calendar Sync:** Connect your Google Calendar to schedule interviews directly from the app.
*   **🔗 Automation & Integrations:** Sync your job board with Airtable or trigger custom workflows with Zapier webhooks.
*   **🔐 Secure Authentication:** Full user authentication system with email/password registration and Google OAuth for easy sign-in.
*   **📱 Fully Responsive Design:** A seamless experience on desktop, tablet, and mobile devices.
*   **🌓 Light & Dark Mode:** Automatic theme switching to match your system preference.

---

### 📸 Screenshots

| Desktop Dashboard | Job Details & AI Coach |
| :---: | :---: |
| ![Dashboard Screenshot](https://via.placeholder.com/800x500/8DBCC7/FFFFFF?text=Dashboard+View) | ![Job Details Screenshot](https://via.placeholder.com/800x500/2c3e50/FFFFFF?text=AI+Coach+View) |

| Mobile View | Statistics Page |
| :---: | :---: |
| ![Mobile View Screenshot](https://via.placeholder.com/400x700/8DBCC7/FFFFFF?text=Mobile+View) | ![Stats Screenshot](https://via.placeholder.com/800x500/2c3e50/FFFFFF?text=Statistics+Page) |


---

### 🛠️ Tech Stack & Architecture

This project is a monorepo managed with **npm workspaces**, consisting of four main services:

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
-   **Authentication:** [JWT](https://jwt.io/), [NextAuth.js](https://next-auth.js.org/) (integration)
-   **Real-time:** [Socket.IO](https://socket.io/) for live board updates.

#### **AI Service** (`/ai-service`)
-   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
-   **AI Integration:** [Google Gemini API](https://ai.google.dev/)
-   **Vector Search:** [Pinecone](https://www.pinecone.io/) for finding similar jobs.
-   **Tooling:** [LangChain](https://www.langchain.com/) & [LangGraph](https://langchain-ai.github.io/langgraph/) for building agentic workflows.
-   **PDF Generation:** `pdflatex` integration for AI Resume Rebuilder.

#### **Chrome Extension** (`/chrome-extension`)
-   **Platform:** Manifest V3
-   **Framework:** Vanilla JavaScript, HTML, CSS
-   **Functionality:** Scrapes job data from popular sites and sends it to the backend API.

#### **DevOps & Deployment**
-   **CI/CD:** [GitHub Actions](https://github.com/features/actions) for continuous integration and deployment.
-   **Frontend Hosting:** [Vercel](https://vercel.com/)
-   **Backend & AI Service Hosting:** [Render](https://render.com/)
-   **Database Hosting:** [Neon](https://neon.tech/) (or any PostgreSQL provider)
-   **File Storage:** [Amazon S3](https://aws.amazon.com/s3/) for secure document uploads.
-   **Containerization:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) for a unified local development environment.

---

### 🚀 Getting Started Locally

Follow these steps to set up and run the entire project on your local machine.

#### **Prerequisites**
-   [Node.js](https://nodejs.org/en/) (v20.x or later)
-   [npm](https://www.npmjs.com/) (v9.x or later)
-   [Python](https://www.python.org/) (v3.10 or later)
-   [Docker](https://www.docker.com/get-started/) and Docker Compose
-   A PostgreSQL database running locally or on a service like Neon.
-   An AWS S3 bucket with IAM user credentials.
-   A Google Gemini API Key.
-   A Pinecone API Key and Environment.

#### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/ledger.git
cd ledger
```

#### **2. Set Up Environment Variables**
You will need three separate `.env` files. Use the provided `.example` files as templates.

**a. Backend (`/backend/.env`)**
```dotenv
# Your PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# A random string for JWT
JWT_SECRET=your_super_secret_string

# Your local frontend URL
CLIENT_URL=http://localhost:3021

# AWS S3 credentials
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
AWS_REGION=...

# URL for the local AI Service container
AI_SERVICE_URL=http://localhost:8000
# A private key to secure backend-to-AI-service communication
AI_SERVICE_API_KEY=a_shared_secret_between_services

# Google OAuth Credentials (for GCal Sync)
GCAL_CLIENT_ID=...
GCAL_CLIENT_SECRET=...
GCAL_REDIRECT_URI=http://localhost:5000/api/v1/gcal/oauth2callback
```

**b. AI Service (`/ai-service/.env`)**
```dotenv
# The same private key from the backend .env
AI_SERVICE_API_KEY=a_shared_secret_between_services

# Your Pinecone credentials
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=ledger

# Your Google Gemini API Key
GEMINI_API_KEY=...
```

**c. Frontend (`/frontend/.env.local`)**
```dotenv
# The URL for the local backend container
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth.js configuration
NEXTAUTH_URL=http://localhost:3021
NEXTAUTH_SECRET=a_different_random_string_for_nextauth

# Google OAuth Credentials (for Frontend Login)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

#### **3. Set Up the Database**
Run Prisma Migrate to set up your database schema.

```bash
# This command runs the script defined in the root package.json
npm run db:migrate
```

Optionally, seed the database with sample data:

```bash
npm run db:seed
```

#### **4. Run the Application with Docker Compose**
This is the easiest way to run all services together.

```bash
# Navigate to the infrastructure directory
cd infrastructure

# Build and start all containers in the background
docker-compose up --build -d
```
*   **Backend API** will be available at `http://localhost:5000`
*   **Frontend App** will be available at `http://localhost:3021`
*   **AI Service** will be available at `http://localhost:8000`

---

### 👨‍💻 Author

**Amit Anand**
*   **GitHub:** [@Amitanand0123](https://github.com/Amitanand0123)
*   **LinkedIn:** [Amit Anand](https://www.linkedin.com/in/amitanand0123/)