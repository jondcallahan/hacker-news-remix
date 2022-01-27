import { json, Link, LoaderFunction, useLoaderData } from "remix";
import { getItem, getTopStories } from "~/utils/api.server";

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
  const storiesPerPage = 30;
  const allStoryIds = await getTopStories(storiesPerPage);

  const allStories = await Promise.all(
    allStoryIds.slice(0, storiesPerPage).map(async (id) => {
      return await getItem(id);
    })
  );

  return json({ allStories });
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

                <section className="grid author-line">
                  <p>
                    By {story.by}{" "}
                    {dateFormat.format(new Date(story.time * 1_000))}
                    {" | "}
                  </p>
                  <Link to={`/item/${story.id}`} prefetch="intent">
                    <p>{story.descendants || "0"} Comments</p>
                  </Link>
                </section>
              </section>
            </article>
          );
        })}
      </section>
      <pre></pre>
    </main>
  );
}
