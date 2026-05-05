import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ObjectId } from "mongodb";
import { getDocumentsCollection, getRepetitionsCollection, getNotesCollection, getTermsCollection } from "@/lib/db/collections";
import { getCustomNextReviewDate } from "@/lib/srs/engine";
import { z } from "zod";

const ClipperPayloadSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(500),
  notes: z.string().optional(),
  tags: z.string().optional(),
  terminology: z.string().optional()
});


export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in to Revision Master first." }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const parsed = ClipperPayloadSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400, headers: corsHeaders });
    }

    const { url, title, notes, tags, terminology } = parsed.data;
    const userId = session.id;

    const docs = await getDocumentsCollection();
    const existing = await docs.findOne({ userId: new ObjectId(userId), url });

    let docId: ObjectId;

    if (existing) {
      docId = existing._id;
      // Maybe update the title? We'll just leave it.
    } else {
      const tagList = ["web-clip"];
      if (tags && tags.trim()) {
        const customTags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        tagList.push(...customTags);
      }

      const docResult = await docs.insertOne({
        _id: new ObjectId(),
        userId: new ObjectId(userId),
        url,
        title,
        status: "first_visit",
        difficulty: "medium",
        tags: tagList,
        isLinkBroken: false,
        mediaType: "document",
        createdAt: now,
        updatedAt: now,
      });

      docId = docResult.insertedId;

      const reps = await getRepetitionsCollection();
      await reps.insertOne({
        _id: new ObjectId(),
        userId: new ObjectId(userId),
        docId,
        nextReviewDate: getCustomNextReviewDate(2),
        intervalDays: 2,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Add notes if provided
    if (notes && notes.trim().length > 0) {
      const notesCol = await getNotesCollection();
      await notesCol.insertOne({
        _id: new ObjectId(),
        userId: new ObjectId(userId),
        docId,
        content: notes.trim(),
        isDone: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Add terminology if provided
    if (terminology && terminology.trim().length > 0) {
      const termsCol = await getTermsCollection();
      const lines = terminology.split('\n');
      const termsToInsert = [];
      const now = new Date();
      
      for (const line of lines) {
        if (!line.trim() || !line.includes(':')) continue;
        
        const separatorIndex = line.indexOf(':');
        const termStr = line.substring(0, separatorIndex).trim();
        const definitionStr = line.substring(separatorIndex + 1).trim();
        
        if (termStr && definitionStr) {
          termsToInsert.push({
            _id: new ObjectId(),
            userId: new ObjectId(userId),
            docId: docId,
            term: termStr,
            definition: definitionStr,
            isDone: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      
      if (termsToInsert.length > 0) {
        await termsCol.insertMany(termsToInsert);
      }
    }

    return NextResponse.json({ success: true, docId: docId.toString() }, { headers: corsHeaders });
  } catch (error) {
    console.error("Clipper API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
