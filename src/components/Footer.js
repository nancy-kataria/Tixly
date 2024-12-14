import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-4xl font-bold cursor-pointer">Tixly</div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                Email:{" "}
                <a
                  href="mailto:support@tixly.com"
                  className="text-blue-400 hover:underline"
                >
                  support@tixly.com
                </a>
              </li>
              <li>
                Phone:{" "}
                <a
                  href="tel:+1234567890"
                  className="text-blue-400 hover:underline"
                >
                  +1 234 567 890
                </a>
              </li>
              <li>
                Address: <span>990 Nutwood Ave, Fullerton, CA 45678</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-blue-400 hover:underline">
                  About Tixly
                </a>
              </li>
              <li>
                <a className="text-blue-400 hover:underline">
                  Terms of Service
                </a>
              </li>
              <li>
                <a className="text-blue-400 hover:underline">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-4 text-center">
          <p className="text-sm">&copy; 2024 Tixly. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
