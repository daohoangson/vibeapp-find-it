import { getRandomSuggestions } from "@/lib/suggestions";
import { getAllTopics, type Topic } from "@/lib/topics";
import { shuffle } from "@/lib/shuffle";
import HomeClient from "./home-client";

function getFeaturedTopics(count: number): Topic[] {
  const topics = getAllTopics();
  const shuffled = shuffle([...topics]);
  return shuffled.slice(0, count);
}

export default function Home() {
  const suggestions = getRandomSuggestions(4);
  const featuredTopics = getFeaturedTopics(6);

  return (
    <HomeClient suggestions={suggestions} featuredTopics={featuredTopics} />
  );
}
