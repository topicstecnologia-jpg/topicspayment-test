import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME } from "@/lib/constants";

export default function HomePage() {
  const hasSessionCookie = cookies().has(AUTH_COOKIE_NAME);

  redirect(hasSessionCookie ? "/dashboard" : "/login");
}
