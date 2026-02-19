"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Row = { nickname: string; score: number };

export default function LeaderboardPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/quizzes/${slug}/leaderboard`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) throw new Error(data.error);
                setRows(data.rows || []);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [slug]);

    const getRankIcon = (index: number) => {
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";
        return index + 1;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center">
            <header className="w-full max-w-lg px-6 pt-10 pb-6 flex items-center justify-between z-10">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-[var(--tertiary-bg)] flex items-center justify-center text-white ios-button border border-[var(--glass-border)]"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-white">순위표</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="w-full max-w-lg px-6 pb-32">
                <div className="ios-card p-6 mb-8">
                    <h2 className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest mb-6 px-1">
                        최고 득점자 TOP 50
                    </h2>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center">
                            <p className="text-[var(--color-error)] font-medium">{error}</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="py-12 text-center space-y-4">
                            <div className="text-4xl">🌵</div>
                            <p className="text-[var(--text-tertiary)] font-medium">
                                아직 도전한 사람이 없어요.<br />첫 번째 주인공이 되어보세요!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rows.map((row, i) => (
                                <div
                                    key={`${row.nickname}-${i}`}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${i === 0
                                            ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30"
                                            : "bg-[var(--bg-color)]/50 border-[var(--glass-border)]"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${i < 3 ? "text-2xl" : "text-[var(--text-tertiary)] bg-white/5"
                                            }`}>
                                            {getRankIcon(i)}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold">{row.nickname}</p>
                                            <p className="text-[var(--text-tertiary)] text-xs uppercase font-bold tracking-tighter">
                                                {i === 0 ? "Legendary Score" : "Challenger"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[var(--color-primary)] font-black text-xl">{row.score}</p>
                                        <p className="text-[10px] text-[var(--text-tertiary)] font-bold">PTS</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Link
                    href={`/q/${slug}`}
                    className="block w-full py-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-lg text-center ios-button shadow-lg shadow-[var(--color-primary)]/20"
                >
                    나도 도전하기
                </Link>
            </main>

            <footer className="fixed bottom-0 w-full max-w-lg ios-glass h-20 px-6 flex items-center justify-center z-50">
                <Link href="/" className="text-[var(--text-secondary)] font-bold hover:text-white transition-colors">
                    메인으로 돌아가기
                </Link>
            </footer>
        </div>
    );
}
