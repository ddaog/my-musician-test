import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
        return NextResponse.json({ error: "submissionId가 필요합니다." }, { status: 400 });
    }

    const { data: answers, error } = await supabase
        .from("submission_items")
        .select("name, selected_rank")
        .eq("submission_id", submissionId)
        .order("selected_rank", { ascending: true });

    if (error) {
        return NextResponse.json({ error: "제출 정보를 불러오는데 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ answers });
}
