import { type ReactNode } from 'react';
import { SidebarProvider } from '@/context/SidebarContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from './AppSidebar';
import { AppNavbar } from './AppNavbar';

interface DashboardLayoutProps {
	children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<SidebarProvider>
			<TooltipProvider delayDuration={150}>
				<div className='flex h-screen w-full overflow-hidden bg-background text-foreground antialiased'>
					{/* Fixed Collapsible Sidebar */}
					<AppSidebar />

					{/* Fixed Header & Scrollable Main Content */}
					<div className='flex flex-1 flex-col h-full min-w-0 overflow-hidden'>
						<AppNavbar />
						<main className='flex-1 overflow-y-auto min-h-0'>
							<div className='p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full'>
								{children}
							</div>
						</main>
					</div>
				</div>
			</TooltipProvider>
		</SidebarProvider>
	);
}
