import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LandingClient from "./LandingClient";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return <LandingClient />;
}
