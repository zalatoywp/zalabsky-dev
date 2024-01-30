import GraphContainer from "./components/Graph";
import "./App.css";
import
{
  Link,
  RouterProvider,
  createBrowserRouter,
  useLocation,
  RedirectFunction,
  redirect,
  Navigate,
} from "react-router-dom";
import TreeVisContainer from "./components/threads/TreeVis";
import ThreadSearch from "./components/threads/ThreadSearch";
import Stats from "./components/stats/Stats";
import OptOut from "./components/optout/OptOut";
import RepoWalker from "./components/repowalker/RepoWalker";
import NewGraphContainer from "./components/NewGraph";
import RepoCleanup from "./components/repocleanup/RepoCleanup";

const NavList: React.FC = () =>
{
  let location = useLocation();

  const inactive = "font-bold underline-offset-1 underline opacity-50";

  const active = (path: string[]) =>
  {
    let isActive = false;
    if (path.some((p) => location.pathname === p)) {
      isActive = true;
    }

    return isActive ? "font-bold underline-offset-1 underline" : inactive;
  };

  return (
    <header className="bg-white fixed top-0 text-center w-full z-50">
      <div className="mx-auto max-w-7xl px-2 align-middle">
        <span className="footer-text text-xs">
          <Link to="/atlas" className={active(["/atlas"])}>
            Gráfica
          </Link>
          {" | "}
          <Link to="/thread" className={active(["/thread", "/thread/view"])}>
            Seguimientos
          </Link>
          {" | "}
          <Link to="/stats" className={active(["/", "/stats"])}>
            Estado
          </Link>
          {" | "}
          <Link to="/walker" className={active(["/walker"])}>
            Análisis
          </Link>
          {" | "}
          <Link to="/cleanup" className={active(["/cleanup"])}>
            Borrar datos
          </Link>
        </span>
      </div>
    </header>
  );
};

const router = createBrowserRouter([
  {
    path: "/atlas",
    element: (
      <>
        <NavList />
        <GraphContainer />
      </>
    ),
  },
  {
    path: "/newgraph",
    element: (
      <>
        <NavList />
        <NewGraphContainer />
      </>
    ),
  },
  {
    path: "/thread",
    element: (
      <>
        <NavList />
        <ThreadSearch />
      </>
    ),
  },
  {
    path: "/thread/view",
    element: (
      <>
        <NavList />
        <TreeVisContainer />
      </>
    ),
  },
  {
    path: "/stats",
    element: (
      <>
        <NavList />
        <Stats />
      </>
    ),
  },
  {
    path: "/",
    element: (
      <>
        <Navigate to="/walker" />
      </>
    ),

  },
  {
    path: "/optout",
    element: (
      <>
        <NavList />
        <OptOut />
      </>
    ),
  },
  {
    path: "/walker",
    element: (
      <>
        <NavList />
        <RepoWalker />
      </>
    ),
  },
  {
    path: "/cleanup",
    element: (
      <>
        <NavList />
        <RepoCleanup />
      </>
    )
  }
]);

function App()
{
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
