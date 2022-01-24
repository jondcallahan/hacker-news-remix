import { json, LoaderFunction, redirect, useLoaderData } from "remix";

const fetchById = async (id: string) =>
  fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((res) =>
    res.json()
  );

const fetchAllKids = async (id: string) => {
  const item = await fetchById(id);

  await Promise.all(
    item.kids?.map(
      async (id: string, index: number) =>
        (item.kids[index] = await fetchAllKids(id))
    ) || []
  );

  return item;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { id } = params;

  if (!id) return redirect("/");

  const story = await fetchAllKids(id);

  return json({ story });
};
const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeStyle: "short",
});

export default function Item() {
  const { story, allComments = [] } = useLoaderData();

  if (!story) {
    return null;
  }

  function renderKids(kids) {
    return (
      <>
        {kids?.map((kid) =>
          kid.dead ? null : (
            <details key={kid.id} open>
              <summary>
                {kid.by} | {kid.kids?.length || "0"}{" "}
                {kid.kids?.length === 1 ? "comment" : "comments"}
              </summary>
              <div
                className="text"
                dangerouslySetInnerHTML={{ __html: kid.text }}
              ></div>
              {kid.kids?.length && renderKids(kid.kids)}
            </details>
          )
        )}
      </>
    );
  }

  return (
    <main>
      <h3>{story?.title}</h3>
      <a href={story.url}>{story.url}</a>
      <p>
        By {story.by} {dateFormat.format(new Date(story.time * 1_000))}
      </p>
      <div
        className="text"
        dangerouslySetInnerHTML={{ __html: story.text }}
      ></div>
      <section>
        {story.kids?.map((comment) => {
          if (!comment || comment.dead) return null;
          return (
            <details className="card card__comment" key={comment.id} open>
              <summary>
                {comment.by} | {comment.kids?.length || "0"}{" "}
                {comment.kids?.length === 1 ? "comment" : "comments"}
              </summary>
              <div
                className="text"
                dangerouslySetInnerHTML={{ __html: comment.text }}
              ></div>

              {comment.kids?.length && renderKids(comment.kids)}
            </details>
          );
        })}
      </section>
    </main>
  );
}
