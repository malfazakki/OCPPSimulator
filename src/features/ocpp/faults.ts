import { errorCodes, type OcppErrorCode } from '@/constants/ocpp.constants';
import type { Connector, ConnectorStatus } from '@/types/ocpp';

export type FaultCategory = 'electrical' | 'temperature' | 'hardware' | 'ev' | 'generic';

export interface FaultDefinition {
  errorCode: Exclude<OcppErrorCode, 'NoError'>;
  label: string;
  category: FaultCategory;
  description: string;
}

const faultLabels: Record<Exclude<OcppErrorCode, 'NoError'>, { label: string; category: FaultCategory; description: string }> = {
  ConnectorLockFailure: {
    label: 'Connector Lock Failure',
    category: 'hardware',
    description: 'Simulates a connector lock hardware fault.',
  },
  EVCommunicationError: {
    label: 'EV Communication Error',
    category: 'ev',
    description: 'Simulates a communication issue between the charger and the EV.',
  },
  GroundFailure: {
    label: 'Ground Failure',
    category: 'electrical',
    description: 'Simulates a ground fault on the outlet or cable.',
  },
  HighTemperature: {
    label: 'High Temperature',
    category: 'temperature',
    description: 'Simulates an over-temperature charger condition.',
  },
  InternalError: {
    label: 'Internal Error',
    category: 'hardware',
    description: 'Simulates an internal charger control error.',
  },
  LocalListConflict: {
    label: 'Local List Conflict',
    category: 'generic',
    description: 'Simulates a local authorization list conflict.',
  },
  OtherError: {
    label: 'Other Error',
    category: 'generic',
    description: 'Simulates a generic fault condition.',
  },
  OverCurrentFailure: {
    label: 'Over Current Failure',
    category: 'electrical',
    description: 'Simulates an electrical over-current protection fault.',
  },
  PowerMeterFailure: {
    label: 'Power Meter Failure',
    category: 'hardware',
    description: 'Simulates a power meter reporting failure.',
  },
  PowerSwitchFailure: {
    label: 'Power Switch Failure',
    category: 'hardware',
    description: 'Simulates a power switching fault.',
  },
  ReaderFailure: {
    label: 'Reader Failure',
    category: 'hardware',
    description: 'Simulates a card or RFID reader failure.',
  },
  ResetFailure: {
    label: 'Reset Failure',
    category: 'hardware',
    description: 'Simulates a charger reset or reboot failure.',
  },
  UnderVoltage: {
    label: 'Under Voltage',
    category: 'electrical',
    description: 'Simulates a low-voltage condition on the supply.',
  },
  OverVoltage: {
    label: 'Over Voltage',
    category: 'electrical',
    description: 'Simulates a high-voltage condition on the supply.',
  },
};

export const faultCatalogue: FaultDefinition[] = (errorCodes.filter(
  (code): code is Exclude<OcppErrorCode, 'NoError'> => code !== 'NoError'
) as Exclude<OcppErrorCode, 'NoError'>[]).map((errorCode) => ({
  errorCode,
  ...faultLabels[errorCode],
}));

export const faultMap = new Map(faultCatalogue.map((item) => [item.errorCode, item]));

export function isSupportedOcppErrorCode(code: string | undefined): boolean {
  if (!code) return false;
  return errorCodes.includes(code as OcppErrorCode);
}

export function getFaultDefinition(errorCode: string | undefined): FaultDefinition | undefined {
  if (!errorCode) return undefined;
  return faultMap.get(errorCode as Exclude<OcppErrorCode, 'NoError'>);
}

export function activateConnectorFault<T extends Pick<Connector, 'status' | 'errorCode' | 'lastNonFaultStatus' | 'activeFaultCode'>>(
  connector: T,
  errorCode: string
): T & Pick<Connector, 'status' | 'errorCode' | 'lastNonFaultStatus' | 'activeFaultCode'> {
  if (!errorCode || errorCode === 'NoError' || !isSupportedOcppErrorCode(errorCode)) {
    throw new Error(`Unsupported OCPP fault code: ${errorCode ?? 'undefined'}`);
  }

  const previousStatus = connector.status === 'Faulted'
    ? connector.lastNonFaultStatus ?? 'Available'
    : connector.status;

  return {
    ...connector,
    status: 'Faulted' as ConnectorStatus,
    errorCode: errorCode as OcppErrorCode,
    lastNonFaultStatus: previousStatus,
    activeFaultCode: errorCode as Exclude<OcppErrorCode, 'NoError'>,
  };
}

export function clearConnectorFault<T extends Pick<Connector, 'status' | 'errorCode' | 'lastNonFaultStatus' | 'activeFaultCode'>>(
  connector: T
): T & Pick<Connector, 'status' | 'errorCode' | 'lastNonFaultStatus' | 'activeFaultCode'> {
  const restoredStatus: ConnectorStatus =
    connector.lastNonFaultStatus && connector.lastNonFaultStatus !== 'Faulted'
      ? connector.lastNonFaultStatus
      : 'Available';

  return {
    ...connector,
    status: restoredStatus,
    errorCode: 'NoError',
    lastNonFaultStatus: undefined,
    activeFaultCode: undefined,
  };
}
