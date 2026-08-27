import Link from "next/link";
import { NeoButton } from "@/components/ui/NeoButton";

export default function NotFound() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[calc(100vh-84px)] p-8 text-center bg-neo-peach">
      <div className="max-w-md w-full">
        <h1 className="font-serif text-9xl font-black mb-4">404</h1>
        <div className="bg-white border-4 border-black p-6 shadow-neo transform -rotate-2 mb-8">
          <h2 className="font-bold text-2xl mb-2">Page Not Found</h2>
          <p className="font-medium text-gray-700">We looked everywhere, but the book or page you are looking for doesn't exist.</p>
        </div>
        <Link href="/">
          <NeoButton variant="primary" size="lg" className="w-full bg-neo-yellow">
            Return Home
          </NeoButton>
        </Link>
      </div>
    </div>
  );
}
