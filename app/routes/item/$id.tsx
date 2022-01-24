import { json, LoaderFunction, useLoaderData } from "remix";

export const loader: LoaderFunction = async ({ request, params }) => {
  const { id = "" } = params;

  const allCommentsRes = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
  ).then((res) => res.json());
  const allCommentIds: string[] = allCommentsRes.kids || [];

  const storiesPerPage = 30;
  console.log("allCommentIds", allCommentIds);
  const allComments = await Promise.all(
    allCommentIds.map(async (id) => {
      const storyRes = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`
      );
      return storyRes.json();
    })
  );

  console.log("allCommentsRes", allCommentsRes);

  return json({ allComments, story: allCommentsRes });
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
        {allComments?.map((comment) => {
          if (!comment || comment.dead) return null;
          return (
            <a className="card__link" key={comment.id} href={`${comment.id}`}>
              <article className="card card__comment">
                <div
                  className="text"
                  dangerouslySetInnerHTML={{ __html: comment.text }}
                ></div>
                <p className="comment__author">
                  {comment.by} | {comment.kids?.length || "0"} comments
                </p>
              </article>
            </a>
          );
        })}
      </section>
    </main>
  );
}
