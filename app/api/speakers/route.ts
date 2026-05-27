import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Speaker from "@/app/models/Speaker";
import { getGridFSBucket } from "@/app/lib/gridfs";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const talkTitle = formData.get("talkTitle") as string;
    const abstract = formData.get("abstract") as string;
    const bio = formData.get("bio") as string;

    const file = formData.get("image") as File;

    if (!name || !role || !file) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bucket = getGridFSBucket();

    const fileId = new ObjectId();

    const uploadStream = bucket.openUploadStreamWithId(
      fileId,
      file.name,
      {
        metadata: {
          contentType: file.type,
        },
      }
    );

    uploadStream.end(buffer);

    await new Promise((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
    });

    const speaker = await Speaker.create({
      name,
      role,
      imageFileId: fileId,
      talkTitle,
      abstract,
      bio,
    });

    return NextResponse.json(speaker);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// export async function GET() {
//   try {
//     await dbConnect();

//     //const speakers = await Speaker.find();
//     const speakers = await Speaker.find().lean().sort({ order: 1 });

//     const transformed = speakers.map((speaker) => ({
//       _id: speaker._id,
//       name: speaker.name,
//       role: speaker.role,
//       talkTitle: speaker.talkTitle,
//       abstract: speaker.abstract,
//       bio: speaker.bio,
//       order: speaker.order,

//       imageUrl:
//         `/api/speakers/images/${speaker.imageFileId.toString()}`
//     }));

//     return NextResponse.json(transformed);

//   } catch (error) {
//     console.error(error);

//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
export async function GET() {
  try {
    await dbConnect();
    const speakers = await Speaker.find().lean().sort({ order: 1 });

    const transformed = speakers.map((speaker) => ({
      _id: speaker._id,
      name: speaker.name,
      role: speaker.role,
      talkTitle: speaker.talkTitle,
      abstract: speaker.abstract,
      bio: speaker.bio,
      order: speaker.order,
      imageUrl: `/api/speakers/images/${speaker.imageFileId.toString()}`,
    }));

    return NextResponse.json(transformed, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  });
}