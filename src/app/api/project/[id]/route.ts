import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const baseUrl = process.env.API_BASE_URL;
    const token = process.env.API_BEARER_TOKEN;

    if (!baseUrl || !token) {
        return NextResponse.json(
            { error: "API configuration missing" },
            { status: 500 }
        );
    }

    try {
        const res = await fetch(`${baseUrl}/db_query/project/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const baseUrl = process.env.API_BASE_URL;
    const token = process.env.API_BEARER_TOKEN;

    if (!baseUrl || !token) {
        return NextResponse.json(
            { error: "API configuration missing" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const res = await fetch(`${baseUrl}/db_query/project/${id}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const baseUrl = process.env.API_BASE_URL;
    const token = process.env.API_BEARER_TOKEN;

    if (!baseUrl || !token) {
        return NextResponse.json(
            { error: "API configuration missing" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const res = await fetch(`${baseUrl}/db_query/project/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("PUT Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
