import { ChevronRight, Github, Moon, PanelLeft, Radio, Server, Sun } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/context/SidebarContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import type { RootState } from "@/store/store";

export function AppNavbar() {
	const location = useLocation();
	const { id } = useParams<{ id: string }>();
	const { isCollapsed, toggleSidebar } = useSidebar();
	const { isDarkMode, toggleDarkMode } = useDarkMode();
	const cp = useSelector((s: RootState) => (id ? s.ocpp.items[id] : undefined));

	const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

	return (
		<header className='sticky top-0 z-30 flex h-16 shrink-0 w-full items-center justify-between border-b bg-card/95 px-4 sm:px-6 backdrop-blur-md shadow-2xs'>
			{/* Left section: Sidebar Toggle & Breadcrumbs */}
			<div className='flex items-center gap-3'>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='ghost'
							size='icon'
							onClick={toggleSidebar}
							className='h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg'
							aria-label='Toggle Sidebar'
						>
							<PanelLeft className='h-4 w-4' />
						</Button>
					</TooltipTrigger>
					<TooltipContent side='bottom' className='text-xs'>
						{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
					</TooltipContent>
				</Tooltip>

				<div className='hidden h-4 w-px bg-border sm:block' />

				{/* Breadcrumbs */}
				<div className='flex items-center gap-2 text-sm font-medium'>
					<div className='hidden xs:flex items-center gap-1.5 text-muted-foreground text-xs font-semibold'>
						<span>Malfa</span>
						<span className='text-muted-foreground/40'>/</span>
						<span>Simulator</span>
					</div>
					<ChevronRight className='hidden xs:block h-3.5 w-3.5 text-muted-foreground/50' />
					{isDashboard ? (
						<span className='text-foreground font-semibold text-sm'>Operations Overview</span>
					) : (
						<>
							<span className='text-foreground font-semibold text-sm'>Charge Point</span>
							{cp && (
								<>
									<ChevronRight className='h-3.5 w-3.5 text-muted-foreground/50' />
									<span className='font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 truncate max-w-[140px] sm:max-w-none'>
										{cp.label || id}
									</span>
								</>
							)}
						</>
					)}
				</div>
			</div>

			{/* Right section: Status Badges & Controls */}
			<div className='flex items-center gap-2 sm:gap-3'>
				{/* Active CP Status Badge if on Charge Point page */}
				{cp && (
					<div className='hidden md:flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 text-xs'>
						<Radio
							className={`h-3.5 w-3.5 ${
								cp.status === "connected"
									? "text-emerald-500 animate-pulse"
									: cp.status === "connecting"
										? "text-amber-500 animate-spin"
										: "text-slate-400"
							}`}
						/>
						<span className='text-muted-foreground'>Protocol:</span>
						<span className='font-mono font-semibold text-foreground uppercase'>
							{cp.config.protocol || "OCPP 1.6-J"}
						</span>
					</div>
				)}

				{/* CSMS Gateway status */}
				<Badge
					variant={cp?.status === "connected" ? "default" : "outline"}
					className={`hidden sm:inline-flex gap-1.5 py-1 px-2.5 text-xs font-normal ${
						cp?.status === "connected"
							? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
							: "text-muted-foreground"
					}`}
				>
					<Server
						className={`h-3.5 w-3.5 ${cp?.status === "connected" ? "text-emerald-500" : "text-muted-foreground"}`}
					/>
					<span className='font-medium'>{cp?.status === "connected" ? "CSMS Linked" : "Simulator Standby"}</span>
				</Badge>

				{/* GitHub Repo Link */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='ghost'
							size='icon'
							asChild
							className='h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg'
						>
							<a
								href='https://github.com/ozgurbayram/OCPPSimulator'
								target='_blank'
								rel='noopener noreferrer'
								aria-label='View on GitHub'
							>
								<Github className='h-4 w-4' />
							</a>
						</Button>
					</TooltipTrigger>
					<TooltipContent side='bottom' className='text-xs'>
						OCPP Simulator GitHub
					</TooltipContent>
				</Tooltip>

				{/* Theme switcher */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='ghost'
							size='icon'
							onClick={toggleDarkMode}
							className='h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg'
							aria-label='Toggle theme'
						>
							{isDarkMode ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
						</Button>
					</TooltipTrigger>
					<TooltipContent side='bottom' className='text-xs'>
						{isDarkMode ? "Switch to Light mode" : "Switch to Dark mode"}
					</TooltipContent>
				</Tooltip>
			</div>
		</header>
	);
}
