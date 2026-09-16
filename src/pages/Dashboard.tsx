import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Layers, Plus, Server, ShieldCheck, Zap } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChargePointSheet } from "@/components/ocpp/ChargePointSheet";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RootState } from "@/store/store";

export default function Dashboard() {
	const navigate = useNavigate();
	const { items, order } = useSelector((s: RootState) => s.ocpp);
	const [cpSheetOpen, setCpSheetOpen] = useState(false);

	const totalCPs = order.length;
	const connectedCPs = order.filter((id) => items[id]?.status === "connected").length;

	return (
		<>
			<SEO
				title='Dashboard | Malfa OCPP Simulator'
				description='Manage and monitor your OCPP charge point connections with Malfa OCPP Simulator. Create new charge points, view connection status, and test EV charging sessions.'
				keywords='Malfa OCPP simulator, OCPP dashboard, charge point management, EV charging simulator, OCPP 1.6-J'
			/>
			<DashboardLayout>
				{/* Top Header & Action */}
				<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<div className='space-y-1'>
						<div className='flex items-center gap-2'>
							<h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>Hardware Simulation Lab</h1>
							<span className='rounded bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-primary'>OCPP 1.6-J</span>
						</div>
						<p className='text-sm text-muted-foreground'>
							Virtual Charge Point WebSocket telemetry, smart metering, and remote CSMS command dispatching.
						</p>
					</div>
					<Button onClick={() => setCpSheetOpen(true)} className='gap-2 shadow-sm font-medium self-start sm:self-auto'>
						<Plus className='h-4 w-4' />
						<span>New Charge Point</span>
					</Button>
				</div>

				{/* Metric Stats Cards */}
				<div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
					<Card className='rounded-xl border border-border bg-card p-5 shadow-xs'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
								Total Charge Points
							</span>
							<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-primary'>
								<Layers className='h-4 w-4' />
							</div>
						</div>
						<div className='mt-3 flex items-baseline gap-2'>
							<span className='text-2xl font-bold font-mono text-foreground'>{totalCPs}</span>
							<span className='text-xs text-muted-foreground'>Configured</span>
						</div>
					</Card>

					<Card className='rounded-xl border border-border bg-card p-5 shadow-xs'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
								Connected WebSockets
							</span>
							<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500'>
								<Zap className='h-4 w-4' />
							</div>
						</div>
						<div className='mt-3 flex items-baseline gap-2'>
							<span className='text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400'>
								{connectedCPs}
							</span>
							<span className='text-xs text-muted-foreground'>Active Link</span>
						</div>
					</Card>

					<Card className='rounded-xl border border-border bg-card p-5 shadow-xs'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
								CSMS Core Engine
							</span>
							<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500'>
								<Server className='h-4 w-4' />
							</div>
						</div>
						<div className='mt-3 flex items-baseline gap-2'>
							<span className='text-xs font-mono font-semibold text-foreground truncate'>ws://localhost:8887</span>
						</div>
					</Card>

					<Card className='rounded-xl border border-border bg-card p-5 shadow-xs'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
								Security Protocol
							</span>
							<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500'>
								<ShieldCheck className='h-4 w-4' />
							</div>
						</div>
						<div className='mt-3 flex items-baseline gap-2'>
							<span className='text-sm font-semibold text-foreground'>OCPP 1.6-J</span>
							<span className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'>JSON / WS</span>
						</div>
					</Card>
				</div>

				{/* Charge Point Grid */}
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<h2 className='text-lg font-semibold text-foreground tracking-tight'>
							Simulated Charge Points ({totalCPs})
						</h2>
					</div>

					{order.length === 0 ? (
						<Card className='rounded-xl border border-dashed border-border/80 bg-card/50 p-12 text-center shadow-xs'>
							<div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4'>
								<Zap className='h-7 w-7' />
							</div>
							<h3 className='text-lg font-semibold text-foreground'>No Charge Points Configured</h3>
							<p className='mt-1 text-sm text-muted-foreground max-w-md mx-auto'>
								Create a simulated EV charger to connect with OrbitPay CSMS, trigger Start/Stop transactions, and stream
								MeterValues telemetry.
							</p>
							<div className='mt-6'>
								<Button onClick={() => setCpSheetOpen(true)} className='gap-2'>
									<Plus className='h-4 w-4' />
									<span>Add Your First Charge Point</span>
								</Button>
							</div>
						</Card>
					) : (
						<div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
							{order.map((cpId) => {
								const cp = items[cpId];
								const isConnected = cp?.status === "connected";
								const isConnecting = cp?.status === "connecting";

								return (
									<Card
										key={cpId}
										className='group relative rounded-xl border border-border bg-card p-5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200'
									>
										<div className='flex items-start justify-between gap-3'>
											<div className='space-y-1 overflow-hidden'>
												<div className='flex items-center gap-2'>
													<span className='font-bold text-base text-foreground tracking-tight truncate'>
														{cp?.label || cpId}
													</span>
												</div>
												<div className='font-mono text-xs text-muted-foreground truncate'>
													ID: <span className='text-foreground font-semibold'>{cp?.config?.cpId || cpId}</span>
												</div>
											</div>

											<Badge
												variant='outline'
												className={`gap-1.5 py-0.5 px-2 text-[11px] shrink-0 font-medium ${
													isConnected
														? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
														: isConnecting
															? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
															: "bg-muted text-muted-foreground"
												}`}
											>
												<span
													className={`h-1.5 w-1.5 rounded-full ${
														isConnected
															? "bg-emerald-500 animate-pulse"
															: isConnecting
																? "bg-amber-500 animate-spin"
																: "bg-slate-400"
													}`}
												/>
												<span className='capitalize'>{cp?.status || "disconnected"}</span>
											</Badge>
										</div>

										<div className='mt-4 pt-3 border-t border-border/60 text-xs space-y-1.5'>
											<div className='flex items-center justify-between text-muted-foreground'>
												<span>Target CSMS:</span>
												<span className='font-mono text-[11px] text-foreground truncate max-w-[180px]'>
													{cp?.config?.csmsUrl || "ws://localhost:8887"}
												</span>
											</div>
											<div className='flex items-center justify-between text-muted-foreground'>
												<span>Protocol:</span>
												<span className='font-mono text-[11px] font-semibold text-foreground uppercase'>
													{cp?.config?.protocol || "ocpp1.6"}
												</span>
											</div>
										</div>

										<div className='mt-4 flex items-center justify-end gap-2'>
											<Button
												size='sm'
												onClick={() => navigate(`/cp/${cpId}`)}
												className='w-full gap-1.5 text-xs font-medium'
											>
												<span>Open Hardware Console</span>
												<ArrowRight className='h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
											</Button>
										</div>
									</Card>
								);
							})}
						</div>
					)}
				</div>

				<ChargePointSheet open={cpSheetOpen} onOpenChange={setCpSheetOpen} />
			</DashboardLayout>
		</>
	);
}
