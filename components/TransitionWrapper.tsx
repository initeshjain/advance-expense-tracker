'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export default function TransitionWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{
                    x: 100,
                    opacity: 0,
                    filter: 'blur(6px)',
                }}
                animate={{
                    x: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                }}
                exit={{
                    x: -100,
                    opacity: 0,
                    filter: 'blur(6px)',
                }}
                transition={{
                    duration: 0.45,
                    ease: 'easeInOut',
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
