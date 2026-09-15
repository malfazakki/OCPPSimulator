const API_BASE = "/api";

export interface ActiveSession {
	id: number;
	cp_id: string;
	connector_id: number;
	transaction_id: number;
	status: string;
	id_tag: string;
	meter_start_wh: number;
	current_energy_wh: number;
	current_soc: number;
	power_kw: number;
	current_a: number;
	voltage_v: number;
	started_at: string;
	updated_at: string;
}

export async function getActiveSession(cpId: string, connectorId = 1): Promise<ActiveSession | null> {
	try {
		const res = await fetch(`${API_BASE}/charge-points/${encodeURIComponent(cpId)}/active-session?connectorId=${connectorId}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.activeSession || null;
	} catch (err) {
		console.warn("[Simulator API] Failed to fetch active session:", err);
		return null;
	}
}

export async function syncSession(
	cpId: string,
	data: {
		connectorId?: number;
		transactionId: number;
		idTag?: string;
		meterStartWh?: number;
		currentEnergyWh?: number;
		currentSoc?: number;
		powerKw?: number;
		currentA?: number;
		voltageV?: number;
	},
): Promise<boolean> {
	try {
		const res = await fetch(`${API_BASE}/charge-points/${encodeURIComponent(cpId)}/sync-session`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		return res.ok;
	} catch (err) {
		console.warn("[Simulator API] Failed to sync session:", err);
		return false;
	}
}

export async function stopSession(cpId: string, transactionId?: number, meterStopWh?: number): Promise<boolean> {
	try {
		const res = await fetch(`${API_BASE}/charge-points/${encodeURIComponent(cpId)}/stop-session`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ transactionId, meterStopWh }),
		});
		return res.ok;
	} catch (err) {
		console.warn("[Simulator API] Failed to stop session:", err);
		return false;
	}
}

export async function saveOcppLog(
	cpId: string,
	data: {
		direction: "IN" | "OUT";
		messageType: string;
		action?: string;
		payload?: unknown;
	},
): Promise<boolean> {
	try {
		const res = await fetch(`${API_BASE}/charge-points/${encodeURIComponent(cpId)}/logs`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		return res.ok;
	} catch {
		return false;
	}
}
