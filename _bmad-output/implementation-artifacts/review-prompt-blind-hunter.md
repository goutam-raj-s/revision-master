Review this diff as the **Blind Hunter**.

You are a cynical, adversarial code reviewer. You have no context about what this code is supposed to do. You only see the diff. Look for:
- Syntax errors, typos, obvious bugs
- Unhandled edge cases, null pointer exceptions, unhandled promises
- Security vulnerabilities, hardcoded secrets
- Memory leaks, performance cliffs
- Poor naming, confusing logic, code smells

**Diff:**
```diff
diff --git a/extension/popup.html b/extension/popup.html
index 52b9d31..cdf9e3e 100644
--- a/extension/popup.html
+++ b/extension/popup.html
@@ -28,7 +28,17 @@
 
       <div class="form-group">
         <label for="notes">Notes</label>
-        <textarea id="notes" name="notes" rows="4" placeholder="Add your notes here..."></textarea>
+        <textarea id="notes" name="notes" rows="3" placeholder="Add your notes here..."></textarea>
+      </div>
+
+      <div class="form-group">
+        <label for="tags">Tags</label>
+        <input type="text" id="tags" name="tags" placeholder="e.g. react, chrome extension">
+      </div>
+
+      <div class="form-group">
+        <label for="terminology">Terminology</label>
+        <textarea id="terminology" name="terminology" rows="3" placeholder="Term: Definition"></textarea>
       </div>
 
       <button type="submit" id="submit-btn" class="submit-btn">Save to Revision Master</button>
diff --git a/extension/popup.js b/extension/popup.js
index 1149e0c..816f316 100644
--- a/extension/popup.js
+++ b/extension/popup.js
@@ -3,6 +3,8 @@ document.addEventListener('DOMContentLoaded', async () => {
   const titleInput = document.getElementById('title');
   const urlInput = document.getElementById('url');
   const notesInput = document.getElementById('notes');
+  const tagsInput = document.getElementById('tags');
+  const terminologyInput = document.getElementById('terminology');
   const statusMessage = document.getElementById('status-message');
   const submitBtn = document.getElementById('submit-btn');
   const closeBtn = document.getElementById('close-btn');
@@ -51,7 +53,9 @@ document.addEventListener('DOMContentLoaded', async () => {
     const payload = {
       title: titleInput.value,
       url: urlInput.value,
-      notes: notesInput.value
+      notes: notesInput.value,
+      tags: tagsInput.value,
+      terminology: terminologyInput.value
     };
 
     try {
@@ -75,6 +79,8 @@ document.addEventListener('DOMContentLoaded', async () => {
       
       // Clear notes after success
       notesInput.value = '';
+      tagsInput.value = '';
+      terminologyInput.value = '';
       
       // Auto close after 2 seconds if injected
       if (isInjected) {
diff --git a/src/app/api/documents/clipper/route.ts b/src/app/api/documents/clipper/route.ts
index 545cff6..483f2d9 100644
--- a/src/app/api/documents/clipper/route.ts
+++ b/src/app/api/documents/clipper/route.ts
@@ -1,14 +1,16 @@
 import { NextResponse } from "next/server";
 import { getSession } from "@/lib/auth/session";
 import { ObjectId } from "mongodb";
-import { getDocumentsCollection, getRepetitionsCollection, getNotesCollection } from "@/lib/db/collections";
+import { getDocumentsCollection, getRepetitionsCollection, getNotesCollection, getTermsCollection } from "@/lib/db/collections";
 import { getCustomNextReviewDate } from "@/lib/srs/engine";
 import { z } from "zod";
 
 const ClipperPayloadSchema = z.object({
   url: z.string().url(),
   title: z.string().min(1).max(500),
-  notes: z.string().optional()
+  notes: z.string().optional(),
+  tags: z.string().optional(),
+  terminology: z.string().optional()
 });
 
 
@@ -45,7 +47,7 @@ export async function POST(req: Request) {
       return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400, headers: corsHeaders });
     }
 
-    const { url, title, notes } = parsed.data;
+    const { url, title, notes, tags, terminology } = parsed.data;
     const userId = session.id;
 
     const docs = await getDocumentsCollection();
@@ -57,7 +59,12 @@ export async function POST(req: Request) {
       docId = existing._id;
       // Maybe update the title? We'll just leave it.
     } else {
-      const now = new Date();
+      const tagList = ["web-clip"];
+      if (tags && tags.trim()) {
+        const customTags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
+        tagList.push(...customTags);
+      }
+
       const docResult = await docs.insertOne({
         _id: new ObjectId(),
         userId: new ObjectId(userId),
@@ -65,7 +72,7 @@ export async function POST(req: Request) {
         title,
         status: "first_visit",
         difficulty: "medium",
-        tags: ["web-clip"],
+        tags: tagList,
         isLinkBroken: false,
         mediaType: "document",
         createdAt: now,
@@ -101,6 +108,39 @@ export async function POST(req: Request) {
       });
     }
 
+    // Add terminology if provided
+    if (terminology && terminology.trim().length > 0) {
+      const termsCol = await getTermsCollection();
+      const lines = terminology.split('\n');
+      const termsToInsert = [];
+      const now = new Date();
+      
+      for (const line of lines) {
+        if (!line.trim() || !line.includes(':')) continue;
+        
+        const separatorIndex = line.indexOf(':');
+        const termStr = line.substring(0, separatorIndex).trim();
+        const definitionStr = line.substring(separatorIndex + 1).trim();
+        
+        if (termStr && definitionStr) {
+          termsToInsert.push({
+            _id: new ObjectId(),
+            userId: new ObjectId(userId),
+            docId: docId,
+            term: termStr,
+            definition: definitionStr,
+            isDone: false,
+            createdAt: now,
+            updatedAt: now,
+          });
+        }
+      }
+      
+      if (termsToInsert.length > 0) {
+        await termsCol.insertMany(termsToInsert);
+      }
+    }
+
     return NextResponse.json({ success: true, docId: docId.toString() }, { headers: corsHeaders });
   } catch (error) {
     console.error("Clipper API Error:", error);
diff --git a/src/components/features/global-clipper-widget.tsx b/src/components/features/global-clipper-widget.tsx
index 1cd0509..01a3358 100644
--- a/src/components/features/global-clipper-widget.tsx
+++ b/src/components/features/global-clipper-widget.tsx
@@ -24,6 +24,8 @@ export function GlobalClipperWidget() {
         title: formData.get("title") as string,
         url: formData.get("url") as string,
         notes: formData.get("notes") as string,
+        tags: formData.get("tags") as string,
+        terminology: formData.get("terminology") as string,
       };
 
       try {
@@ -129,12 +131,33 @@ export function GlobalClipperWidget() {
           <textarea
             id="clipper-notes"
             name="notes"
-            rows={3}
+            rows={2}
             placeholder="Add your notes..."
             className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent resize-none"
           />
         </div>
 
+        <div className="space-y-1">
+          <label htmlFor="clipper-tags" className="text-xs font-medium text-zinc-500">Tags</label>
+          <input
+            id="clipper-tags"
+            name="tags"
+            placeholder="e.g. react, chrome extension"
+            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent"
+          />
+        </div>
+
+        <div className="space-y-1">
+          <label htmlFor="clipper-terminology" className="text-xs font-medium text-zinc-500">Terminology</label>
+          <textarea
+            id="clipper-terminology"
+            name="terminology"
+            rows={2}
+            placeholder="Term: Definition"
+            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent resize-none"
+          />
+        </div>
+
         <SubmitButton />
       </form>
     </div>
```
