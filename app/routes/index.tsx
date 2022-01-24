import { json, LoaderFunction, useLoaderData } from "remix";

type StoryType = {
  by: string;
  descendants: number;
  id: number;
  kids: number[];
  score: number;
  time: number;
  title: string;
  type: string;
  url: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const allStoryRes = await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json"
  );
  const allStoryIds: string[] = await allStoryRes.json();

  const storiesPerPage = 30;

  const allStories = await Promise.all(
    allStoryIds.slice(0, storiesPerPage).map(async (id) => {
      const storyRes = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`
      );
      return storyRes.json();
    })
  );

  return json({ allStoryIds, allStories });
};

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
  style: "narrow",
});

const dateFormat = new Intl.DateTimeFormat("en", { timeStyle: "short" });

export default function Index() {
  const data = useLoaderData();
  return (
    <main>
      <h1>Hacker News Remix</h1>
      <section>
        {data?.allStories.map((story: StoryType) => {
          return (
            <article className="card card__story" key={story.id}>
              <section>
                <h2>{story.score}</h2>
              </section>
              <section className="grid">
                <a href={story.url || `/item/${story.id}`}>
                  <p>{story.title}</p>
                </a>

                <p>
                  By {story.by}{" "}
                  {dateFormat.format(new Date(story.time * 1_000))}
                  {" | "}
                  <a href={`/item/${story.id}`}>
                    {story.descendants || "0"} Comments
                  </a>
                </p>
              </section>
            </article>
          );
        })}
      </section>
      <pre></pre>
    </main>
  );
}
