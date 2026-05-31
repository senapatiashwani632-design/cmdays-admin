import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import Commitee from "@/app/models/Commitee";
import { getGridFSBucket } from "@/app/lib/gridfs";
import { ObjectId } from "mongodb";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/*
========================================
PATCH → Update Committee Member
========================================
*/
export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  try {
    await dbConnect();

    const { id } = await params;

    const committee = await Commitee.findById(id);

    if (!committee) {
      return NextResponse.json(
        { error: "Committee member not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const name = formData.get("name") as string | null;
    const role = formData.get("role") as string | null;
    const category = formData.get("category") as string | null;
    const order = formData.get("order") as string | null;
    const image = formData.get("image") as File | null;

    /*
    ========================================
    Update Text Fields
    ========================================
    */

    if (name) committee.name = name;
    if (role) committee.role = role;
    
    // Validate category if provided
    if (category) {
      const validCategories = [
        "Central Organizing Committee",
        "Central Advisory Committee",
        "Local Organizing Committee",
      ];
      
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
      committee.category = category;
    }
    
    if (order !== null && order !== undefined) {
      committee.order = parseInt(order);
    }

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
            committee.imageFileId.toString()
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
      committee.imageFileId =
        uploadStream.id as ObjectId;
    }

    await committee.save();

    return NextResponse.json(
      {
        message: "Committee member updated successfully",
        committee,
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
DELETE → Delete Committee Member + Image
========================================
*/
export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    await dbConnect();

    const { id } = await params;

    const committee = await Commitee.findById(id);

    if (!committee) {
      return NextResponse.json(
        { error: "Committee member not found" },
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
          committee.imageFileId.toString()
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
    Delete Committee Member Document
    ========================================
    */

    await Commitee.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: "Committee member deleted successfully",
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