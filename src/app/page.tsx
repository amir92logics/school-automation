export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
            <h1 className="text-5xl font-extrabold text-blue-600 mb-6 tracking-tight">EduSaaS Production</h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl font-medium leading-relaxed">
                The ultimate multi-tenant portal for scaling educational institutions with precision and performance.
            </p>
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
                <a
                    href="/super-admin/login"
                    className="flex-1 bg-white border-2 border-blue-600 text-blue-600 px-8 py-5 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl shadow-blue-50 hover:-translate-y-1"
                >
                    Super Admin Console
                </a>
                <a
                    href="/school/login"
                    className="flex-1 bg-blue-600 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1"
                >
                    School Admin Portal
                </a>
            </div>
            <footer className="mt-20 text-gray-400 text-sm font-bold uppercase tracking-widest">
                Powered by Next.js 14 & MongoDB
            </footer>
        </div>
    );
}
