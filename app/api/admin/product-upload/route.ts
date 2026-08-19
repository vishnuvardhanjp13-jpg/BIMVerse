import { getDeliveryBindings } from "../../../../db/delivery";

const UPLOAD_TARGETS: Record<string, { objectKey: string; contentType: string }> = {
  "product-01": {
    objectKey: "bep/BEP-Template-Discipline-Based-Final.docx",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "product-02-standard": {
    objectKey: "appendix/BIMVERSE-Appendix-Standard.zip",
    contentType: "application/zip",
  },
  "product-02-professional": {
    objectKey: "appendix/BIMVERSE-Appendix-Professional.zip",
    contentType: "application/zip",
  },
  "product-02-ultimate": {
    objectKey: "appendix/BIMVERSE-Appendix-Ultimate.zip",
    contentType: "application/zip",
  },
};

export async function POST(request: Request) {
  const { FILES, PRODUCT_UPLOAD_SECRET } = getDeliveryBindings();
  const authorization = request.headers.get("authorization") ?? "";
  if (!PRODUCT_UPLOAD_SECRET || authorization !== `Bearer ${PRODUCT_UPLOAD_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = request.headers.get("x-bimverse-product") ?? "";
  const target = UPLOAD_TARGETS[product];
  if (!target) return Response.json({ error: "Unknown product" }, { status: 400 });
  if (!request.body) return Response.json({ error: "Missing file" }, { status: 400 });

  await FILES.put(target.objectKey, request.body, {
    httpMetadata: { contentType: target.contentType },
    customMetadata: { product, uploadedAt: new Date().toISOString() },
  });

  return Response.json({ uploaded: true, product, objectKey: target.objectKey });
}
