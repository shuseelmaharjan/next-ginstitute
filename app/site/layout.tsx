"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

interface SiteLayoutProps {
    children: React.ReactNode;
}

// Friendly title mapping for known segments under /site
const SEGMENT_TITLE_MAP: Record<string, string> = {
    about: "About",
    ads: "Ads",
    banner: "Banner",
    career: "Career",
    downloads: "Downloads",
    gallery: "Gallery",
    "principal-message": "Principal Message",
    testimonials: "Testimonials",
    "add-about": "Add About",
    "update-about": "Update About",
};

const formatSegmentTitle = (segment: string): string => {
    if (!segment) return "";
    if (SEGMENT_TITLE_MAP[segment]) return SEGMENT_TITLE_MAP[segment];
    // Fallback: replace hyphens and capitalize each word
    return segment
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const SiteLayout = ({ children }: SiteLayoutProps) => {
    const pathname = usePathname();

    const breadcrumbItems = useMemo(() => {
        const path = pathname || "";
        // Split and remove empty segments
        const segments = path.split('/').filter(Boolean);
        // We only care about segments after 'site'
        const siteIndex = segments.indexOf('site');
        if (siteIndex === -1) {
            return []; // Not under /site, no breadcrumbs
        }
        const afterSite = segments.slice(siteIndex + 1);

        // If no segments after /site (should not happen because /site has no page), return empty
        if (afterSite.length === 0) return [];

        // If only one segment after /site, show current page only
        if (afterSite.length === 1) {
            return [{ title: formatSegmentTitle(afterSite[0]), isCurrentPage: true }];
        }

        // Build cumulative breadcrumbs
        const items: Array<{ title: string; href?: string; isCurrentPage?: boolean }> = [];
        let cumulative = '/site';
        afterSite.forEach((seg, index) => {
            cumulative += `/${seg}`;
            const title = formatSegmentTitle(seg);
            const isLast = index === afterSite.length - 1;
            items.push(
                isLast ? { title, isCurrentPage: true } : { title, href: cumulative }
            );
        });
        return items;
    }, [pathname]);

    return (
        <AuthenticatedLayout breadcrumbItems={breadcrumbItems}>
            <div className="p-4">
                {children}
            </div>
        </AuthenticatedLayout>
    );
};

export default SiteLayout;