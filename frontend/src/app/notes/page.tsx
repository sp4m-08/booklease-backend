import { redirect } from "next/navigation";

export default function NotesPage() {
  redirect("/browse?type=notes");
}
