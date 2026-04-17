"use client"
import { isLoggedIn } from "@/src/services/auth";
import { redirect } from "next/navigation";
import { useEffect } from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!isLoggedIn()) {
            redirect('/')
        }
    }, []);

    return <>
        <div>
            Isto é uma sidebar
        </div>
        {children}
    </>
}