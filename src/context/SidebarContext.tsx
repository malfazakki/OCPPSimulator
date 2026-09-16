/* eslint-disable react-refresh/only-export-components */
import * as React from "react";

interface SidebarContextType {
	isCollapsed: boolean;
	setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
	toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

const BREAKPOINT = 1024; // auto-collapse below 1024px

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
		if (typeof window !== "undefined") {
			return window.innerWidth < BREAKPOINT;
		}
		return false;
	});

	React.useEffect(() => {
		let prevWidth = window.innerWidth;

		const handleResize = () => {
			const currentWidth = window.innerWidth;
			if (currentWidth < BREAKPOINT && prevWidth >= BREAKPOINT) {
				setIsCollapsed(true);
			} else if (currentWidth >= BREAKPOINT && prevWidth < BREAKPOINT) {
				setIsCollapsed(false);
			}
			prevWidth = currentWidth;
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const toggleSidebar = React.useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	return (
		<SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleSidebar }}>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = React.useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}
