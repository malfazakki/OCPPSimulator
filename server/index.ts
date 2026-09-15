/// <reference types="@types/bun" />
import { db } from "./db";

const PORT = Number(process.env.SIMULATOR_PORT || 3001);

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: any, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
			...corsHeaders,
		},
	});
}

function errorResponse(message: string, status = 400) {
	return jsonResponse({ error: message }, status);
}

const server = Bun.serve({
	port: PORT,
	async fetch(req: Request) {
		const url = new URL(req.url);
		const path = url.pathname;
		const method = req.method;

		// Handle CORS Preflight
		if (method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		try {
			// Health Check
			if (path === "/api/health" && method === "GET") {
				return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
			}

			// --- CHARGE POINTS ---
			if (path === "/api/charge-points" && method === "GET") {
				const stmt = db.query("SELECT * FROM charge_points ORDER BY created_at DESC");
				const rows = stmt.all() as any[];
				const formatted = rows.map((r) => ({
					...r,
					device_settings: r.device_settings ? JSON.parse(r.device_settings) : null,
					ocpp_config: r.ocpp_config ? JSON.parse(r.ocpp_config) : null,
				}));
				return jsonResponse({ chargePoints: formatted });
			}

			if (path === "/api/charge-points" && method === "POST") {
				const body = await req.json();
				const { id, label, csms_url, protocol, status, device_settings, ocpp_config } = body;
				if (!id) return errorResponse("Missing 'id'");

				const query = `
          INSERT INTO charge_points (id, label, csms_url, protocol, status, device_settings, ocpp_config, updated_at)
          VALUES ($id, $label, $csms_url, $protocol, $status, $device_settings, $ocpp_config, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            label = COALESCE(EXCLUDED.label, charge_points.label),
            csms_url = COALESCE(EXCLUDED.csms_url, charge_points.csms_url),
            protocol = COALESCE(EXCLUDED.protocol, charge_points.protocol),
            status = COALESCE(EXCLUDED.status, charge_points.status),
            device_settings = COALESCE(EXCLUDED.device_settings, charge_points.device_settings),
            ocpp_config = COALESCE(EXCLUDED.ocpp_config, charge_points.ocpp_config),
            updated_at = CURRENT_TIMESTAMP;
        `;
				db.query(query).run({
					$id: id,
					$label: label || `CP ${id}`,
					$csms_url: csms_url || "ws://localhost:8080",
					$protocol: protocol || "ocpp1.6",
					$status: status || "disconnected",
					$device_settings: device_settings ? JSON.stringify(device_settings) : null,
					$ocpp_config: ocpp_config ? JSON.stringify(ocpp_config) : null,
				});
				return jsonResponse({ success: true, id });
			}

			// --- ACTIVE TRANSACTION RECOVERY & SYNC ---
			// Match /api/charge-points/:id/active-session
			const activeSessionMatch = path.match(/^\/api\/charge-points\/([^/]+)\/active-session$/);
			if (activeSessionMatch && method === "GET") {
				const cpId = decodeURIComponent(activeSessionMatch[1]);
				const connectorId = Number(url.searchParams.get("connectorId") || 1);

				const stmt = db.query(`
          SELECT * FROM transactions 
          WHERE cp_id = $cpId AND connector_id = $connectorId AND status = 'IN_PROGRESS'
          ORDER BY started_at DESC LIMIT 1
        `);
				const tx = stmt.get({ $cpId: cpId, $connectorId: connectorId }) as any;
				return jsonResponse({ activeSession: tx || null });
			}

			// Match /api/charge-points/:id/sync-session
			const syncSessionMatch = path.match(/^\/api\/charge-points\/([^/]+)\/sync-session$/);
			if (syncSessionMatch && method === "POST") {
				const cpId = decodeURIComponent(syncSessionMatch[1]);
				const body = await req.json();
				const {
					connectorId = 1,
					transactionId,
					idTag = "DEMO1234",
					meterStartWh = 0,
					currentEnergyWh = 0,
					currentSoc = 30,
					powerKw = 0,
					currentA = 0,
					voltageV = 230,
				} = body;

				if (!transactionId) return errorResponse("Missing 'transactionId'");

				// Check if transaction exists
				const existing = db
					.query(
						`
          SELECT id FROM transactions 
          WHERE cp_id = $cpId AND transaction_id = $transactionId AND status = 'IN_PROGRESS'
          LIMIT 1
        `,
					)
					.get({ $cpId: cpId, $transactionId: transactionId }) as any;

				if (existing) {
					db.query(
						`
            UPDATE transactions 
            SET current_energy_wh = $currentEnergyWh,
                current_soc = $currentSoc,
                power_kw = $powerKw,
                current_a = $currentA,
                voltage_v = $voltageV,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $id
          `,
					).run({
						$id: existing.id,
						$currentEnergyWh: currentEnergyWh,
						$currentSoc: currentSoc,
						$powerKw: powerKw,
						$currentA: currentA,
						$voltageV: voltageV,
					});
				} else {
					// Clean up old IN_PROGRESS sessions on this connector first
					db.query(
						`
            UPDATE transactions 
            SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP 
            WHERE cp_id = $cpId AND connector_id = $connectorId AND status = 'IN_PROGRESS'
          `,
					).run({ $cpId: cpId, $connectorId: connectorId });

					// Insert new transaction
					db.query(
						`
            INSERT INTO transactions (
              cp_id, connector_id, transaction_id, status, id_tag, 
              meter_start_wh, current_energy_wh, current_soc, power_kw, current_a, voltage_v
            ) VALUES (
              $cpId, $connectorId, $transactionId, 'IN_PROGRESS', $idTag,
              $meterStartWh, $currentEnergyWh, $currentSoc, $powerKw, $currentA, $voltageV
            )
          `,
					).run({
						$cpId: cpId,
						$connectorId: connectorId,
						$transactionId: transactionId,
						$idTag: idTag,
						$meterStartWh: meterStartWh,
						$currentEnergyWh: currentEnergyWh || meterStartWh,
						$currentSoc: currentSoc,
						$powerKw: powerKw,
						$currentA: currentA,
						$voltageV: voltageV,
					});
				}

				return jsonResponse({ success: true, transactionId });
			}

			// Match /api/charge-points/:id/stop-session
			const stopSessionMatch = path.match(/^\/api\/charge-points\/([^/]+)\/stop-session$/);
			if (stopSessionMatch && method === "POST") {
				const cpId = decodeURIComponent(stopSessionMatch[1]);
				const body = await req.json();
				const { transactionId, meterStopWh } = body;

				const query = transactionId
					? `UPDATE transactions SET status = 'COMPLETED', current_energy_wh = COALESCE($meterStopWh, current_energy_wh), updated_at = CURRENT_TIMESTAMP WHERE cp_id = $cpId AND transaction_id = $transactionId`
					: `UPDATE transactions SET status = 'COMPLETED', current_energy_wh = COALESCE($meterStopWh, current_energy_wh), updated_at = CURRENT_TIMESTAMP WHERE cp_id = $cpId AND status = 'IN_PROGRESS'`;

				db.query(query).run({
					$cpId: cpId,
					$transactionId: transactionId || null,
					$meterStopWh: meterStopWh || null,
				});

				return jsonResponse({ success: true, message: "Session stopped successfully" });
			}

			// --- OCPP LOGS ---
			const logsMatch = path.match(/^\/api\/charge-points\/([^/]+)\/logs$/);
			if (logsMatch) {
				const cpId = decodeURIComponent(logsMatch[1]);
				if (method === "GET") {
					const limit = Math.min(100, Number(url.searchParams.get("limit") || 50));
					const stmt = db.query(`
            SELECT * FROM ocpp_logs 
            WHERE cp_id = $cpId 
            ORDER BY timestamp DESC LIMIT $limit
          `);
					const rows = stmt.all({ $cpId: cpId, $limit: limit }) as any[];
					const parsed = rows.map((r) => ({
						...r,
						payload: r.payload ? JSON.parse(r.payload) : null,
					}));
					return jsonResponse({ logs: parsed });
				}

				if (method === "POST") {
					const body = await req.json();
					const { direction, messageType, action, payload } = body;
					db.query(
						`
            INSERT INTO ocpp_logs (cp_id, direction, message_type, action, payload, timestamp)
            VALUES ($cpId, $direction, $messageType, $action, $payload, CURRENT_TIMESTAMP)
          `,
					).run({
						$cpId: cpId,
						$direction: direction || "OUT",
						$messageType: messageType || "CALL",
						$action: action || "",
						$payload: payload ? JSON.stringify(payload) : null,
					});
					return jsonResponse({ success: true });
				}
			}

			return errorResponse("Endpoint not found", 404);
		} catch (err: any) {
			console.error("[Simulator API Error]", err);
			return errorResponse(err.message || "Internal Server Error", 500);
		}
	},
});

console.log(`[Simulator Server] REST API running at http://localhost:${server.port}`);
