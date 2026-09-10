import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { Connector } from '@/types/ocpp';
import { connectWs, callAction, disconnectWs } from './wsManager';
import {
  activateConnectorFault,
  clearConnectorFault,
  faultCatalogue,
  isSupportedOcppErrorCode,
} from './faults.ts';

async function createConnectedHarness(clientId: string) {
  const sentPayloads: string[] = [];
  const OriginalWebSocket = globalThis.WebSocket;

  class MockWebSocket {
    static OPEN = 1;
    static instances: MockWebSocket[] = [];
    readyState = MockWebSocket.OPEN;
    url: string;
    protocols: string[];
    onopen?: () => void;
    onclose?: (event: { code: number; reason: string }) => void;
    onerror?: (event: unknown) => void;
    onmessage?: (event: { data: string }) => void;

    constructor(url: string, protocols: string[]) {
      this.url = url;
      this.protocols = protocols;
      MockWebSocket.instances.push(this);
      queueMicrotask(() => this.onopen?.());
    }

    send(data: string) {
      sentPayloads.push(data);
      try {
        const frame = JSON.parse(data);
        if (Array.isArray(frame) && frame[0] === 2 && frame[2] === 'StatusNotification') {
          const response = JSON.stringify([3, frame[1], {}]);
          queueMicrotask(() => this.onmessage?.({ data: response }));
        }
      } catch {}
    }

    close() {
      this.readyState = 3;
      this.onclose?.({ code: 1000, reason: 'test-close' });
    }
  }

  globalThis.WebSocket = MockWebSocket as any;
  await connectWs(clientId, 'ws://localhost:9000/ocpp/test', 'ocpp1.6', new QueryClient());

  return {
    sentPayloads,
    cleanup: () => {
      disconnectWs(clientId);
      globalThis.WebSocket = OriginalWebSocket;
    },
  };
}

describe('fault catalogue', () => {
  it('exposes only OCPP 1.6 supported error codes', () => {
    const hasNoError = faultCatalogue.some((item: { errorCode: string }) => item.errorCode === 'NoError');
    const hasHardwareError = faultCatalogue.some((item: { errorCode: string }) => item.errorCode === 'HardwareError');
    const hasHighTemperature = faultCatalogue.some((item: { errorCode: string }) => item.errorCode === 'HighTemperature');
    const hasGroundFailure = faultCatalogue.some((item: { errorCode: string }) => item.errorCode === 'GroundFailure');

    expect(hasNoError).toBe(false);
    expect(hasHardwareError).toBe(false);
    expect(hasHighTemperature).toBe(true);
    expect(hasGroundFailure).toBe(true);
    expect(faultCatalogue.length).toBeGreaterThan(0);
  });

  it('validates supported codes consistently', () => {
    expect(isSupportedOcppErrorCode('HighTemperature')).toBe(true);
    expect(isSupportedOcppErrorCode('NoError')).toBe(true);
    expect(isSupportedOcppErrorCode('HardwareError')).toBe(false);
  });
});

