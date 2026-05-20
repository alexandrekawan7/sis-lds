"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { MANAGE_USERS_PERMISSION } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

export default function HomePage() {
    const router = useRouter();
    const trpc = useTRPC();

    const meQuery = useQuery(trpc.user.me.queryOptions());

    const canManageUsers =
        meQuery.data?.role.permissions.some(
            (permission) => permission.name === MANAGE_USERS_PERMISSION
        ) ?? false;

    useEffect(() => {
        if (meQuery.isLoading) {
            return;
        }

        if (!meQuery.data) {
            router.replace("/");
            return;
        }

        router.replace(canManageUsers ? "/home/users" : "/perfil");
    }, [canManageUsers, meQuery.data, meQuery.isLoading, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#efefef] font-[Poppins,sans-serif] text-[#555]">
            Redirecionando...
        </div>
    );
}