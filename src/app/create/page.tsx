"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

type Genre = "K-Indie" | "Pop" | "Rock" | "Hip-hop" | "Idol" | "Old Pop";

interface Artist {
    name: string;
    genre: Genre;
}

const ARTIST_EXAMPLES: Artist[] = [
    // K-Indie
    { name: "잔나비", genre: "K-Indie" }, { name: "혁오", genre: "K-Indie" }, { name: "10cm", genre: "K-Indie" },
    { name: "선우정아", genre: "K-Indie" }, { name: "치즈", genre: "K-Indie" }, { name: "검정치마", genre: "K-Indie" },
    { name: "백예린", genre: "K-Indie" }, { name: "멜로망스", genre: "K-Indie" }, { name: "옥상달빛", genre: "K-Indie" },
    { name: "새소년", genre: "K-Indie" }, { name: "카더가든", genre: "K-Indie" }, { name: "윤지영", genre: "K-Indie" },

    // Pop
    { name: "Taylor Swift", genre: "Pop" }, { name: "Bruno Mars", genre: "Pop" }, { name: "Ed Sheeran", genre: "Pop" },
    { name: "Charlie Puth", genre: "Pop" }, { name: "Justin Bieber", genre: "Pop" }, { name: "Ariana Grande", genre: "Pop" },
    { name: "Dua Lipa", genre: "Pop" }, { name: "The Weeknd", genre: "Pop" }, { name: "Maroon 5", genre: "Pop" },
    { name: "Coldplay", genre: "Pop" }, { name: "Olivia Rodrigo", genre: "Pop" }, { name: "Billie Eilish", genre: "Pop" },

    // Rock
    { name: "Queen", genre: "Rock" }, { name: "The Beatles", genre: "Rock" }, { name: "AC/DC", genre: "Rock" },
    { name: "Nirvana", genre: "Rock" }, { name: "Linkin Park", genre: "Rock" }, { name: "Radiohead", genre: "Rock" },
    { name: "Muse", genre: "Rock" }, { name: "Oasis", genre: "Rock" }, { name: "Bon Jovi", genre: "Rock" },
    { name: "Guns N' Roses", genre: "Rock" }, { name: "Metallica", genre: "Rock" }, { name: "Red Hot Chili Peppers", genre: "Rock" },

    // Hip-hop
    { name: "Eminem", genre: "Hip-hop" }, { name: "Kanye West", genre: "Hip-hop" }, { name: "Jay-Z", genre: "Hip-hop" },
    { name: "Drake", genre: "Hip-hop" }, { name: "Kendrick Lamar", genre: "Hip-hop" }, { name: "Post Malone", genre: "Hip-hop" },
    { name: "Travis Scott", genre: "Hip-hop" }, { name: "빈지노", genre: "Hip-hop" }, { name: "박재범", genre: "Hip-hop" },
    { name: "지코", genre: "Hip-hop" }, { name: "창모", genre: "Hip-hop" }, { name: "이센스", genre: "Hip-hop" },

    // Idol
    { name: "BTS", genre: "Idol" }, { name: "BLACKPINK", genre: "Idol" }, { name: "NewJeans", genre: "Idol" },
    { name: "IVE", genre: "Idol" }, { name: "SEVENTEEN", genre: "Idol" }, { name: "TWICE", genre: "Idol" },
    { name: "EXO", genre: "Idol" }, { name: "NCT", genre: "Idol" }, { name: "Stray Kids", genre: "Idol" },
    { name: "aespa", genre: "Idol" }, { name: "LE SSERAFIM", genre: "Idol" }, { name: "Red Velvet", genre: "Idol" },

    // Old Pop
    { name: "Michael Jackson", genre: "Old Pop" }, { name: "Whitney Houston", genre: "Old Pop" }, { name: "Stevie Wonder", genre: "Old Pop" },
    { name: "Elton John", genre: "Old Pop" }, { name: "Madonna", genre: "Old Pop" }, { name: "Prince", genre: "Old Pop" },
    { name: "David Bowie", genre: "Old Pop" }, { name: "ABBA", genre: "Old Pop" }, { name: "Bee Gees", genre: "Old Pop" },
    { name: "Carpenters", genre: "Old Pop" }, { name: "Billy Joel", genre: "Old Pop" }, { name: "Celine Dion", genre: "Old Pop" },
];

const STORAGE_KEY = "my-musician-test-draft";

