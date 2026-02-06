import type { MetadataRoute } from "next";
import { getAllTopics } from "@/lib/topics";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://find-it.app";

  const topics = getAllTopics();

  const topicUrls: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${baseUrl}/topics/${topic.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...topicUrls,
  ];
}
