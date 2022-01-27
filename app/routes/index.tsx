import { json, Link, LoaderFunction, useLoaderData, useNavigate } from "remix";
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
  const navigate = useNavigate();

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
                <a
                  href={story.url || `/item/${story.id}`}
                  onKeyPress={(e) => {
                    // J key will advance to the next story
                    // K will go to previous
                    // C will go to comments
                    if (e.key === "j") {
                      try {
                        document
                          .querySelectorAll("article a[data-link-type=story]")
                          .forEach((val, idx, list) => {
                            if (val === document.activeElement) {
                              list[idx + 1].focus();
                              e.stopPropagation(); // Stop propogation so the listener on the <body> doesn't pick up the event
                              throw "stop"; // Using a throw to break the forEach loop
                            }
                          });
                      } catch {}
                    } else if (e.key === "k") {
                      // Go to previous story or last if on first
                      try {
                        document
                          .querySelectorAll("article a[data-link-type=story]")
                          .forEach((val, idx, list) => {
                            if (val === document.activeElement) {
                              if (idx === 0) {
                                list[list.length - 1].focus();
                              } else {
                                list[idx - 1].focus();
                              }

                              throw "stop"; // Using a throw to break the forEach loop
                            }
                          });
                      } catch {}
                    } else if (e.key === "c") {
                      navigate(`/item/${story.id}`);
                    }
                  }}
                  data-link-type="story"
                >
                  <p>{story.title}</p>
                </a>
                {story.url && <small>{new URL(story.url)?.hostname}</small>}
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
