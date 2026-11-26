import { getServerApiUrl } from "../../../../lib/api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(path.join("/"), `${getServerApiUrl()}/`);
  targetUrl.search = incomingUrl.search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("host");
  requestHeaders.delete("content-length");

  const apiResponse = await fetch(targetUrl, {
    method: request.method,
    headers: requestHeaders,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers(apiResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(apiResponse.body, {
    status: apiResponse.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
