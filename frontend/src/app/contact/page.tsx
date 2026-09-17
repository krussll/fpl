import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export const metadata = {
  title: "Contact | FPL Hauls",
  description: "Get in touch with the FPL Hauls development and data science team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#FE5803] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Have feedback, questions on prediction models, or feature suggestions? Reach out directly.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 text-slate-900 font-bold text-lg">
          <Mail className="h-5 w-5 text-[#FE5803]" />
          <span>Support & Inquiries</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          For technical issues, prediction models, API integrations, or suggestions, send an inquiry:
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="text-xs font-semibold uppercase text-slate-400">Email</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              support@fplhauls.com
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="text-xs font-semibold uppercase text-slate-400">Community & Analytics</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              GitHub Discussions & Community Feedback
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
