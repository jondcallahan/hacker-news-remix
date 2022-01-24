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

  console.log("allStories", allStories);

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
            <a href={story.url || `/item/${story.id}`} key={story.id}>
              <article className="card card__story">
                <section>
                  <h2>{story.score}</h2>
                </section>
                <section>
                  <p>{story.title}</p>

                  <p>
                    By {story.by}{" "}
                    {dateFormat.format(new Date(story.time * 1_000))}
                    {" | "}
                    <a href={`/item/${story.id}`}>
                      {story.descendants} Comments
                    </a>
                  </p>
                </section>
              </article>
            </a>
          );
        })}
      </section>
      <pre></pre>
    </main>
  );
}
