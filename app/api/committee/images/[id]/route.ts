import { NextRequest } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import { getGridFSBucket } from "@/app/lib/gridfs";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;

    const bucket = getGridFSBucket();

    const fileId = new ObjectId(id);

    console.log("PARAM:", id);

    console.log("ALL FILES:");

    const allFiles = await bucket.find().toArray();

    console.log(allFiles);

    const files = await bucket
      .find({
        _id: fileId,
      })
      .toArray();

    if (!files.length) {
      return new Response("File not found", {
        status: 404,
      });
    }

    const downloadStream = bucket.openDownloadStream(fileId);

    const chunks: Buffer[] = [];

    return await new Promise<Response>((resolve, reject) => {
      downloadStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on("error", (err) => {
        reject(
          new Response("Download failed", {
            status: 500,
          }),
        );
      });

      downloadStream.on("end", () => {
        const buffer = Buffer.concat(chunks);

        resolve(
          new Response(buffer, {
            headers: {
              "Content-Type": files[0]?.metadata?.contentType || "image/jpeg",
            },
          }),
        );
      });
    });
  } catch (error) {
    console.error(error);

    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
