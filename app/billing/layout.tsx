"use client";

import AuthenticatedLayout from "@/app/components/AuthenticatedLayout";

interface Props {
    children: React.ReactNode;
}

const getBreadcrumbItems = () => {
    return [
        { title: "Billing", isCurrentPage: true }
    ];
};

export default function BillingLayout({ children }: Props) {
    const breadcrumbItems = getBreadcrumbItems();

    return (
        <AuthenticatedLayout breadcrumbItems={breadcrumbItems}>
            <div className="p-4">
                {children}
            </div>
        </AuthenticatedLayout>
    );
}
