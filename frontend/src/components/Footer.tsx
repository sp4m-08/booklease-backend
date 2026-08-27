import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-4 border-black bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="inline-block text-2xl font-serif font-black tracking-tight border-4 border-black px-3 py-1 bg-neo-yellow shadow-neo select-none">
              📚 Booklease VIT
            </div>
            <p className="font-medium text-base text-gray-700 max-w-md">
              Peer-to-peer textbook rentals and handwritten study notes designed specifically for <strong>VIT Vellore University</strong> students preparing for <strong>CAT-1, CAT-2, and FAT</strong> exams.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="border-2 border-black px-2.5 py-0.5 bg-neo-green font-black text-xs uppercase shadow-sm">
                🎓 VIT Vellore Verified
              </span>
              <span className="border-2 border-black px-2.5 py-0.5 bg-neo-yellow font-black text-xs uppercase shadow-sm">
                ⚡ CAT & FAT Prep
              </span>
              <span className="border-2 border-black px-2.5 py-0.5 bg-neo-peach font-black text-xs uppercase shadow-sm">
                📍 SJT • TT • Hostels
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-bold text-sm">
            <h4 className="font-serif text-lg font-black uppercase tracking-wider text-black border-b-2 border-black pb-1">
              Exam Material
            </h4>
            <ul className="space-y-2 text-gray-800">
              <li>
                <Link href="/books" className="hover:underline hover:text-black">
                  📚 Course Reference Books
                </Link>
              </li>
              <li>
                <Link href="/notes" className="hover:underline hover:text-black">
                  📝 CAT & FAT Revision Notes
                </Link>
              </li>
              <li>
                <Link href="/books/upload" className="hover:underline hover:text-black">
                  ➕ List a Textbook for Rent
                </Link>
              </li>
              <li>
                <Link href="/notes/upload" className="hover:underline hover:text-black">
                  📤 Share Module Cheatsheets
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Account */}
          <div className="space-y-3 font-bold text-sm">
            <h4 className="font-serif text-lg font-black uppercase tracking-wider text-black border-b-2 border-black pb-1">
              Campus Hub
            </h4>
            <ul className="space-y-2 text-gray-800">
              <li>
                <Link href="/listings" className="hover:underline hover:text-black">
                  📦 Your Active Listings
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:underline hover:text-black">
                  📊 Rental Requests & Returns
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:underline hover:text-black">
                  👤 Student Profile & Wishlist
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:underline hover:text-black">
                  ❓ CAT/FAT Prep & Campus FAQ
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t-2 border-dashed border-black flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-600">
          <div>
            © {new Date().getFullYear()} Booklease. Built for VIT Vellore University students.
          </div>
          <div className="flex gap-4">
            <Link href="/faq" className="hover:underline">CAT/FAT Fair Use</Link>
            <span>•</span>
            <Link href="/faq" className="hover:underline">Hostel Handover Safety</Link>
            <span>•</span>
            <Link href="/faq" className="hover:underline">VIT Guidelines</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
