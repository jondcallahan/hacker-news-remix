import { Link, NavLink, Outlet, useMatches, useNavigation } from "react-router";
import type { Item } from "~/utils/api.server";
import { ExternalLink, NavigationProgress, PageWidth, Text } from "~/components/ui";

type LayoutMatch = {
  data?: { story: Item };
  handle?: { showBreadcrumb?: boolean };
};

export default function Layout() {
  const matches = useMatches() as LayoutMatch[];
  const navigation = useNavigation();

  return (
    <>
      <nav className="w-full bg-orange-400" aria-label="Breadcrumb">
        <PageWidth>
          <ol className="flex items-center text-xl leading-[1.33] font-black md:leading-[1.2]">
            <li className="inline-flex items-center">
              <Link to="/" className="block text-white visited:text-white" viewTransition>Home</Link>
            </li>
            {matches.map(({ data, handle }, index) => handle?.showBreadcrumb && data?.story ? (
              <li key={data.story.id || index} className="inline-flex items-center">
                <span aria-hidden="true" className="mx-2">/</span>
                {data.story.url ? (
                  <ExternalLink href={data.story.url} className="flex items-center gap-1 text-white visited:text-white">
                    {data.story.title} ↗
                  </ExternalLink>
                ) : data.story.title}
              </li>
            ) : null)}
          </ol>
        </PageWidth>
      </nav>
      <NavigationProgress loading={navigation.state !== "idle"} />
      <main className="mx-auto mt-8 mb-9 max-w-[min(100vw,72rem)] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[60ch] md:w-[60ch]">
          <Outlet />
        </div>
      </main>
      <footer className="w-full bg-orange-400">
        <PageWidth>
          <NavLink to="/"><h2 className="text-xl leading-[1.33] font-black text-white md:leading-[1.2]">Home</h2></NavLink>
          <Text className="text-white">All content comes from <ExternalLink href="https://news.ycombinator.com">Hacker News ↗</ExternalLink>.</Text>
          <Text className="text-white">Please enjoy <ExternalLink href="https://joncallahan.com">my ↗</ExternalLink> reader. Front page intentionally limited to top 30 stories. Get back to work.</Text>
        </PageWidth>
      </footer>
    </>
  );
}
