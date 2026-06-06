export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    success: true,
    message: "STRYK API is working",
  });
}
