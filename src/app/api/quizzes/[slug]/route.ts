import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    const { data: quiz, error } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("slug", slug)
        .single();

    if (error || !quiz) {
        return NextResponse.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabase
        .from("quiz_items")
        .select("name, rank")
        .eq("quiz_id", quiz.id)
        .order("rank", { ascending: true });

    if (itemsError) {
        return NextResponse.json(
            { error: "퀴즈 항목을 불러오는데 실패했습니다." },
            { status: 500 }
        );
    }

    const sortedItems = (items || []).map((i) => i.name);

    return NextResponse.json({
        title: quiz.title,
        items: sortedItems,
    });
}
