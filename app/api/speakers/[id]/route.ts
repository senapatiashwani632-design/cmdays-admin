import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Speaker from "@/app/models/Speaker";
import { getGridFSBucket } from "@/app/lib/gridfs";
import { ObjectId } from "mongodb";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/*
========================================
PATCH → Update Speaker
========================================
*/
export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  try {
    await dbConnect();

    const { id } = await params;

    const speaker = await Speaker.findById(id);

    if (!speaker) {
      return NextResponse.json(
        { error: "Speaker not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const name = formData.get("name") as string | null;
    const role = formData.get("role") as string | null;
    const talkTitle = formData.get("talkTitle") as string | null;
    const abstract = formData.get("abstract") as string | null;
    const bio = formData.get("bio") as string | null;

    const image = formData.get("image") as File | null;

    /*
    ========================================
    Update Text Fields
    ========================================
    */

    if (name) speaker.name = name;

    if (role) speaker.role = role;

    if (talkTitle) speaker.talkTitle = talkTitle;

    if (abstract) speaker.abstract = abstract;
    if (bio) speaker.bio = bio;

    /*
    ========================================
    Replace Image If New Image Uploaded
    ========================================
    */

    if (image && image.size > 0) {
      const bucket = getGridFSBucket();

      /*
      Delete old image
      */
      try {
        await bucket.delete(
          new ObjectId(
            speaker.imageFileId.toString()
          )
        );
      } catch (err) {
        console.error(
          "Failed deleting old image:",
          err
        );
      }

      /*
      Upload new image
      */
      const bytes = await image.arrayBuffer();

      const buffer = Buffer.from(bytes);

      const uploadStream =
        bucket.openUploadStream(image.name, {
          metadata: {
            contentType: image.type,
          },
        });

      uploadStream.end(buffer);

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);

        uploadStream.on("error", reject);
      });

      /*
      Save new image id
      */
      speaker.imageFileId =
        uploadStream.id as ObjectId;
    }

    await speaker.save();

    return NextResponse.json(
      {
        message: "Speaker updated successfully",
        speaker,
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}

/*
========================================
DELETE → Delete Speaker + Image
========================================
*/
export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    await dbConnect();

    const { id } = await params;

    const speaker = await Speaker.findById(id);

    if (!speaker) {
      return NextResponse.json(
        { error: "Speaker not found" },
        { status: 404 }
      );
    }

    /*
    ========================================
    Delete GridFS Image
    ========================================
    */

    const bucket = getGridFSBucket();

    try {
      await bucket.delete(
        new ObjectId(
          speaker.imageFileId.toString()
        )
      );
    } catch (err) {
      console.error(
        "Failed deleting image:",
        err
      );
    }

    /*
    ========================================
    Delete Speaker Document
    ========================================
    */

    await Speaker.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: "Speaker deleted successfully",
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}