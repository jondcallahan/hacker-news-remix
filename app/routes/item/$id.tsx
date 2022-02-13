import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
  redirect,
  useLoaderData,
} from "remix";
import { getItem } from "~/utils/api.server";
import stylesUrl from "~/styles/item.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: stylesUrl,
  },
];

export const handle = {
  showBreadcrumb: true,
};

export const meta: MetaFunction = ({ data }) => ({
  title: `HN | ${data.story.title}`,
});

const fetchById = async (id: string) => await getItem(id);

const fetchAllKids = async (id: string) => {
  const item = await fetchById(id);

  await Promise.all(
    item?.kids?.map(
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
  // dateStyle: "long",
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
          !kid || kid.dead || !kid.text ? null : (
            <details
              key={kid.id}
              onClick={(e) => {
                // TODO: Collapse the details on clicking the text
                if (
                  e.nativeEvent.target.tagName !== "A" &&
                  e.nativeEvent.target.tagName !== "SUMMARY"
                ) {
                  e.currentTarget.removeAttribute("open");
                  e.stopPropagation(); // don't bubble up to the next details
                }
              }}
              open
            >
              <summary>
                {kid.by} | {kid.kids?.length || "0"}{" "}
                {kid.kids?.length === 1 ? "comment" : "comments"}
                {" | "}
                {dateFormat.format(kid.time * 1_000)}
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
      <section>
        <h3>{story?.title}</h3>
        <a href={story.url}>{story.url}</a>
        <p>
          By {story.by} {dateFormat.format(new Date(story.time * 1_000))}
        </p>
        <div
          className="text"
          dangerouslySetInnerHTML={{ __html: story.text }}
        ></div>
      </section>
      <section className="comments-container">
        {story.kids?.map((comment) => {
          if (!comment || comment.dead) return null;
          return (
            <details
              className="card card__comment"
              key={comment.id}
              onClick={(e) => {
                // TODO: Collapse the details on clicking the text
                if (
                  e.nativeEvent.target.tagName !== "A" &&
                  e.nativeEvent.target.tagName !== "SUMMARY"
                ) {
                  e.currentTarget.removeAttribute("open");
                }
              }}
              open
            >
              <summary>
                {comment.by} | {comment.kids?.length || "0"}{" "}
                {comment.kids?.length === 1 ? "comment" : "comments"}
                {" | "}
                {dateFormat.format(comment.time * 1_000)}
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
