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
GET → Fetch all committees or single committee
========================================
*/

export async function GET() {
  try {
    await dbConnect();
    const committeeMembers = await Commitee.find().lean().sort({ order: 1 });

    const transformed = committeeMembers.map((member) => ({
      _id: member._id,
      name: member.name,
      role: member.role,
      category: member.category,
      order: member.order,
      imageUrl: `/api/committee/images/${member.imageFileId.toString()}`,
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
/*
========================================
POST → Create new committee member
========================================
*/
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const category = formData.get("category") as string;
    const order = formData.get("order") as string | null;
    const image = formData.get("image") as File | null;

    // Validation
    if (!name || !role || !category) {
      return NextResponse.json(
        { error: "Name, role, and category are required" },
        { status: 400 }
      );
    }

    // Validate category
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

    // Validate image
    if (!image || image.size === 0) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    /*
    ========================================
    Upload Image to GridFS
    ========================================
    */
    const bucket = getGridFSBucket();
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadStream = bucket.openUploadStream(image.name, {
      metadata: {
        contentType: image.type,
      },
    });

    uploadStream.end(buffer);

    const uploadResult = await new Promise<{ id: ObjectId }>((resolve, reject) => {
      uploadStream.on("finish", () => {
        resolve({ id: uploadStream.id as ObjectId });
      });
      uploadStream.on("error", reject);
    });

    /*
    ========================================
    Create Committee Member
    ========================================
    */
    const committee = await Commitee.create({
      name,
      role,
      category,
      imageFileId: uploadResult.id,
      order: order ? parseInt(order) : 0,
    });

    return NextResponse.json(
      {
        message: "Committee member created successfully",
        committee,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}