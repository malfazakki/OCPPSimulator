import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Battery, ChevronLeft, ChevronRight, Clock, LayoutDashboard, Plus, ShieldCheck, Zap } from "lucide-react";
import { ChargePointSheet } from "@/components/ocpp/ChargePointSheet";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import type { RootState } from "@/store/store";

export function AppSidebar({ className }: { className?: string }) {
	const location = useLocation();
	const navigate = useNavigate();
	const { isCollapsed, toggleSidebar } = useSidebar();
	const [cpSheetOpen, setCpSheetOpen] = useState(false);
	const { items, order } = useSelector((s: RootState) => s.ocpp);

	const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

	return (
		<aside
			className={cn(
				"relative flex h-full shrink-0 flex-col border-r bg-card text-card-foreground shadow-xs transition-all duration-300 ease-in-out",
				isCollapsed ? "w-18" : "w-64",
				className,
			)}
		>
			{/* OrbitPay Brand Header */}
			<div
				className={cn(
					"flex h-16 shrink-0 items-center border-b bg-card transition-all duration-300",
					isCollapsed ? "justify-center px-2" : "justify-between px-4",
				)}
			>
				<div className='cursor-pointer' onClick={() => navigate("/")}>
					<BrandLogo showText={!isCollapsed} />
				</div>

				{/* Toggle button on Sidebar header (visible in expanded state) */}
				{!isCollapsed && (
					<Button
						variant='ghost'
						size='icon'
						onClick={toggleSidebar}
						className='h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 rounded-lg'
						title='Collapse sidebar'
					>
						<ChevronLeft className='h-4 w-4' />
					</Button>
				)}
			</div>

			{/* Navigation List grouped by Core & Simulated Hardware */}
			<nav className='flex-1 space-y-4 p-3 overflow-y-auto min-h-0 overflow-x-hidden'>
				{/* Core Section */}
				<div className='space-y-1'>
					{!isCollapsed && (
						<div className='px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 truncate'>
							Core Simulator
						</div>
					)}
					{(() => {
						const linkElement = (
							<button
								onClick={() => navigate("/")}
								className={cn(
									"flex items-center rounded-lg text-sm font-medium transition-all duration-150 w-full cursor-pointer",
									isDashboard
										? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold [&>svg]:text-primary-foreground"
										: "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
									isCollapsed ? "h-10 w-10 justify-center mx-auto p-0" : "gap-3 px-3 py-2 text-left",
								)}
							>
								<LayoutDashboard className='h-4 w-4 shrink-0 transition-colors' />
								{!isCollapsed && <span className='truncate'>Dashboard Overview</span>}
							</button>
						);

						if (isCollapsed) {
							return (
								<Tooltip>
									<TooltipTrigger asChild>{linkElement}</TooltipTrigger>
									<TooltipContent side='right' className='font-medium text-xs'>
										Dashboard Overview
									</TooltipContent>
								</Tooltip>
							);
						}

						return linkElement;
					})()}
				</div>

				{/* Connections List */}
				<div className='space-y-1'>
					{!isCollapsed ? (
						<div className='flex items-center justify-between px-3 pb-1'>
							<span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 truncate'>
								Hardware Points ({order.length})
							</span>
							<Button
								size='icon'
								variant='ghost'
								onClick={() => setCpSheetOpen(true)}
								className='h-5 w-5 text-muted-foreground hover:text-foreground rounded'
								title='Add Charge Point'
							>
								<Plus className='h-3.5 w-3.5' />
							</Button>
						</div>
					) : (
						<div className='my-2 border-t border-border/50' />
					)}

					{order.map((cpId) => {
						const cp = items[cpId];
						const isCpActive = location.pathname === `/cp/${cpId}`;
						const isConnected = cp?.status === "connected";
						const isConnecting = cp?.status === "connecting";

						const linkElement = (
							<button
								key={cpId}
								onClick={() => navigate(`/cp/${cpId}`)}
								className={cn(
									"flex items-center rounded-lg text-sm font-medium transition-all duration-150 w-full cursor-pointer",
									isCpActive
										? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold [&>svg]:text-primary-foreground"
										: "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
									isCollapsed ? "h-10 w-10 justify-center mx-auto p-0" : "gap-3 px-3 py-2 text-left",
								)}
							>
								<div className='relative shrink-0'>
									{isConnected ? (
										<Zap className={cn("h-4 w-4", isCpActive ? "text-primary-foreground" : "text-emerald-500")} />
									) : isConnecting ? (
										<Clock
											className={cn("h-4 w-4", isCpActive ? "text-primary-foreground" : "text-amber-500 animate-spin")}
										/>
									) : (
										<Battery
											className={cn("h-4 w-4", isCpActive ? "text-primary-foreground" : "text-muted-foreground")}
										/>
									)}
								</div>
								{!isCollapsed && (
									<div className='flex flex-1 items-center justify-between overflow-hidden'>
										<span className='truncate text-xs font-mono'>{cp?.label || cpId}</span>
										<span
											className={cn(
												"h-1.5 w-1.5 rounded-full shrink-0",
												isConnected
													? isCpActive
														? "bg-primary-foreground"
														: "bg-emerald-500 animate-pulse"
													: isConnecting
														? "bg-amber-500"
														: "bg-muted-foreground/40",
											)}
										/>
									</div>
								)}
							</button>
						);

						if (isCollapsed) {
							return (
								<Tooltip key={cpId}>
									<TooltipTrigger asChild>{linkElement}</TooltipTrigger>
									<TooltipContent side='right' className='text-xs space-y-0.5 max-w-50'>
										<div className='font-semibold text-foreground flex items-center gap-1.5'>
											<span
												className={cn(
													"h-1.5 w-1.5 rounded-full",
													isConnected ? "bg-emerald-500 animate-pulse" : isConnecting ? "bg-amber-500" : "bg-slate-400",
												)}
											/>
											{cp?.label || cpId}
										</div>
										<div className='text-[10px] text-muted-foreground capitalize'>
											Status: {cp?.status || "disconnected"}
										</div>
									</TooltipContent>
								</Tooltip>
							);
						}

						return linkElement;
					})}

					{/* Add Connection button when expanded */}
					{!isCollapsed && (
						<button
							onClick={() => setCpSheetOpen(true)}
							className='flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all duration-150 w-full border border-dashed border-border/80 mt-2'
						>
							<Plus className='h-3.5 w-3.5 shrink-0' />
							<span>Add Charge Point</span>
						</button>
					)}
				</div>
			</nav>

			{/* Footer: Gateway Security & Health or Collapsed Status */}
			<div className='shrink-0 border-t p-2.5 bg-muted/20'>
				{!isCollapsed ? (
					<div className='rounded-xl border border-border/80 bg-background/80 p-3 space-y-1.5 text-xs shadow-2xs transition-all duration-200'>
						<div className='flex items-center justify-between'>
							<span className='flex items-center gap-1.5 font-semibold text-foreground text-[11px]'>
								<ShieldCheck className='h-3.5 w-3.5 text-emerald-500' />
								OCPP 1.6-J Engine
							</span>
							<span className='inline-flex items-center gap-1 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400'>
								<span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse' />
								Ready
							</span>
						</div>
						<div className='text-[10px] text-muted-foreground leading-relaxed'>
							Virtual Charge Point WebSocket client with JSON payload telemetry.
						</div>
					</div>
				) : (
					<div className='flex flex-col items-center gap-2 py-1'>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									onClick={() => setCpSheetOpen(true)}
									className='flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors'
								>
									<Plus className='h-4 w-4' />
								</button>
							</TooltipTrigger>
							<TooltipContent side='right' className='text-xs'>
								Add Charge Point
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<div className='flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-background/80 text-emerald-500 cursor-pointer shadow-2xs hover:bg-accent/80 transition-colors'>
									<ShieldCheck className='h-4 w-4' />
								</div>
							</TooltipTrigger>
							<TooltipContent side='right' className='p-2.5 space-y-1.5 max-w-55'>
								<div className='font-semibold text-foreground flex items-center gap-1.5'>
									<span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
									OCPP 1.6-J Engine
								</div>
								<div className='text-[11px] text-muted-foreground leading-relaxed'>
									Virtual Charge Point WebSocket client with JSON payload telemetry.
								</div>
							</TooltipContent>
						</Tooltip>

						{/* Expand button when collapsed */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant='ghost'
									size='icon'
									onClick={toggleSidebar}
									className='h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg'
								>
									<ChevronRight className='h-4 w-4' />
								</Button>
							</TooltipTrigger>
							<TooltipContent side='right' className='text-xs'>
								Expand Sidebar
							</TooltipContent>
						</Tooltip>
					</div>
				)}
			</div>

			<ChargePointSheet open={cpSheetOpen} onOpenChange={setCpSheetOpen} />
		</aside>
	);
}
