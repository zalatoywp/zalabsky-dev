// import { CloudArrowDownIcon } from "@heroicons/react/24/solid";
import { FC, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ErrorMsg from "../threads/ErrorMsg";


interface Subject
{
  cid: string;
  uri: string;
}
interface Post
{
  uri: string;
  content: {
    createdAt: string;
    text: string;
  };
}
interface Repost
{
  uri: string;
  content: {
    createdAt: string;
    subject: Subject;
  };
}
interface Like
{
  uri: string;
  content: {
    createdAt: string;
    subject: Subject;
  };
}
interface Follow
{
  uri: string;
  content: {
    createdAt: string;
    subject: string;
  };
}
interface Block
{
  uri: string;
  content: {
    createdAt: string;
    subject: string;
  };
}
interface Profile
{
  uri: string;
  content: {
    avatar: {
      ref: {
        $link: string;
      }
    }
    description: string;
    displayName: string;
  };
}

interface Repo
{
  profile: Profile;
  posts: Post[];
  reposts: Repost[];
  likes: Like[];
  follows: Follow[];
  blocks: Block[];
}

const RepoWalker: FC<{}> = () =>
{
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<string>("");
  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // const [downloading, setDownloading] = useState<boolean>(false);
  const [candidate, setCandidate] = useState<string>("");
  const [did, setDid] = useState<string>("");
  const [handles, setHandles] = useState<Map<string, string>>(new Map());

  useEffect(() =>
  {
    document.title = "zalabsky";
  }, []);

  useEffect(() =>
  {
    const userFromParams = searchParams.get("user");
    if (userFromParams !== null && did === "" && repo === null) {
      setCandidate(userFromParams);
      resolveHandleOrDid(userFromParams).then((repoDid) =>
      {
        setDid(repoDid);
        getRepo(repoDid);
      });
    }
  }, [searchParams]);

  const getRepo = async (repoDid: string) =>
  {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`https://bsky-search.jazco.io/repo/${repoDid}`, {
        mode: "no-cors",
        method: "GET",
        headers: {
          "site": "cross-site",
          "accept": "*/*",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        }
      }
      );

      // Check for non-200 status codes.
      if (!resp.ok) {
        let errorMsg = "An error occurred while fetching the repository.";
        try {
          const errorData = await resp.json();
          // Use the error message from the server if available.
          if ("error" in errorData) {
            errorMsg = errorData.error;
          }
        } catch (parseError: any) {
          // If parsing fails, use the generic error message.
        }
        throw new Error(errorMsg);
      }

      const repoData = await resp.json();
      if ("error" in repoData) {
        throw new Error(repoData.error);
      }

      const dids: Set<string> = new Set();
      if (repoData.likes && repoData.likes.length > 0) {
        for (let i = 0; i < repoData.likes.length; i++) {
          const like = repoData.likes[i];
          dids.add(like.content.subject.uri.split("/")[2]);
        }
      }
      if (repoData.follows && repoData.follows.length > 0) {
        for (let i = 0; i < repoData.follows.length; i++) {
          const follow = repoData.follows[i];
          dids.add(follow.content.subject);
        }
      }
      if (repoData.blocks && repoData.blocks.length > 0) {
        for (let i = 0; i < repoData.blocks.length; i++) {
          const block = repoData.blocks[i];
          dids.add(block.content.subject);
        }
      }
      if (repoData.reposts && repoData.reposts.length > 0) {
        for (let i = 0; i < repoData.reposts.length; i++) {
          const repost = repoData.reposts[i];
          dids.add(repost.content.subject.uri.split("/")[2]);
        }
      }

      // Resolve all the DIDs in a big batch.
      await resolveDidBatch(Array.from(dids));

      console.log(repoData);
      setRepo(repoData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resolveHandleOrDid = async (handleOrDid: string): Promise<string> =>
  {
    setError("");
    let repoDid = "";
    if (handleOrDid.startsWith("did:")) {
      repoDid = handleOrDid;
    } else {
      try {
        const resp = await fetch(
          `https://plc.jazco.io/${handleOrDid.toLowerCase()}`, {
          mode: "no-cors",
          method: "GET",
          headers: {
            "site": "cross-site",
            "accept": "*/*",
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          }
        }

        );

        if (!resp.ok) {
          let errorMsg = "An error occurred while resolving the handle.";
          try {
            const errorData = await resp.json();
            if ("error" in errorData) {
              errorMsg = errorData.error;
              if (errorMsg === "redis: nil") {
                errorMsg = "Handle not found.";
              }
            }
          } catch (parseError: any) {
            // If parsing fails, use the generic error message.
          }
          throw new Error(errorMsg);
        }

        const didData = await resp.json();
        repoDid = didData.did;
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
        return "";
      }
    }
    return repoDid;
  };

  const resolveDidBatch = async (dids: string[]) =>
  {
    dids = dids.map((did) => did.toLowerCase());
    try {
      const resp = await fetch(`https://plc.jazco.io/batch/by_did`, {
        mode: "no-cors",
        method: "GET",
        headers: {
          "site": "cross-site",
          "accept": "*/*",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(dids),
      });
      if (!resp.ok) {
        let errorMsg = "An error occurred while resolving the handle.";
        try {
          const errorData = await resp.json();
          if ("error" in errorData) {
            errorMsg = errorData.error;
            if (errorMsg === "redis: nil") {
              errorMsg = "Handle not found.";
            }
          }
        } catch (parseError: any) {
          // If parsing fails, use the generic error message.
        }
        throw new Error(errorMsg);
      }

      const didData: any[] = await resp.json();
      didData?.forEach((doc) =>
      {
        handles.set(doc.did, doc.handle);
      });

      console.log(handles);

      setHandles(handles);
    } catch (e: any) {
      throw new Error(e.message);
    }
  };

  const handleButtonClick = async (e: any): Promise<string> =>
  {
    e.preventDefault();
    setError("");
    let repoDid = "";
    if (candidate.startsWith("did:")) {
      repoDid = candidate;
    } else {
      try {
        const resp = await fetch(
          `https://plc.jazco.io/${candidate.toLowerCase()}`, {
          mode: "no-cors",
          method: "GET",
          headers: {
            "site": "cross-site",
            "accept": "*/*",
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          }
        }
        );

        if (!resp.ok) {
          let errorMsg = "An error occurred while resolving the handle.";
          try {
            const errorData = await resp.json();
            if ("error" in errorData) {
              errorMsg = errorData.error;
              if (errorMsg === "redis: nil") {
                errorMsg = "Handle not found.";
              }
            }
          } catch (parseError: any) {
            // If parsing fails, use the generic error message.
          }
          throw new Error(errorMsg);
        }

        const didData = await resp.json();
        repoDid = didData.did;
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
        return "";
      }
    }
    return repoDid;
  };

  return (
    <div className="bg-gray-900">

      <div className="mx-auto max-w-7xl py-4 sm:py-4 sm:px-6 lg:px-8">
        <div className="border-2 border-gray-500 shadow-md   shadow-cyan-500/50 rounded-2xl text-white lg:px-0 relative isolate overflow-hidden bg-gray-950 px-3 sm:px-6 py-8 sm:pb-24 sm:rounded-3xl">
          <div className="mx-auto max-w-7xl">
            {error && (
              <div className="text-left mb-2">
                <ErrorMsg error={error} />
              </div>
            )}
            <div>
              <div className="pb-0 pt-0 text-right pr-5">
                <span
                  className="relative inline-block overflow-hidden rounded-full p-[1px]"
                >
                  <span
                    className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"
                  ></span>
                  <div
                    className=" inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950/90 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl"
                    onClick={() => alert('Su IP no está autorizada para acceder a esta sección')}
                  >
                    Acceso Usuarios
                  </div>
                </span>

              </div>
              <h1 className="text-3xl font-bold text-orange-800 sm:text-6xl text-center">
                Zalabsky Dev Tools
              </h1>
              <p className="mt-4 pb-6 text-lg leading-6 text-gray-200 text-center">
                Una herramienta para explorar los contenidos públicos de Bluesky
              </p>
              <form
                className="mt-6 sm:flex sm:items-center max-w-lg mx-auto"
                action="#"
              >
                <label htmlFor="threadURL" className="sr-only">
                  Thread URL
                </label>
                <div className="grid grid-cols-1 sm:flex-auto">
                  <input
                    type="text"
                    name="threadURL"
                    id="threadURL"
                    className="peer relative bg-gray-800 col-start-1 row-start-1 border-2 border-cyan-500 rounded-md shadow-md  shadow-cyan-500/50 py-1.5 text-gray-100 placeholder:text-gray-100 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Introduzca el Handle o el DID de la cuenta"
                    value={candidate}
                    onChange={(e) => setCandidate(e.target.value)}
                  />
                  <div
                    className="col-start-1 col-end-3 row-start-1 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 sm:ml-4 sm:mt-0 sm:flex-shrink-0 flex">
                  <button
                    onClick={async (e) =>
                    {
                      e.preventDefault();
                      setLoading(true);
                      const repoDid = await handleButtonClick(e);
                      setSearchParams({ user: candidate.toLowerCase() });
                      setDid(repoDid);
                      getRepo(repoDid);
                    }}
                    className="block w-full rounded-md bg-gray-800 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {loading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <span className="whitespace-nowrap">Solicitar Datos</span>
                    )}
                  </button>
                  {/* <button
                    onClick={async (e) =>
                    {
                      e.preventDefault();
                      setDownloading(true);
                      const repoDid = await handleButtonClick(e);
                      const resp = await fetch(
                        `https://bsky.social/xrpc/com.atproto.sync.getCheckout?did=${repoDid}`,
                        {
                          headers: {
                            "Content-Type": "application/vnd.ipld.car",
                          },
                        }
                      );

                      const blob = await resp.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${repoDid}.car`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      setDownloading(false);
                    }}
                    className="block mr-2 w-full rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    {downloading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <CloudArrowDownIcon className="h-5 w-5 inline-block" />
                    )}
                  </button> */}
                </div>
              </form>
              {repo && (
                <div>
                  <div className="flex gap-2 justify-center">
                    <div className="mt-6 w-auto flex">
                      <div className="bg-gray-900 overflow-hidden shadow border border-blue-100 rounded-lg flex flex-wrap justify-center">
                        <div className="py-2 pl-6 pr-4">
                          <div className="mt-2 max-w-xl text-sm text-gray-900">
                            <p>
                              <div>
                                <span>
                                  <img
                                    className="h-14 w-14 rounded-full"
                                    src={`https://cdn.bsky.app/img/avatar/plain/${repo?.profile.uri.split("/")[2]}/${repo?.profile.content.avatar.ref.$link}@jpeg?v=1&size=90x90`}
                                    alt="avatar"
                                  />
                                </span>
                                <span className="text-2xl font-bold text-gray-300">{repo?.profile.content.displayName} </span>
                                <span className="text-sm text-gray-400"> @{handles.get(did)}</span>

                              </div>
                              <p className="font-normal text-orange-500"> {repo?.profile.uri.split("/")[2]}</p>
                              <br />

                            </p>
                            <p className="font-normal text-gray-300">
                              {repo?.profile.content.description
                                .split("\n")
                                .map((line, idx) => (
                                  <span key={idx}>
                                    {line}
                                    <br />
                                  </span>
                                ))}
                            </p>
                          </div>
                        </div>
                        <div className="py-2 pr-6 pl-4">
                          <div className="mt-4 max-w-xl text-sm text-gray-300 text-left grid gap-3 grid-cols-2 p-5 mb-4 border border-white rounded-lg bg-gray-900">
                            <div>
                              <p>
                                <a href="#posts" className="hover:underline font-semibold">
                                  Posts
                                </a>
                              </p>
                              <p>
                                <a href="#reposts" className="hover:underline font-semibold">
                                  Reposts
                                </a>
                              </p>
                              <p>
                                <a href="#likes" className="hover:underline font-semibold">
                                  Likes
                                </a>
                              </p>
                              <p>
                                <a href="#follows" className="hover:underline font-semibold">
                                  Siguiendo
                                </a>
                              </p>
                              <p>
                                <a href="#" className="hover:underline font-semibold">
                                  Seguidores
                                </a>
                              </p>
                              <p>
                                <a href="#blocks" className="hover:underline font-semibold">
                                  Cuentas Bloqueadas
                                </a>
                              </p>
                              <p>
                                <a href="#" className="hover:underline font-semibold">
                                  Bloqueado Por
                                </a>
                              </p>
                              <p>
                                <a href="#" className="hover:underline font-semibold">
                                  Cambios de Handle
                                </a>
                              </p>
                              <p>
                                <a href="#" className="hover:underline font-semibold">
                                  Invitado por
                                </a>
                              </p>
                              <p>
                                <a href="#" className="hover:underline font-semibold">
                                  Ha Invitado a
                                </a>
                              </p>

                            </div>
                            <div className="text-right text-yellow-500 font-semibold">
                              <p>{repo?.posts.length.toLocaleString()}</p>
                              <p>{repo?.reposts.length.toLocaleString()}</p>
                              <p>{repo?.likes.length.toLocaleString()}</p>
                              <p>{repo?.follows.length.toLocaleString()}</p>
                              <p className="text-red-600">Solo usuario registrados</p>
                              <p>{repo?.blocks.length.toLocaleString()}</p>
                              <p className="text-red-600">Solo usuario registrados</p>
                              <p className="text-red-600">Solo usuario registrados</p>
                              <p className="text-red-600">Solo usuario registrados</p>
                              <p className="text-red-600">Solo usuario registrados</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <div className="mt-6 max-w-xl flex overflow-hidden flex-col ">
                      <div className="p-5 mb-4 border border-blue-100 rounded-lg bg-gray-900">
                        <a
                          id="blocks"
                          href="#"
                          className="p-3 top-0 text-lg font-semibold text-blue-200 hover:underline"
                        >
                          <div className="mb-4 border border-blue-100 items-center block p-3 sm:flex hover:bg-gray-800 rounded-lg">Bloqueadas </div>
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.blocks.toReversed().map((block, idx) => (
                            <li key={idx}>
                              <a
                                href={`https://bsky.app/profile/${block.content.subject}`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-800 rounded-3xl"
                              >
                                <div className="text-orange-500">
                                  <div className="text-base font-normal">
                                    <span className="text-orange-500">
                                      @{handles.has(block.content.subject)
                                        ? handles.get(block.content.subject)
                                        : block.content.subject}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    Bloqueado el {new Date(block.content.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-5 mb-4 border border-blue-100 rounded-lg bg-gray-900  ">
                        <a
                          id="posts"
                          href="#"
                          className="p-3 top-0 text-lg font-semibold text-blue-200 hover:underline"
                        >
                          <div className="mb-4 border border-blue-100 items-center block p-3 sm:flex hover:bg-gray-800 rounded-lg">Posts</div>
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.posts.toReversed().map((post, idx) => (
                            < li key={idx} >
                              <a
                                href={`https://bsky.app/profile/${did}/post/${post.uri.split("/")[4]}`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-800 rounded-3xl"
                              >
                                <div className="text-gray-200">
                                  <div className="text-base font-normal">
                                    <div className="text-base font-normal">
                                      <span className="font-medium text-yellow-500">
                                        {repo?.profile.content.displayName}
                                      </span>
                                    </div>
                                    <span className="text-sm font-normal text-orange-500">
                                      @{handles.get(did)}
                                    </span>
                                  </div>
                                  <div className="text-sm font-normal">
                                    {post.content.text}
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    {new Date(post.content.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-5 mb-4 border border-blue-100 rounded-lg bg-gray-900  ">
                        <a
                          id="follows"
                          href="#"
                          className="p-3 top-0 text-lg font-semibold text-blue-200 hover:underline"
                        >
                          <div className="mb-4 border border-blue-100 items-center block p-3 sm:flex hover:bg-gray-800 rounded-lg">Siguiendo</div>
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.follows.toReversed().map((follow, idx) => (
                            <li key={idx}>
                              <a
                                href={`https://bsky.app/profile/${follow.content.subject}`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-800 rounded-3xl"
                              >
                                <div className="text-orange-500 ">
                                  <div className="text-base font-normal">
                                    <span className="text-orange-500">
                                      @{handles.has(follow.content.subject)
                                        ? handles.get(follow.content.subject)
                                        : follow.content.subject}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    Seguido el {new Date(follow.content.createdAt).toLocaleDateString()}

                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>

                      </div>
                      <div className="p-5 mb-4 border border-blue-100 rounded-lg bg-gray-900  ">
                        <a
                          id="reposts"
                          href="#"
                          className="p-3 top-0 text-lg font-semibold text-blue-200 hover:underline"
                        >
                          <div className="mb-4 border border-blue-100 items-center block p-3 sm:flex hover:bg-gray-800 rounded-lg">Repost</div>
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.reposts.toReversed().map((repost, idx) => (
                            <li key={idx}>
                              <a
                                href={`https://bsky.app/profile/${repost.content.subject.uri.split("/")[2]
                                  }/post/${repost.content.subject.uri.split("/")[4]
                                  }`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-800 rounded-3xl "
                              >
                                <div className="text-gray-100">
                                  <div className="text-base font-normal">
                                    <span className="font-medium text-yellow-500 ">
                                      {handles.get(did)}
                                    </span>{" "}
                                    <a className="text-xs">repost al post de</a>{" "}
                                    <span className="font-medium text-orange-500 ">
                                      {handles.has(
                                        repost.content.subject.uri.split("/")[2]
                                      )
                                        ? handles.get(
                                          repost.content.subject.uri.split(
                                            "/"
                                          )[2]
                                        )
                                        : repost.content.subject.uri.split(
                                          "/"
                                        )[2]}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    Reposteado el {new Date(repost.content.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="p-5 mb-4 border border-gray-100 rounded-lg bg-white  ">
                        <a
                          id="likes"
                          href="#"
                          className="text-lg font-semibold text-gray-900 "
                        >
                          Likes
                        </a>
                        <ol className="mt-3 divide-y divider-gray-200 ">
                          {repo?.likes.map((like, idx) => (

                            <li key={idx}>
                              <a
                                href={`https://bsky.app/profile/${like.content.subject.uri.split("/")[2]
                                  }/post/${like.content.subject.uri.split("/")[4]
                                  }`}
                                target="_blank"
                                className="items-center block p-3 sm:flex hover:bg-gray-50 "
                              >
                                <div className="text-gray-600 ">
                                  <div className="text-base font-normal">
                                    <span className="font-medium text-gray-900 ">
                                      {handles.get(did)}
                                    </span>{" "}
                                    liked a post by{" "}
                                    <span className="font-medium text-gray-900 break-all">
                                      {handles.has(
                                        like.content.subject.uri.split("/")[2]
                                      )
                                        ? handles.get(
                                          like.content.subject.uri.split(
                                            "/"
                                          )[2]
                                        )
                                        : like.content.subject.uri.split(
                                          "/"
                                        )[2]}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center text-xs font-normal text-gray-500 ">
                                    {like.content.createdAt}
                                  </span>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <footer className="text-center h-64 w-full">
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
    </div >

  );
};

export default RepoWalker;
