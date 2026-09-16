// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Settings, Sliders, Square, Trash2 } from "lucide-react";
import ChargingStatusDisplay from "@/components/ChargingStatusDisplay";
import ControlsPanel from "@/components/ControlsPanel";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChargePointAdvancedConfigSheet } from "@/components/ocpp/ChargePointAdvancedConfigSheet";
import { ChargePointConfigSheet } from "@/components/ocpp/ChargePointConfigSheet";
import { NetworkTraffic } from "@/components/ocpp/NetworkTraffic";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { normalizeDeviceSettings } from "@/constants/chargePointDefaults";
import { useFrames, useOcppConnection } from "@/features/ocpp/hooks";
import { removeChargePoint, setPaused } from "@/features/ocpp/ocppSlice";
import { loadDeviceSettings, saveFrames } from "@/features/ocpp/storage";
import { disconnectWs } from "@/features/ocpp/wsManager";
import { useChargingStatus } from "@/hooks/useChargingStatus";
import type { RootState } from "@/store/store";

export default function ChargePointConnection() {
	const { id } = useParams<{ id: string }>();
	const cp = useSelector((s: RootState) => (id ? s.ocpp.items[id] : undefined));
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [configOpen, setConfigOpen] = useState(false);
	const [advancedConfigOpen, setAdvancedConfigOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const { connect, disconnect } = useOcppConnection(cp);

	// Reconnect on mount if the charger was previously in connected state (persistent)
	const didMountRef = useRef(false);
	useEffect(() => {
		if (!cp) return;
		if (!didMountRef.current) {
			didMountRef.current = true;
			if (cp.autoConnect && cp.status === "disconnected") {
				connect.mutate({});
			}
		}
	}, [cp, connect]);

	// Frames for NetworkTraffic
	const framesQuery = useFrames(cp?.id || id || "");
	const frames = useMemo(() => framesQuery.data || [], [framesQuery.data]);
	const charging = useChargingStatus(cp?.id || id || "");

	const storedDeviceSettings = loadDeviceSettings(cp?.id || id || "");
	const deviceSettings = normalizeDeviceSettings({
		deviceName:
			storedDeviceSettings?.deviceName ||
			cp?.chargePointConfig?.deviceSettings?.deviceName ||
			`Simülatör-${cp?.id || id}`,
		...(cp?.chargePointConfig?.deviceSettings || {}),
		...(storedDeviceSettings || {}),
	});

	if (!cp) {
		return (
			<DashboardLayout>
				<Card className='rounded-xl border border-dashed border-border/80 p-8 text-center'>
					<div className='text-lg font-semibold text-foreground'>Charge point not found</div>
					<div className='mt-2 text-sm text-muted-foreground'>
						The ID "{id}" was not found in your local simulator state.
					</div>
					<div className='mt-6'>
						<Button size='sm' onClick={() => navigate("/")} className='gap-2'>
							<ArrowLeft className='h-4 w-4' />
							<span>Back to Dashboard</span>
						</Button>
					</div>
				</Card>
			</DashboardLayout>
		);
	}

	const onTogglePause = () => dispatch(setPaused({ id: cp.id, paused: !cp.paused }));
	const onCopy = async () => {
		const text = JSON.stringify(frames, null, 2);
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const ta = document.createElement("textarea");
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			try {
				document.execCommand("copy");
			} catch {}
			document.body.removeChild(ta);
		}
	};
	const onClear = () => {
		saveFrames(cp.id, []);
		queryClient.setQueryData(["frames", cp.id], []);
	};

	const onDelete = () => {
		setDeleteOpen(false);
		try {
			disconnectWs(cp.id);
		} catch {}
		saveFrames(cp.id, []);
		queryClient.setQueryData(["frames", cp.id], []);
		dispatch(removeChargePoint(cp.id));
		navigate("/");
	};

	const isConnected = cp.status === "connected";
	const isConnecting = cp.status === "connecting";

	return (
		<>
			<SEO
				title={`Charge Point: ${cp?.label || id} | Malfa OCPP Simulator`}
				description={`Monitor and control OCPP charge point ${cp?.label || id} with Malfa OCPP Simulator. View real-time charging status, send OCPP messages, and manage charging sessions.`}
				keywords={`Malfa OCPP, charge point, ${cp?.label || id}, EV charging simulation`}
			/>
			<DashboardLayout>
				<div className='space-y-6'>
					{/* Top Header & Hardware Action Control Bar */}
					<Card className='rounded-xl border border-border bg-card p-5 shadow-xs'>
						<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
							{/* Left: CP Identity & Status */}
							<div className='space-y-1.5 min-w-0'>
								<div className='flex flex-wrap items-center gap-2.5'>
									<h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate'>
										{cp.label || cp.config.cpId}
									</h1>
									<Badge
										variant='outline'
										className={`gap-1.5 py-1 px-2.5 text-xs font-semibold ${
											isConnected
												? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
												: isConnecting
													? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
													: "bg-muted text-muted-foreground"
										}`}
									>
										<span
											className={`h-2 w-2 rounded-full ${
												isConnected
													? "bg-emerald-500 animate-pulse"
													: isConnecting
														? "bg-amber-500 animate-spin"
														: "bg-slate-400"
											}`}
										/>
										<span className='capitalize'>{cp.status}</span>
									</Badge>
									<span className='rounded bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-primary'>
										{cp.config.protocol || "OCPP 1.6-J"}
									</span>
								</div>

								<div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono'>
									<div>
										CP ID: <span className='text-foreground font-bold'>{cp.config.cpId}</span>
									</div>
									<span className='text-border'>•</span>
									<div className='truncate max-w-[260px] sm:max-w-none'>
										CSMS: <span className='text-foreground font-semibold'>{cp.config.csmsUrl}</span>
									</div>
								</div>
							</div>

							{/* Right: Actions */}
							<div className='flex flex-wrap items-center gap-2'>
								{/* Connect / Disconnect Action */}
								{isConnected ? (
									<Button
										size='sm'
										variant='outline'
										onClick={() => disconnect.mutate()}
										disabled={disconnect.isPending}
										className='gap-1.5 border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
									>
										<Square className='h-3.5 w-3.5 fill-current' />
										<span>Disconnect</span>
									</Button>
								) : (
									<Button
										size='sm'
										onClick={() => connect.mutate({})}
										disabled={isConnecting || connect.isPending}
										className='gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm'
									>
										<Play className='h-3.5 w-3.5 fill-current' />
										<span>{isConnecting || connect.isPending ? "Connecting..." : "Connect to CSMS"}</span>
									</Button>
								)}

								<div className='h-6 w-px bg-border hidden sm:block' />

								<Button size='sm' variant='outline' onClick={() => setConfigOpen(true)} className='gap-1.5 text-xs'>
									<Settings className='h-3.5 w-3.5' />
									<span className='hidden sm:inline'>Basic Config</span>
									<span className='sm:hidden'>Basic</span>
								</Button>
								<Button
									size='sm'
									variant='outline'
									onClick={() => setAdvancedConfigOpen(true)}
									className='gap-1.5 text-xs'
								>
									<Sliders className='h-3.5 w-3.5' />
									<span className='hidden sm:inline'>Advanced</span>
									<span className='sm:hidden'>Adv</span>
								</Button>
								<Button
									size='sm'
									variant='ghost'
									onClick={() => setDeleteOpen(true)}
									className='gap-1.5 text-destructive hover:bg-destructive/10 text-xs'
								>
									<Trash2 className='h-3.5 w-3.5' />
									<span className='hidden sm:inline'>Delete</span>
								</Button>
							</div>
						</div>
					</Card>

					{/* Charging status display */}
					<ChargingStatusDisplay
						chargingData={charging.chargingData}
						isCharging={charging.isCharging}
						chargingType={deviceSettings.acdc || "AC"}
						connectors={cp.runtime?.connectors}
						deviceSettings={deviceSettings}
					/>

					{/* Hardware Controls Panel */}
					<ControlsPanel cp={cp} deviceSettings={deviceSettings} />

					{/* Network traffic JSON stream */}
					<NetworkTraffic
						frames={frames}
						paused={cp.paused}
						onTogglePause={onTogglePause}
						onCopy={onCopy}
						onClear={onClear}
					/>
				</div>

				<ChargePointConfigSheet chargePoint={cp} open={configOpen} onOpenChange={setConfigOpen} />
				<ChargePointAdvancedConfigSheet
					chargePoint={cp}
					open={advancedConfigOpen}
					onOpenChange={setAdvancedConfigOpen}
				/>
				<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
					<DialogContent className='rounded-xl'>
						<DialogHeader>
							<DialogTitle>Delete Hardware Connection?</DialogTitle>
							<DialogDescription>
								This will permanently remove "{cp.label || cp.config.cpId}" and close its active WebSocket connection.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className='gap-2 sm:gap-0'>
							<DialogClose asChild>
								<Button type='button' variant='outline'>
									Cancel
								</Button>
							</DialogClose>
							<Button type='button' variant='destructive' onClick={onDelete}>
								Delete Connection
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DashboardLayout>
		</>
	);
}
