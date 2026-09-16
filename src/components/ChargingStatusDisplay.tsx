import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Battery, Clock, Gauge, Zap, TrendingUp } from "lucide-react";
import type { Connector } from "@/types/ocpp";

interface MeterValue {
	timestamp: string;
	sampledValue: Array<{
		context: string;
		measurand: string;
		unit: string;
		value: string;
	}>;
}

interface ChargingDataVM {
	connectorId: number;
	transactionId?: number;
	meterValue: MeterValue[];
}

interface ChargingStatusDisplayProps {
	chargingData?: ChargingDataVM[];
	isCharging: boolean;
	chargingType: "AC" | "DC";
	connectors?: Connector[];
	deviceSettings?: {
		deviceName?: string;
		maxPowerKw?: number;
		nominalVoltageV?: number;
		maxCurrentA?: number;
		energyKwh?: number;
		connectors?: number;
		socketType?: string[];
	};
}

export function ChargingStatusDisplay({
	chargingData = [],
	isCharging: _isCharging,
	chargingType,
	connectors = [],
	deviceSettings,
}: ChargingStatusDisplayProps) {
	const numConnectors = deviceSettings?.connectors || 1;
	const renderConnectorCard = (connectorId: number, data?: ChargingDataVM) => {
		const connector = connectors.find((c) => c.id === connectorId);
		const status = connector?.status || "Available";
		const isConnectorCharging = status === "Charging" || connector?.transactionId != null;
		const displayStatus = isConnectorCharging ? "Charging" : status;
		const latestMeterValue = data?.meterValue?.[0];
		const sampledValues = latestMeterValue?.sampledValue || [];

		const find = (m: string) => sampledValues.find((v) => v.measurand === m);
		const energyValue = find("Energy.Active.Import.Register");
		const currentValue = find("Current.Offered") || find("Current.Import");
		const powerValue = find("Power.Active.Import");
		const voltageValue = find("Voltage");
		const socValue = find("SoC");

		const energyWh = energyValue ? Number.parseFloat(energyValue.value) : 0;
		const currentA = isConnectorCharging && currentValue ? Number.parseFloat(currentValue.value) : 0;
		const powerKW = isConnectorCharging
			? powerValue
				? powerValue.unit?.toLowerCase() === "kw"
					? Number.parseFloat(powerValue.value)
					: Number.parseFloat(powerValue.value) / 1000
				: (currentA * (voltageValue ? Number.parseFloat(voltageValue.value) : 230)) / 1000
			: 0;
		const voltageV = voltageValue ? Number.parseFloat(voltageValue.value) : deviceSettings?.nominalVoltageV || 230;
		const socPct = socValue ? Number.parseFloat(socValue.value) : undefined;

		const chargingProgress =
			socPct !== undefined ? socPct : Math.min(100, (energyWh / ((deviceSettings?.energyKwh || 60) * 1000)) * 100);

		const connectorIsCharging = isConnectorCharging;

		return (
			<Card key={connectorId} className='rounded-xl border border-border bg-card shadow-xs'>
				<CardHeader className='pb-3'>
					<CardTitle className='flex items-center gap-2 text-base font-bold tracking-tight'>
						<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-primary'>
							<Zap className='h-4 w-4' />
						</div>
						<span>Connector #{connectorId}</span>
						{connector?.transactionId ? (
							<Badge
								variant='outline'
								className='ml-auto font-mono text-xs border-primary/30 text-primary bg-primary/10'
							>
								TX #{connector.transactionId}
							</Badge>
						) : null}
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
						<div className='flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3.5 py-2.5'>
							<div className='flex items-center gap-2'>
								{connectorIsCharging ? (
									<Zap className='h-4 w-4 text-emerald-500' />
								) : (
									<Battery className='h-4 w-4 text-muted-foreground' />
								)}
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Status</span>
							</div>
							<Badge
								variant='outline'
								className={`flex items-center gap-1.5 shrink-0 text-xs font-medium ${
									isConnectorCharging
										? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
										: "bg-muted text-muted-foreground border-border"
								}`}
							>
								<span
									className={`h-1.5 w-1.5 rounded-full ${
										isConnectorCharging ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
									}`}
								/>
								{displayStatus}
							</Badge>
						</div>
						<div className='flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3.5 py-2.5'>
							<div className='flex items-center gap-2'>
								<Gauge className='h-4 w-4 text-muted-foreground' />
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Power</span>
							</div>
							<span className='text-sm font-bold font-mono text-foreground'>{powerKW.toFixed(2)} kW</span>
						</div>
						<div className='flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3.5 py-2.5'>
							<div className='flex items-center gap-2'>
								<TrendingUp className='h-4 w-4 text-muted-foreground' />
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Current</span>
							</div>
							<span className='text-sm font-bold font-mono text-foreground'>{currentA.toFixed(1)} A</span>
						</div>
						<div className='flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3.5 py-2.5'>
							<div className='flex items-center gap-2'>
								<Battery className='h-4 w-4 text-muted-foreground' />
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Voltage</span>
							</div>
							<span className='text-sm font-bold font-mono text-foreground'>{voltageV.toFixed(0)} V</span>
						</div>
					</div>

					{chargingType === "DC" && socPct !== undefined && (
						<div className='space-y-2 rounded-lg border border-border bg-muted/20 p-3.5'>
							<div className='flex items-center justify-between text-xs font-medium'>
								<span className='text-muted-foreground uppercase tracking-wider'>Battery State of Charge (SoC)</span>
								<span className='font-mono font-bold text-foreground'>{socPct.toFixed(1)}%</span>
							</div>
							<Progress value={socPct} className='h-2' />
						</div>
					)}

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
						<div className='flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3.5 py-2.5'>
							<div className='flex items-center gap-2'>
								<Zap className='h-4 w-4 text-muted-foreground' />
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
									Energy Active Import
								</span>
							</div>
							<span className='text-sm font-bold font-mono text-primary'>{(energyWh / 1000).toFixed(3)} kWh</span>
						</div>
						<div className='flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3.5 py-2.5'>
							<div className='flex items-center gap-2'>
								<Clock className='h-4 w-4 text-muted-foreground' />
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
									Charge Target Progress
								</span>
							</div>
							<span className='text-sm font-bold font-mono text-foreground'>{chargingProgress.toFixed(1)}%</span>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className='space-y-4'>
			{Array.from({ length: numConnectors }, (_, i) => i + 1).map((connectorId) => {
				const data = chargingData.find((d) => d.connectorId === connectorId);
				return renderConnectorCard(connectorId, data);
			})}
		</div>
	);
}

export default ChargingStatusDisplay;