function getWeightedRandomFive(fullList: Artist[], currentItems: string[]): string[] {
    // 1. Calculate genre counts in current items
    const genreCounts: Record<string, number> = {};
    currentItems.filter(Boolean).forEach(itemName => {
        // Find genre of item if it exists in our list
        const found = fullList.find(a => a.name === itemName);
        if (found) {
            genreCounts[found.genre] = (genreCounts[found.genre] || 0) + 1;
        }
    });

    // 2. Filter out already selected items
    const available = fullList.filter(a => !currentItems.some(i => i.trim() === a.name));

    // 3. Create weighted pool
    // Base weight = 1. Added weight = genreCount * 2.
    // This means if I have 2 Rock songs, weight is 1 + 4 = 5. Rock songs are 5x more likely to be picked than 0-count genres.
    const weightedPool: Artist[] = [];
    available.forEach(artist => {
        const weight = 1 + (genreCounts[artist.genre] || 0) * 3;
        for (let i = 0; i < weight; i++) {
            weightedPool.push(artist);
        }
    });

    // 4. Shuffle and pick
    const shuffled = weightedPool.sort(() => Math.random() - 0.5);
    // We need distinct items.
    const distinctSelected = new Set<string>();
    const result: string[] = [];

    for (const artist of shuffled) {
        if (result.length >= 5) break;
        if (!distinctSelected.has(artist.name)) {
            distinctSelected.add(artist.name);
            result.push(artist.name);
        }
    }

    // Fallback if we don't have enough (shouldn't happen with large list but good safety)
    if (result.length < 5) {
        const remaining = available.filter(a => !distinctSelected.has(a.name));
        const needed = 5 - result.length;
        result.push(...remaining.slice(0, needed).map(a => a.name));
    }

    return result;
}

