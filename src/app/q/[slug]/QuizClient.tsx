"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    TouchSensor,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Quiz = { title: string; items: string[] };

function SortableRankedItem({
    id,
    value,
    rank,
    onRemove,
}: {
    id: string;
    value: string;
    rank: number;
    onRemove: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? "none" : transition,
        zIndex: isDragging ? 100 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 p-4 ios-card transition-all ${isDragging ? "opacity-50 shadow-2xl scale-[1.02]" : "active:scale-[0.98]"
                }`}
        >
            <div className="flex flex-col items-center justify-center min-w-[40px] h-10 rounded-full bg-[var(--tertiary-bg)] shrink-0">
                <span className="text-[var(--color-primary)] font-bold text-sm">{rank}</span>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase leading-none">위</span>
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2 overflow-hidden">
                <span className="truncate text-white font-medium text-lg cursor-pointer" onClick={onRemove}>
                    {value}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    <div
                        className="text-[var(--text-tertiary)] hover:text-white cursor-grab active:cursor-grabbing p-2 touch-none"
                        {...attributes}
                        {...listeners}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M7 11h10M7 15h10M7 7h10" strokeLinecap="round" />
                        </svg>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyRankSlot({ rank }: { rank: number }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] opacity-40">
            <div className="flex flex-col items-center justify-center min-w-[40px] h-10 rounded-full bg-white/10 shrink-0">
                <span className="text-white/40 font-bold text-sm">{rank}</span>
            </div>
            <span className="text-white/20 font-medium italic">아티스트를 위에서 선택해주세요</span>
        </div>
    );
}

export default function QuizClient({ slug, initialData }: { slug: string; initialData: Quiz | null }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [quiz, setQuiz] = useState<Quiz | null>(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState("");
    const [order, setOrder] = useState<string[]>([]);
    const [pool, setPool] = useState<string[]>([]);
    const [nickname, setNickname] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showShare, setShowShare] = useState(false);

    const created = searchParams.get("created") === "1";

    useEffect(() => {
        if (initialData) {
            setPool([...initialData.items].sort(() => Math.random() - 0.5));
            setLoading(false);
            return;
        }

        fetch(`/api/quizzes/${slug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) throw new Error(data.error);
                setQuiz(data);
                setPool([...data.items].sort(() => Math.random() - 0.5));
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [slug, initialData]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleSelect = (item: string) => {
        if (order.length >= (quiz?.items.length || 10)) return;
        setPool((prev) => prev.filter((i) => i !== item));
        setOrder((prev) => [...prev, item]);
    };

    const handleRemove = (item: string) => {
        setOrder((prev) => prev.filter((i) => i !== item));
        setPool((prev) => [...prev, item]);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setOrder((prev) => {
                const oldIndex = prev.indexOf(active.id as string);
                const newIndex = prev.indexOf(over.id as string);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (order.length < (quiz?.items.length || 10)) {
            setError("모든 항목의 순위를 정해주세요.");
            return;
        }
        if (!nickname.trim()) {
            setError("닉네임을 입력해주세요.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const answers = order.map((name, i) => ({ name, rank: i + 1 }));
            const res = await fetch(`/api/quizzes/${slug}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname: nickname.trim(), answers }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "제출 실패");

            // GA4 Tracking: Problem Solving Completion
            if (typeof window !== "undefined" && (window as any).gtag) {
                (window as any).gtag("event", "activate", {
                    event_category: "test",
                    event_label: "answer_test",
                    service_name: "my-musician-test"
                });
            }

            router.push(`/q/${slug}/result/${data.submissionId}?score=${data.score}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "제출에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/q/${slug}` : "";

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setShowShare(false);
        alert("링크가 복사되었습니다!");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
                    <p className="text-[var(--text-secondary)] font-medium">퀴즈 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error && !quiz) {
        return (
            <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-full flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                    </svg>
                </div>
                <p className="text-white text-lg font-bold mb-2">{error}</p>
                <Link href="/" className="text-[var(--color-primary-light)] font-medium hover:underline">
                    홈으로 돌아가기
                </Link>
            </div>
        );
    }

    if (!quiz) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center">
            <header className="fixed top-0 w-full max-w-lg ios-glass z-50 px-4 h-16 flex items-center justify-between">
                <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--tertiary-bg)] transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
                <h1 className="text-base font-bold text-white truncate px-4">{quiz.title}</h1>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowShare(!showShare)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--tertiary-bg)] transition-colors text-[var(--color-primary)] ${created ? "animate-pulse ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-black" : ""}`}
                        aria-label="공유하기"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {created && !showShare && (
                        <div className="absolute top-14 right-0 w-max z-50 animate-bounce">
                            <div className="bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl relative">
                                <div className="absolute -top-1 right-3 w-2 h-2 bg-[var(--color-primary)] rotate-45" />
                                친구에게 공유해보세요! 👆
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {showShare && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center p-6 pb-safe" onClick={() => setShowShare(false)}>
                    <div className="w-full max-w-md ios-glass p-6 pb-8 rounded-t-[32px] rounded-b-none space-y-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto" />
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">친구에게 공유하기</h3>
                            <button onClick={() => setShowShare(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[var(--text-secondary)]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[var(--tertiary-bg)] border border-[var(--glass-border)]">
                                <p className="text-[var(--text-secondary)] text-xs font-bold uppercase mb-2">공유 링크</p>
                                <input
                                    readOnly
                                    value={shareUrl}
                                    className="w-full bg-transparent text-white text-sm focus:outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={copyLink}
                                className="w-full py-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-lg ios-button"
                            >
                                링크 복사하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="w-full max-w-lg px-6 pt-24 pb-48">
                <div className="mb-10 space-y-2">
                    <h2 className="text-3xl font-black text-white leading-tight">
                        {quiz.title}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">
                        👇 아티스트를 차례대로 클릭해서 1위부터 10위를 정해주세요!
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {pool.length > 0 && (
                        <section className="space-y-4">
                            <h3 className="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest px-1">Available Artists</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {pool.map((artist) => (
                                    <button
                                        key={artist}
                                        type="button"
                                        onClick={() => handleSelect(artist)}
                                        className="p-4 rounded-2xl bg-[var(--tertiary-bg)] text-white font-bold text-sm border border-[var(--glass-border)] hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)] active:scale-95 transition-all text-left truncate flex items-center justify-between group"
                                    >
                                        <span>{artist}</span>
                                        <span className="opacity-0 group-hover:opacity-50 text-xs">+</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="space-y-4 pt-4">
                        <h3 className="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest px-1">Selected Ranking</h3>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={order}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3 min-h-[100px]">
                                    {order.map((item, i) => (
                                        <SortableRankedItem
                                            key={item}
                                            id={item}
                                            value={item}
                                            rank={i + 1}
                                            onRemove={() => handleRemove(item)}
                                        />
                                    ))}
                                    {Array.from({ length: Math.max(0, 10 - order.length) }).map((_, i) => (
                                        <EmptyRankSlot key={`empty-${i}`} rank={order.length + i + 1} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </section>

                    <section className="space-y-4 pt-10">
                        <h3 className="text-xs font-black text-[var(--text-tertiary)] uppercase tracking-widest px-1">Submit Result</h3>
                        <div className="ios-card p-4">
                            <label className="block text-[var(--text-tertiary)] text-[10px] font-black uppercase tracking-tighter mb-1">Nickname</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="내 이름이나 별명을 입력해줘"
                                className="w-full bg-transparent text-xl font-bold text-white placeholder:text-[var(--text-tertiary)] focus:outline-none"
                                maxLength={50}
                            />
                        </div>
                    </section>

                    <div className="fixed bottom-0 left-0 right-0 p-6 ios-glass z-50 flex flex-col items-center">
                        <div className="w-full max-w-lg">
                            {error && (
                                <p className="text-[var(--color-error)] text-center text-sm font-medium mb-4 animate-bounce">
                                    {error}
                                </p>
                            )}
                            {created && (
                                <div className="mb-4 py-2 px-4 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-xs font-bold text-center">
                                    ✨ 방금 만든 테스트예요! 이제 공유해보세요.
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting || order.length < (quiz?.items.length || 10)}
                                    className="flex-[2] py-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-lg ios-button disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-[var(--color-primary)]/10"
                                >
                                    {submitting ? "채점 중..." : "제출하고 결과 보기"}
                                </button>
                                <Link
                                    href={`/q/${slug}/leaderboard`}
                                    className="flex-1 py-4 rounded-2xl bg-[var(--tertiary-bg)] text-white font-bold text-lg text-center ios-button border border-[var(--glass-border)]"
                                >
                                    순위표
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
