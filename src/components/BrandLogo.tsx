import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
	className?: string;
	showText?: boolean;
	size?: "sm" | "md" | "lg";
}

export function BrandLogo({ className, showText = true, size = "md" }: BrandLogoProps) {
	const iconSizes = {
		sm: "h-7 w-7 rounded-lg",
		md: "h-9 w-9 rounded-xl",
		lg: "h-11 w-11 rounded-2xl",
	};

	const zapSizes = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};

	return (
		<div className={cn("flex items-center gap-3 overflow-hidden", className)}>
			{/* Malfa Electric Emblem */}
			<div
				className={cn(
					"relative flex shrink-0 items-center justify-center bg-linear-to-tr from-blue-700 via-indigo-600 to-cyan-400 text-white shadow-md shadow-blue-500/25",
					iconSizes[size],
				)}
			>
				<Zap className={cn("fill-white text-white", zapSizes[size])} />
				<span className='absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5'>
					<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
					<span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-card'></span>
				</span>
			</div>

			{showText && (
				<div className='truncate transition-opacity duration-200'>
					<div className='flex items-center gap-1.5'>
						<span className='text-sm font-bold tracking-tight text-foreground'>Malfa</span>
						<span className='rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide'>
							OCPP SIMULATOR
						</span>
					</div>
					<div className='text-[11px] text-muted-foreground font-medium truncate'>Hardware Simulation Lab</div>
				</div>
			)}
		</div>
	);
}
