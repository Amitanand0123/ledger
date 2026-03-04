import { Package2, BarChart3, Brain, Calendar, FileText } from 'lucide-react';

const features = [
    { icon: FileText, text: 'Track all your job applications in one place' },
    { icon: Brain, text: 'AI-powered resume analysis & ATS scoring' },
    { icon: Calendar, text: 'Interview scheduling & preparation tools' },
    { icon: BarChart3, text: 'Insights & analytics on your job search' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-12 xl:px-20 text-white" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <Package2 className="h-10 w-10 text-blue-400" />
                        <span className="text-4xl font-bold tracking-tight">Ledger</span>
                    </div>

                    <h2 className="text-2xl xl:text-3xl font-semibold mb-4 leading-tight text-gray-100">
                        Your Job Search,<br />Organized.
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-md">
                        Stop juggling spreadsheets. Manage applications, prep for interviews, and land your next role — all from one dashboard.
                    </p>

                    <div className="space-y-5">
                        {features.map((feature) => (
                            <div key={feature.text} className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                    <feature.icon className="h-5 w-5 text-blue-400" />
                                </div>
                                <span className="text-gray-300">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decorative accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full translate-y-1/3 -translate-x-1/3" />
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex items-center justify-center bg-muted/40 p-4 sm:p-8 overflow-y-auto">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