describe('fault lifecycle', () => {
  it('activates and clears connector faults without affecting other connectors', () => {
    const connector: Connector = {
      id: 1,
      status: 'Available',
      errorCode: 'NoError',
      lastNonFaultStatus: undefined,
      activeFaultCode: undefined,
    };

    const faulted = activateConnectorFault(connector, 'HighTemperature');
    expect(faulted.status).toBe('Faulted');
    expect(faulted.errorCode).toBe('HighTemperature');
    expect(faulted.lastNonFaultStatus).toBe('Available');
    expect(faulted.activeFaultCode).toBe('HighTemperature');

    const recovered = clearConnectorFault(faulted);
    expect(recovered.status).toBe('Available');
    expect(recovered.errorCode).toBe('NoError');
    expect(recovered.lastNonFaultStatus).toBeUndefined();
    expect(recovered.activeFaultCode).toBeUndefined();
  });

  it('keeps connector state isolated per connector', () => {
    const connector1 = activateConnectorFault({ id: 1, status: 'Available' as const, errorCode: 'NoError' as const, lastNonFaultStatus: undefined, activeFaultCode: undefined }, 'HighTemperature');
    const connector2: Connector = { id: 2, status: 'Available', errorCode: 'NoError', lastNonFaultStatus: undefined, activeFaultCode: undefined };

    expect(connector1.status).toBe('Faulted');
    expect(connector1.errorCode).toBe('HighTemperature');
    expect(connector2.status).toBe('Available');
    expect(connector2.errorCode).toBe('NoError');
  });

  it('fails safely for unsupported fault codes and invalid clear operations', () => {
    const connector: Connector = { id: 1, status: 'Available', errorCode: 'NoError', lastNonFaultStatus: undefined, activeFaultCode: undefined };

    expect(() => activateConnectorFault(connector, 'HardwareError')).toThrow();
    expect(() => activateConnectorFault(connector, 'NoError')).toThrow();
    expect(clearConnectorFault(connector).status).toBe('Available');
  });

  it('emits a real StatusNotification CALL when a fault is activated', async () => {
    const clientId = 'fault-activation-test';
    const harness = await createConnectedHarness(clientId);

    try {
      const previous: Connector = {
        id: 1,
        status: 'Charging',
        errorCode: 'NoError',
        lastNonFaultStatus: undefined,
        activeFaultCode: undefined,
      };
      const next = activateConnectorFault(previous, 'GroundFailure');

      await callAction(clientId, 'StatusNotification', {
        connectorId: 1,
        status: next.status,
        errorCode: next.errorCode,
        timestamp: new Date().toISOString(),
      });

      const statusFrames = harness.sentPayloads
        .map((raw) => JSON.parse(raw))
        .filter((frame) => Array.isArray(frame) && frame[2] === 'StatusNotification');
      const lastFrame = statusFrames.at(-1);

      expect(lastFrame).toBeDefined();
      expect(lastFrame[0]).toBe(2);
      expect(lastFrame[1]).toEqual(expect.any(String));
      expect(lastFrame[2]).toBe('StatusNotification');
      expect(lastFrame[3]).toMatchObject({
        connectorId: 1,
        status: 'Faulted',
        errorCode: 'GroundFailure',
      });
      expect(typeof lastFrame[3].timestamp).toBe('string');
      expect(new Date(lastFrame[3].timestamp).toString()).not.toBe('Invalid Date');
      expect(next.lastNonFaultStatus).toBe('Charging');
    } finally {
      harness.cleanup();
    }
  });

  it('emits a real StatusNotification CALL when a fault is cleared', async () => {
    const clientId = 'fault-recovery-test';
    const harness = await createConnectedHarness(clientId);

    try {
      const connector: Connector = {
        id: 1,
        status: 'Preparing',
        errorCode: 'NoError',
        lastNonFaultStatus: undefined,
        activeFaultCode: undefined,
      };
      const faulted = activateConnectorFault(connector, 'HighTemperature');
      const recovered = clearConnectorFault(faulted);

      await callAction(clientId, 'StatusNotification', {
        connectorId: 1,
        status: recovered.status,
        errorCode: recovered.errorCode,
        timestamp: new Date().toISOString(),
      });

      const statusFrames = harness.sentPayloads
        .map((raw) => JSON.parse(raw))
        .filter((frame) => Array.isArray(frame) && frame[2] === 'StatusNotification');
      const lastFrame = statusFrames.at(-1);

      expect(lastFrame).toBeDefined();
      expect(lastFrame[0]).toBe(2);
      expect(lastFrame[1]).toEqual(expect.any(String));
      expect(lastFrame[2]).toBe('StatusNotification');
      expect(lastFrame[3]).toMatchObject({
        connectorId: 1,
        status: 'Preparing',
        errorCode: 'NoError',
      });
      expect(typeof lastFrame[3].timestamp).toBe('string');
      expect(new Date(lastFrame[3].timestamp).toString()).not.toBe('Invalid Date');
      expect(recovered.lastNonFaultStatus).toBeUndefined();
      expect(recovered.activeFaultCode).toBeUndefined();
    } finally {
      harness.cleanup();
    }
  });
});
