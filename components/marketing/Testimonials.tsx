import { Quote } from 'lucide-react';

export function Testimonials() {
    const reviews = [
        {
            text: "WebRep explains our services better than our existing website. Lead quality doubled in the first week.",
            author: "Founder",
            role: "Digital Consultancy",
        },
        {
            text: "Our visitors understand our offer immediately now. Bookings increased without changing our site layout.",
            author: "Marketing Director",
            role: "Service Business",
        },
        {
            text: "It feels like having a smart employee on the website 24/7.",
            author: "Agency Owner",
            role: "Creative Agency",
        },
    ];

    return (
        <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        Businesses Are Already Seeing <br />
                        <span className="text-blue-600">Website-Changing Results</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.map((review, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-2xl relative">
                            <Quote className="w-10 h-10 text-blue-500/20 absolute top-6 right-6" />
                            <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-8 relative z-10">
                                "{review.text}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{review.author}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{review.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
