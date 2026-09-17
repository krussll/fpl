import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Sparkles,
  Info,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Share2,
} from "lucide-react";
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/data/blogPosts";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found | FPL Hauls",
    };
  }

  return {
    title: `${post.title} | FPL Hauls Blog`,
    description: post.description,
    keywords: [post.targetKeyword, ...post.secondaryKeywords],
    openGraph: {
      title: `${post.title} | FPL Hauls`,
      description: post.description,
      type: "article",
      publishedTime: post.dateISO,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedBlogPosts(slug);

  return (
    <div className="relative overflow-hidden py-10 sm:py-16">
      {/* Background Accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div
          className="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-tr from-orange-200/25 via-amber-100/20 to-rose-200/20 opacity-60"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Top Back Link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#FE5803] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to all articles</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="border-b border-slate-200/80 pb-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#FE5803] ring-1 ring-orange-500/20">
              {post.category}
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{post.publishedAt}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{post.readingTime}</span>
            </div>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-[1.15]">
            {post.title}
          </h1>

          <p className="mt-5 text-lg sm:text-xl font-normal leading-relaxed text-slate-600">
            {post.subtitle}
          </p>

          {/* Author attribution row */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 font-bold text-sm text-[#FE5803] ring-1 ring-orange-500/20">
                {post.author.initials}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {post.author.name}
                </div>
                <div className="text-xs text-slate-500">{post.author.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-600">
                SEO Focus: {post.targetKeyword}
              </span>
            </div>
          </div>
        </header>

        {/* Table of Contents */}
        {post.tableOfContents.length > 0 && (
          <nav
            aria-label="Table of contents"
            className="my-10 rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-xs backdrop-blur-xs"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              In this article
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {post.tableOfContents.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="group inline-flex items-baseline gap-2 text-sm text-slate-600 hover:text-[#FE5803] transition-colors"
                  >
                    <span className="font-mono text-xs text-orange-500 font-medium">
                      0{index + 1}.
                    </span>
                    <span className="group-hover:underline underline-offset-4">
                      {item.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Main Article Content */}
        <article className="space-y-12 text-slate-700">
          {post.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 space-y-5"
            >
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {section.heading}
              </h2>

              {section.paragraphs.map((para, pIdx) => (
                <p
                  key={pIdx}
                  className="text-base sm:text-lg leading-relaxed text-slate-700"
                >
                  {para}
                </p>
              ))}

              {/* Callout Box */}
              {section.callout && (
                <div
                  className={`my-6 rounded-2xl border p-5 sm:p-6 ${
                    section.callout.type === "warning"
                      ? "border-amber-200 bg-amber-50/70 text-amber-950"
                      : "border-orange-200/90 bg-orange-50/60 text-slate-900"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {section.callout.type === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    ) : (
                      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#FE5803]" />
                    )}
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {section.callout.title}
                      </div>
                      <div className="mt-1 text-sm leading-relaxed text-slate-700">
                        {section.callout.text}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Table */}
              {section.table && (
                <div className="my-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  {section.table.caption && (
                    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-500">
                      {section.table.caption}
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-100/70 text-xs uppercase font-semibold text-slate-700">
                        <tr>
                          {section.table.headers.map((header, hIdx) => (
                            <th key={hIdx} className="px-4 py-3 font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {section.table.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="hover:bg-orange-50/30 transition-colors"
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`px-4 py-3 text-xs sm:text-sm ${
                                  cIdx === 0
                                    ? "font-semibold text-slate-900"
                                    : "text-slate-600"
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bullet points */}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="my-4 space-y-2.5 pl-1">
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#FE5803]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Related FPL Hauls Tool Spotlight Card */}
          <div className="my-12 rounded-3xl border border-orange-300/80 bg-gradient-to-br from-orange-50/90 via-amber-50/30 to-white p-7 sm:p-9 shadow-md shadow-orange-500/5">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#FE5803] ring-1 ring-orange-500/20 shadow-xs">
                  {post.relatedTool.badge}
                </span>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {post.relatedTool.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {post.relatedTool.description}
                </p>
              </div>

              <Link
                href={post.relatedTool.href}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#FE5803] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 hover:bg-[#DE4902] transition-colors"
              >
                <span>{post.relatedTool.buttonText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>

        {/* Author Bio Box */}
        <div className="mt-14 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FE5803] to-[#FF8C44] text-xl font-bold text-white shadow-sm">
              {post.author.initials}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Written by
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {post.author.name}
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {post.author.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Back Navigation */}
        <div className="mt-10 flex items-center justify-between border-t border-slate-200/80 pt-6">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#FE5803] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>← Back to all articles</span>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-[#FE5803] transition-colors"
          >
            Home
          </Link>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 border-t border-slate-200/80 pt-12">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              More Guides & Strategy
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {relatedPosts.map((rPost) => (
                <Link
                  key={rPost.slug}
                  href={`/blog/${rPost.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div>
                    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-[#FE5803] ring-1 ring-orange-500/20">
                      {rPost.category}
                    </span>
                    <h4 className="mt-3 text-base font-bold text-slate-900 group-hover:text-[#FE5803] transition-colors leading-snug">
                      {rPost.title}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                      {rPost.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                    <span>{rPost.readingTime}</span>
                    <span className="font-semibold text-[#FE5803] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Read article <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
