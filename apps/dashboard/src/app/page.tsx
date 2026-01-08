import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-green-700">FieldMCP</div>
        <div className="space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto text-center py-20 px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Connect your AI to farm data
          <br />
          <span className="text-green-600">in minutes, not weeks</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          FieldMCP provides MCP servers for agricultural APIs. Integrate with
          John Deere, Climate FieldView, and more through a unified, LLM-ready
          interface.
        </p>
        <Link
          href="/signup"
          className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 inline-block"
        >
          Start Building Free
        </Link>
      </section>

      <section className="max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Get your API key</h3>
            <p className="text-gray-600">
              Sign up and get an API key in seconds. Free tier includes 1,000
              requests per month.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">Connect farmers</h3>
            <p className="text-gray-600">
              Use our OAuth flow to let farmers connect their John Deere
              Operations Center accounts.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">Query with AI</h3>
            <p className="text-gray-600">
              Use our MCP servers with Claude, Cursor, or any MCP-compatible
              client to access farm data.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
