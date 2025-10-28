import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            DirectoryBolt
          </h1>
          <p className="text-gray-600 mb-8">
            Automated Directory Submissions Platform
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/admin/dashboard"
            className="block w-full px-6 py-3 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Admin Dashboard
          </Link>

          <Link
            href="/admin/customers"
            className="block w-full px-6 py-3 text-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
          >
            Manage Customers
          </Link>

          <Link
            href="/admin/jobs"
            className="block w-full px-6 py-3 text-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
          >
            Monitor Jobs
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            DirectoryBolt v2.0.1
          </p>
        </div>
      </div>
    </div>
  );
}
