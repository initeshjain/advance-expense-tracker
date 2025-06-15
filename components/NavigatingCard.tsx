'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function NavigatingCard({
    to,
    children,
    className,
}: {
    to: string;
    children: React.ReactNode;
    className?: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(() => {
            router.push(to);
        });
    };

    return (
        <div onClick={handleClick} className="cursor-pointer">
            <Card className={cn('relative hover:shadow-md transition-shadow', className)}>
                {isPending && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur flex items-center justify-center z-10 rounded-lg">
                        <Loader2 size="md" className="w-8 h-8 animate-spin" />
                    </div>
                )}
                {children}
            </Card>
        </div>
    );
}
