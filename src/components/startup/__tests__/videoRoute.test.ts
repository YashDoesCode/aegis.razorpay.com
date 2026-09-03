import { describe, it, expect } from "vitest";
import { GET, HEAD } from "@/app/api/startup/video/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

describe("Startup Video Route Handler (/api/startup/video)", () => {
  const filePath = path.join(process.cwd(), "src/assets/Intro.mp4");
  const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 1182648;

  it("serves full video with 200 OK when no Range header is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/startup/video", {
      method: "GET",
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("video/mp4");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Length")).toBe(fileSize.toString());
    expect(res.headers.get("Cache-Control")).toContain("immutable");
    expect(res.body).toBeDefined();
  });

  it("serves partial content with 206 Partial Content when Range header is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/startup/video", {
      method: "GET",
      headers: {
        range: "bytes=0-1023",
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Type")).toBe("video/mp4");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Length")).toBe("1024");
    expect(res.headers.get("Content-Range")).toBe(`bytes 0-1023/${fileSize}`);
  });

  it("serves partial content from offset to end (e.g. bytes=1000-)", async () => {
    const start = 1000;
    const req = new NextRequest("http://localhost:3000/api/startup/video", {
      method: "GET",
      headers: {
        range: `bytes=${start}-`,
      },
    });

    const res = await GET(req);
    const expectedChunkSize = fileSize - start;

    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe(`bytes ${start}-${fileSize - 1}/${fileSize}`);
    expect(res.headers.get("Content-Length")).toBe(expectedChunkSize.toString());
  });

  it("returns 416 Range Not Satisfiable for invalid range", async () => {
    const req = new NextRequest("http://localhost:3000/api/startup/video", {
      method: "GET",
      headers: {
        range: `bytes=${fileSize + 5000}-${fileSize + 6000}`,
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(416);
    expect(res.headers.get("Content-Range")).toBe(`bytes */${fileSize}`);
  });

  it("handles HEAD requests correctly without response body", async () => {
    const req = new NextRequest("http://localhost:3000/api/startup/video", {
      method: "HEAD",
      headers: {
        range: "bytes=0-500",
      },
    });

    const res = await HEAD(req);

    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Type")).toBe("video/mp4");
    expect(res.headers.get("Content-Length")).toBe("501");
    expect(res.body).toBeNull();
  });
});
