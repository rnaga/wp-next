import NextAuth from "next-auth";
import { authOptions } from "@rnaga/wp-next-core/server/wp";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
