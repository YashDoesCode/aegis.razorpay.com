import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

const VIDEO_RELATIVE_PATH = path.join("src", "assets", "Intro.mp4");

function getFilePath(): string {
  return path.join(process.cwd(), VIDEO_RELATIVE_PATH);
}

export async function GET(req: NextRequest) {
  const filePath = getFilePath();

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Video file not found", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || (end !== undefined && isNaN(end)) || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileSize}`,
          "Accept-Ranges": "bytes",
        },
      });
    }

    const effectiveEnd = Math.min(end, fileSize - 1);
    const chunkSize = effectiveEnd - start + 1;
    const nodeStream = fs.createReadStream(filePath, { start, end: effectiveEnd });
    // Convert Node.js readable stream to Web ReadableStream
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${effectiveEnd}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const nodeStream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": fileSize.toString(),
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function HEAD(req: NextRequest) {
  const filePath = getFilePath();

  if (!fs.existsSync(filePath)) {
    return new NextResponse(null, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || (end !== undefined && isNaN(end)) || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileSize}`,
          "Accept-Ranges": "bytes",
        },
      });
    }

    const effectiveEnd = Math.min(end, fileSize - 1);
    const chunkSize = effectiveEnd - start + 1;

    return new Response(null, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${effectiveEnd}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": fileSize.toString(),
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
