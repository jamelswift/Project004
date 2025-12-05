import { Header } from "@/components/header"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto p-6">
                {children}
            </main>
        </div>
    )
}
