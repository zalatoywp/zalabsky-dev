import { FC, useEffect, useState } from "react";
import ErrorMsg from "../threads/ErrorMsg";
import { Col, DailyDatapoint, DataVolumeBarChart } from "./Charts";
import CountUp from "react-countup";
import axios from "axios";

interface Percentile
{
  percentile: number;
  count: number;
}

interface FollowerPercentile
{
  percentile: number;
  value: number;
}

interface Bracket
{
  min: number;
  count: number;
}

interface TopPoster
{
  handle: string;
  did: string;
  post_count: number;
}

interface AuthorStatsResponse
{
  total_authors: number;
  total_users: number;
  total_posts: number;
  mean_post_count: number;
  percentiles: Percentile[];
  follower_percentiles: FollowerPercentile[];
  brackets: Bracket[];
  updated_at: string;
  top_posters: TopPoster[];
  daily_data: DailyDatapoint[];
}

const badgeClasses = [
  "bg-yellow-200 text-yellow-900",
  "bg-slate-200 text-slate-800",
  "bg-orange-200 text-orange-800",
  "bg-emerald-50 text-emerald-800",
];

const Stats: FC<NonNullable<unknown>> = () =>
{
  const [stats, setStats] = useState<AuthorStatsResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [showTopPosters, setShowTopPosters] = useState<boolean>(false);
  const [cols, setCols] = useState<Col[]>([
    {
      key: "num_likers",
      label: "Likes",
      color: "rgb(232, 193, 160)",
      hidden: false,
    },
    {
      key: "num_followers",
      label: "Seguidores",
      color: "rgb(244, 117, 96)",
      hidden: false,
    },
    {
      key: "num_posters",
      label: "Posts",
      color: "rgb(241, 225, 91)",
      hidden: false,
    },
  ]);

  useEffect(() =>
  {
    document.title = "Zalabsky";
  }, []);

  const getMillionString = (num: number) =>
  {
    if (num < 1000000) return num.toLocaleString();
    return `${(num / 1000000).toFixed(2)} M`;
  };

  const refreshStats = () =>
  {
    axios.get(`https://bsky-search.jazco.io/stats`)
      .then((res) => res.data)
      .then((res: AuthorStatsResponse) =>
      {
        // If the response has an updated_at from the future, set it to a second ago
        if (res.updated_at > new Date().toISOString()) {
          res.updated_at = new Date(Date.now() - 1000).toISOString();
        }
        // Filter daily_data to only include the last 30 days (up until yesterday)
        res.daily_data = res.daily_data.filter((d) =>
        {
          return (
            new Date(d.date).getTime() >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() &&
            new Date(d.date).getTime() <
            new Date(Date.now() - 24 * 60 * 60 * 1000).getTime()
          );
        });
        setStats(res);
      })
      .catch((err) =>
      {
        setError(err.message);
      });
  };

  useEffect(() =>
  {
    refreshStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(() =>
    {
      refreshStats();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900">
      <div className="mx-auto max-w-7xl py-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-800 px-3 sm:px-16 py-4 sm:py-24 text-center shadow-md sm:rounded-3xl">
          <div className="mx-auto max-w-7xl">
            {error && (
              <div className="text-left mb-2">
                <ErrorMsg error={error} />
              </div>
            )}
            <div>
              <div className="text-3xl font-bold text-gray-50  sm:text-4xl">
                Estadísticas de cuentas y recuento de publicaciones de Bluesky
              </div>
              <div className="lg:mt-8 mt-2">
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-50 text-lg font-semibold">
                      Estadísticas agregadas para todas las publicaciones en el índice Bluesky
                    </div>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-4 max-w-5xl mx-auto">
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-50">
                        Usuarios
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-orange-800 sm:text-5xl">
                        <CountUp preserveValue={true} end={stats.total_users} />
                      </dd>
                    </div>
                  )}
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-50">
                        Autores de Post
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-orange-800 sm:text-5xl">
                        {stats.total_authors.toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-50">
                        Recuento medio de publicaciones
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-orange-800 sm:text-5xl">
                        {stats.mean_post_count.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  {stats && (
                    <div className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1">
                      <dt className="text-base leading-7 text-gray-50">
                        Total Posts
                      </dt>
                      <dd className="order-first text-3xl font-semibold tracking-tight text-orange-800 sm:text-5xl">
                        {getMillionString(stats.total_posts)}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="text-red-900 py-8 mt-2 h-128">
                  <DataVolumeBarChart
                    data={stats ? stats.daily_data : []}
                    cols={cols.filter((c) => !c.hidden)}
                  />
                  <div className="chart_legend">
                    <div className="flex flex-row justify-center">
                      {cols.map((col, idx) => (
                        <div
                          className="flex flex-row items-center mr-4"
                          key={`legend-${idx}`}
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                          {
                            const newCols = cols.map((c) =>
                            {
                              if (c.key === col.key) {
                                return {
                                  ...c,
                                  hidden: !c.hidden,
                                };
                              }
                              return c;
                            });
                            setCols(newCols);
                          }}
                        >
                          <div
                            className="h-4 w-4 mr-1 rounded-full"
                            style={{
                              backgroundColor: col.color,
                              opacity: col.hidden ? 0.5 : 1,
                            }}
                          ></div>
                          <div className="text-xs text-gray-50">{col.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-50 text-lg font-semibold">
                      Porcentaje de publicaciones por usuario
                    </div>
                  </div>
                  <div className="lg:mt-8 mt-2">
                    <dl className="grid grid-cols-5 gap-x-2 lg:gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-10 justify-center">
                      {stats &&
                        stats.percentiles.map((p, idx) => (
                          <div
                            className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1"
                            key={`p-${idx}`}
                          >
                            <dt className="text-base leading-7 text-gray-50">
                              {p.percentile * 100}th
                              <span className="hidden sm:block">
                                Porcentaje
                              </span>
                            </dt>
                            <dd className="order-first text-xl font-semibold tracking-tight text-orange-800 sm:text-3xl">
                              {p.count.toLocaleString()}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-50 text-lg font-semibold">
                      Porcentaje de Seguidores por usuario
                    </div>
                  </div>
                  <div className="lg:mt-8 mt-2">
                    <dl className="grid grid-cols-5 gap-x-2 lg:gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-10 justify-center">
                      {stats &&
                        stats.follower_percentiles.map((p, idx) => (
                          <div
                            className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1"
                            key={`p-${idx}`}
                          >
                            <dt className="text-base leading-7 text-gray-50">
                              {p.percentile * 100}th
                              <span className="hidden sm:block">
                                Porcentaje
                              </span>
                            </dt>
                            <dd className="order-first text-xl font-semibold tracking-tight text-orange-800 sm:text-3xl">
                              {Math.floor(p.value).toLocaleString()}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>
                <div className="py-8 mt-2 text-center">
                  <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-gray-50 text-lg font-semibold">
                      Usuarios con más número de publicaciones
                    </div>
                  </div>
                  <div className="lg:mt-8 mt-2">
                    <dl className="grid grid-cols-3 gap-x-8 gap-y-2 lg:gap-y-16 text-center lg:grid-cols-6">
                      {stats &&
                        stats.brackets.map((b, idx) => (
                          <div
                            className="mx-auto flex max-w-xs flex-col lg:gap-y-4 gap-y-1"
                            key={`b-${idx}`}
                          >
                            <dt className="text-base leading-7 text-gray-50">
                              {`>${b.min}`}
                            </dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-orange-800 sm:text-4xl">
                              {b.count.toLocaleString()}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>

                <div className="py-8 mt-2 text-center flex mx-auto flex-col w-fit">
                  <div className="flex justify-center align-middle">
                    <span className="ml-2 text-xl font-semibold text-gray-50">
                      Top 25 Posts
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                      {
                        setShowTopPosters(!showTopPosters);
                      }}
                      className={
                        `ml-2 mr-6 relative inline-flex items-center rounded-md  px-3 py-2 text-xs font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2` +
                        (showTopPosters
                          ? " bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
                          : " bg-green-500 hover:bg-green-600 focus-visible:ring-green-500")
                      }
                    >
                      {showTopPosters ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  {stats && showTopPosters && (
                    <div className="flex-shrink">
                      <ul
                        role="list"
                        className="divide-y divide-gray-200 overflow-auto flex-shrink"
                      >
                        {stats.top_posters.map((poster, idx) => (
                          <li
                            key={poster.did}
                            className="px-4 py-3 sm:px-6 flex-shrink"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-orange-800 truncate">
                                {idx + 1}.
                              </div>
                              <div className="text-sm font-medium text-yellow-500 truncate px-4">
                                <a
                                  href={`https://bsky.app/profile/${poster.handle}`}
                                  target="_blank"
                                >
                                  {poster.handle}
                                </a>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClasses[
                                    idx < badgeClasses.length
                                      ? idx
                                      : badgeClasses.length - 1
                                  ]
                                    }`}
                                >
                                  {poster.post_count.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-2">
                <div className="text-gray-50 text-xs">
                  La recopilación de datos posteriores comenzó el 1 de mayo de 2023
                </div>
                <div className="text-gray-50 text-xs">
                  El recuento total de usuarios proviene directamente de la API de Bluesky
                </div>
                <div className="text-gray-50 text-xs">
                  Las cuentas de bots grandes están excluidas de las estadísticas y de los mejores post.
                </div>
              </div>
            </div>
          </div>
          <footer className="text-center w-full">
            <div className="mx-auto max-w-7xl px-2">
              <span className="footer-text text-gray-300 text-xs">

                <a
                  href="https://bsky.app/profile/zalatoy.com"
                  target="_blank"
                  className="footer-text text-gray-300 text-xs"
                >
                  By Zalatoy {new Date().getFullYear()}
                </a>
                {" "}
              </span>
              {/* <span className="footer-text text-gray-300 text-xs">
                {" | "}
                <a
                  href="#"
                  target="_blank"
                >
                  <img
                    src="/github.svg"
                    className="img-gray-300 inline-block h-3.5 w-4 mb-0.5" />
                </a>
              </span> */}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Stats;
