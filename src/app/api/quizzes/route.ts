import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateSlug, generateEditToken } from "@/lib/slug";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, items } = body;

        if (!title || !Array.isArray(items) || items.length !== 10) {
            return NextResponse.json(
                { error: "title과 items(10개)가 필요합니다." },
                { status: 400 }
            );
        }

        const slug = generateSlug();
        const editToken = generateEditToken();

        const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .insert({ slug, title, edit_token: editToken, type: 'musician' })
            .select("id")
            .single();

        if (quizError) {
            console.error(quizError);
            return NextResponse.json(
                { error: "퀴즈 생성에 실패했습니다." },
                { status: 500 }
            );
        }

        const quizItems = items.map((name: string, index: number) => ({
            quiz_id: quiz.id,
            name: String(name).trim(),
            rank: index + 1,
        }));

        const { error: itemsError } = await supabase
            .from("quiz_items")
            .insert(quizItems);

        if (itemsError) {
            await supabase.from("quizzes").delete().eq("id", quiz.id);
            console.error(itemsError);
            return NextResponse.json(
                { error: "퀴즈 항목 저장에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            slug,
            editToken,
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
