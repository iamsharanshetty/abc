export default function DemoEmbedPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 border-t-8 border-blue-600">

            {/* Mock Customer Website Header */}
            <header className="container mx-auto px-6 py-6 flex items-center justify-between">
                <div className="font-bold text-2xl tracking-tight">Acme Corp</div>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#" className="hover:text-blue-600">Products</a>
                    <a href="#" className="hover:text-blue-600">Solutions</a>
                    <a href="#" className="hover:text-blue-600">Pricing</a>
                    <a href="#" className="hover:text-blue-600">Contact</a>
                </nav>
                <div className="flex gap-4">
                    <button className="px-5 py-2 rounded-full border border-slate-200 text-sm font-semibold">Login</button>
                    <button className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold">Get Started</button>
                </div>
            </header>

            {/* Mock Hero */}
            <div className="bg-slate-50 py-24">
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold mb-6">
                            NEW FEATURE
                        </div>
                        <h1 className="text-5xl font-extrabold mb-6 leading-tight text-slate-900">
                            Automate your workflow <br />
                            <span className="text-blue-600">Focus on growth.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            Acme Corp helps you streamline your business processes with our cutting-edge capabilities. Stop wasting time on manual tasks.
                        </p>
                        <div className="flex gap-4">
                            <button className="px-8 py-4 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30">Start Free Trial</button>
                            <button className="px-8 py-4 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold">Watch Demo</button>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                        <div className="space-y-4">
                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                            <div className="h-32 bg-slate-100 rounded w-full"></div>
                            <div className="flex gap-4">
                                <div className="h-10 bg-blue-100 rounded w-1/3"></div>
                                <div className="h-10 bg-slate-100 rounded w-1/3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOCK EMBED SCRIPT */}
            {/* In a real scenario, this would be injected by a script tag.
            Here we simulate the iframe that the script would create.
        */}
            <div className="fixed inset-0 pointer-events-none z-[9999]">
                <iframe
                    src="/embed/chat/demo"
                    className="w-full h-full border-0 pointer-events-auto"
                    style={{
                        // In reality, we'd probably make the iframe small and expand it, 
                        // or use a transparent transparent iframe. 
                        // However, `pointer-events-none` on container and `pointer-events-auto` on iframe 
                        // might grab clicks on the whole overlay if the iframe is full width/height.
                        // 
                        // Better approach for prototype: 
                        // The iframe source page has a transparent background.
                        // We need to ensure the iframe allows click-through.
                        // Standard iframes consume all clicks.
                        // 
                        // Alternative for PROTOTYPE: Position the iframe exactly where the widget is.
                        // But the widget expands.
                        // 
                        // Let's use a "smart" sized iframe for the demo.
                        // It starts small (bottom right) and we can't easily expand it from inside without postMessage.
                        //
                        // To keep it simple: reliable full-screen iframe handling is complex.
                        // I will just put the iframe in the bottom right corner with a fixed size 
                        // that covers the "Open" state.
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '400px',
                        height: '700px', // Enough to cover the open widget
                        background: 'transparent'
                    }}
                    allowTransparency={true}
                />
            </div>

        </div>
    );
}
