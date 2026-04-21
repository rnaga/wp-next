import { authOptions } from "@rnaga/wp-next-core/server/wp";
import { getServerSession } from "next-auth/next";

export async function GET() {
  const session = await getServerSession(authOptions);

  return Response.json(session);
}
