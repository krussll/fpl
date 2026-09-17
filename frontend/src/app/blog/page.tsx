import { Metadata } from "next";
import { getAllBlogPosts } from "@/data/blogPosts";
import BlogIndexClient from "./BlogIndexClient";

export const metadata: Metadata = {
  title: "FPL Strategy & Data Science Blog | FPL Hauls",
  description:
    "Data-backed Fantasy Premier League guides, low team value budget squad solutions, expected goals conceded clean sheet targets, and transfer strategies.",
  keywords: [
    "FPL blog",
    "Fantasy Premier League strategy",
    "FPL team value under 100m",
    "FPL expected goals conceded",
    "FPL clean sheet targets",
    "FPL transfer recommendations",
  ],
  openGraph: {
    title: "FPL Strategy & Data Science Blog | FPL Hauls",
    description:
      "Data-backed Fantasy Premier League guides, low team value budget squad solutions, and mathematical fixture models.",
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return <BlogIndexClient posts={posts} />;
}
