"use server"

import { cookies } from "next/headers";

export async function storeCookies(
    key: string,
    value: string,
) {
    (await cookies()).set(
        key, value, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24
        }
    )
}

export async function getCookies(
    key: string,
) {
    return (await cookies()).get(key)?.value || "";
}

export async function deleteCookies(
    key: string,
) {
    (await cookies()).delete(key);
}