function SortableItem({
    id,
    value,
    rank,
    onUpdate,
    onRemove,
}: {
    id: string;
    value: string;
    rank: number;
    onUpdate: (v: string) => void;
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
            className={`flex items-center gap-3 p-3 ios-card transition-all ${isDragging ? "opacity-50 shadow-2xl scale-[1.02]" : ""
                }`}
        >
            <button
                type="button"
                className="cursor-grab active:cursor-grabbing p-2 text-[var(--text-tertiary)] hover:text-white shrink-0 touch-none"
                {...attributes}
                {...listeners}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="9" cy="5" r="1.5" fill="currentColor" />
                    <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="9" cy="19" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="5" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="19" r="1.5" fill="currentColor" />
                </svg>
            </button>
            <div className="flex flex-col items-center justify-center min-w-[40px] h-10 rounded-full bg-[var(--tertiary-bg)]">
                <span className="text-[var(--color-primary)] font-bold text-sm">{rank}</span>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase leading-none">위</span>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onUpdate(e.target.value)}
                placeholder={`${rank}위 아티스트 입력`}
                className="flex-1 min-w-0 py-2 px-1 bg-transparent text-white font-medium placeholder:text-[var(--text-tertiary)] focus:outline-none"
                maxLength={50}
            />
            <button
                type="button"
                onClick={onRemove}
                className="p-2 mr-1 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--tertiary-bg)] hover:text-[var(--color-error)] transition-colors shrink-0"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export default function CreatePage() {
    const router = useRouter();
    const [nickname, setNickname] = useState("");
    const [items, setItems] = useState<string[]>(Array(10).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [exampleArtists, setExampleArtists] = useState<string[]>([]);

    useEffect(() => {
        // Load from local storage
        const saved = localStorage.getItem(STORAGE_KEY);
        let initialItems = Array(10).fill("");
        if (saved) {
            try {
                const { nickname: sNickname, items: sItems } = JSON.parse(saved);
                if (sNickname || sItems.some((i: string) => i)) {
                    setNickname(sNickname || "");
                    initialItems = sItems || Array(10).fill("");
                    setItems(initialItems);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }
        setExampleArtists(getWeightedRandomFive(ARTIST_EXAMPLES, initialItems));
    }, []);

    useEffect(() => {
        // Save to local storage
        const timer = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ nickname, items }));
        }, 1000);
        return () => clearTimeout(timer);
    }, [nickname, items]);

    const handleReset = () => {
        if (confirm("모든 내용을 지우고 새로 시작할까요?")) {
            setNickname("");
            setItems(Array(10).fill(""));
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!nickname.trim()) {
            setError("닉네임을 입력해주세요.");
            return;
        }
        const trimmed = items.map((i) => i.trim()).filter(Boolean);
        if (trimmed.length !== 10) {
            setError("아티스트 10팀을 모두 입력해주세요.");
            return;
        }
        setLoading(true);
        try {
            // Auto-generate title
            const autoTitle = `${nickname.trim()}의 최애 아티스트 TOP 10`;

            // Use my-musician-test specific API path
            const res = await fetch("/my-musician-test/api/quizzes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: autoTitle, items: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "생성 실패");

            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.setItem(`editToken_${data.slug}`, data.editToken);
            router.push(`/my-musician-test/q/${data.slug}?created=1`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "생성에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const refreshExamples = useCallback(() => {
        setExampleArtists(getWeightedRandomFive(ARTIST_EXAMPLES, items));
    }, [items]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((prev) => {
                const oldIndex = prev.findIndex((_, i) => `item-${i}` === active.id);
                const newIndex = prev.findIndex((_, i) => `item-${i}` === over.id);
                if (oldIndex === -1 || newIndex === -1) return prev;
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    const updateItem = (index: number, value: string) => {
        setItems((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const removeItem = (index: number) => {
        setItems((prev) => {
            const next = [...prev];
            next[index] = "";
            return next;
        });
    };

    const addFromExample = (artist: string) => {
        const firstEmpty = items.findIndex((i) => !i.trim());
        if (firstEmpty >= 0) {
            updateItem(firstEmpty, artist);
        } else {
            setItems((prev) => [...prev.slice(0, -1), artist]);
        }
    };

    const filteredExamples = useMemo(() => {
        return exampleArtists.filter(a => !items.some(i => i.trim() === a));
        // Note: getWeightedRandomFive already filters, but state updates might lag or user might have typed one of them.
    }, [exampleArtists, items]);

    const filledCount = items.filter((i) => i.trim()).length;

    return (
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center">
            <header className="fixed top-0 w-full max-w-lg ios-glass z-50 px-4 h-16 flex items-center justify-between">
                <Link
                    href="/my-musician-test"
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--tertiary-bg)] transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-lg font-bold text-white">문제지 만들기</h1>
                <button
                    onClick={handleReset}
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-error)] transition-colors"
                >
                    초기화
                </button>
            </header>

            <main className="w-full max-w-lg px-6 pt-24 pb-32">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <section className="space-y-4">
                        <label className="block text-[var(--text-secondary)] text-sm font-semibold px-1">
                            닉네임
                        </label>
                        <div className="ios-card p-4">
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="예: 선영, 민지, 민준, 성훈"
                                className="w-full bg-transparent text-xl font-bold text-white placeholder:text-[var(--text-tertiary)] focus:outline-none"
                                maxLength={20}
                            />
                        </div>
                        <p className="text-[var(--text-tertiary)] text-xs px-1">
                            * '{nickname || "OO"}'의 최애 아티스트 TOP 10으로 제목이 자동 생성됩니다.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[var(--text-secondary)] text-sm font-semibold">
                                💡 이런 아티스트는 어때요?
                            </label>
                            <button
                                type="button"
                                onClick={refreshExamples}
                                className="text-[var(--color-primary-light)] text-xs font-bold hover:opacity-80 flex items-center gap-1"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M23 4v6h-6M1 20v-6h6" />
                                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                                </svg>
                                새로고침
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filteredExamples.map((artist) => (
                                <button
                                    key={artist}
                                    type="button"
                                    onClick={() => addFromExample(artist)}
                                    className="py-2.5 px-4 rounded-full bg-[var(--tertiary-bg)] text-white text-sm font-medium hover:bg-[var(--color-primary)] transition-all border border-[var(--glass-border)] active:scale-95 touch-none"
                                >
                                    {artist}
                                </button>
                            ))}
                            {filteredExamples.length === 0 && (
                                <p className="text-[var(--text-tertiary)] text-xs py-2">모든 추천 아티스트를 담았어요! 🎸</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[var(--text-secondary)] text-sm font-semibold">
                                아티스트 10팀 나열 (끌어서 순서 조절)
                            </label>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                                <span className="text-[var(--text-secondary)] text-xs font-mono">
                                    {filledCount}/10
                                </span>
                            </div>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={items.map((_, i) => `item-${i}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {items.map((item, i) => (
                                        <SortableItem
                                            key={`item-${i}`}
                                            id={`item-${i}`}
                                            value={item}
                                            rank={i + 1}
                                            onUpdate={(v) => updateItem(i, v)}
                                            onRemove={() => removeItem(i)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </section>

                    <div className="fixed bottom-0 left-0 right-0 p-6 ios-glass z-50 flex flex-col items-center">
                        <div className="w-full max-w-lg">
                            {error && (
                                <p className="text-[var(--color-error)] text-center text-sm font-medium mb-4 animate-bounce">
                                    {error}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-lg ios-button disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        생성 중...
                                    </div>
                                ) : (
                                    "테스트 만들기 완료"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </main>

            {showToast && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 ios-glass px-6 py-3 rounded-full shadow-2xl z-[100] border border-[var(--color-primary-light)]/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <p className="text-white text-sm font-medium whitespace-nowrap">
                        📝 이전 작성 중인 내용을 불러왔어요
                    </p>
                </div>
            )}
        </div>
    );
}
