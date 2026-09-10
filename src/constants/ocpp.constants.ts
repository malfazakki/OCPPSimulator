export const statuses = [
  'Available',
  'Preparing',
  'Charging',
  'SuspendedEV',
  'SuspendedEVSE',
  'Finishing',
  'Reserved',
  'Unavailable',
  'Faulted',
] as const;

export type OcppStatus = (typeof statuses)[number];

export const errorCodes = [
  'NoError',
  'ConnectorLockFailure',
  'EVCommunicationError',
  'GroundFailure',
  'HighTemperature',
  'InternalError',
  'LocalListConflict',
  'OtherError',
  'OverCurrentFailure',
  'PowerMeterFailure',
  'PowerSwitchFailure',
  'ReaderFailure',
  'ResetFailure',
  'UnderVoltage',
  'OverVoltage',
] as const;

export type OcppErrorCode = (typeof errorCodes)[number];
