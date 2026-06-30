import { wsProxy } from "./ws";

export const route = {
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const stream = url.searchParams.get("stream");

    if (!stream) {
      return new Response("Missing stream", { status: 400 });
    }

    return wsProxy({ data: { stream } });
  },
};
