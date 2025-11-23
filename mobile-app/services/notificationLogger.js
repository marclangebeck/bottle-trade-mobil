import { ENABLE_NOTIFICATION_DEBUG } from '../config/featureFlags';

/**
 * Utility zum gezielten Debug-Logging der Benachrichtigungs-Pipeline.
 * Aktivierung über Umgebungsvariable `EXPO_PUBLIC_NOTIFICATION_DEBUG=true`.
 *
 * @param {{ stage?: string, type?: string, data?: unknown, meta?: Record<string, unknown> }} event
 */
export const logNotificationEvent = (event = {}) => {
  if (!ENABLE_NOTIFICATION_DEBUG) {
    return;
  }

  // Legacy-Signatur (stage, payload) unterstützen
  if (typeof event === 'string') {
    const legacyPayload = arguments.length > 1 ? arguments[1] : {};
    return logNotificationEvent({
      stage: event,
      data: legacyPayload,
      meta: { legacy: true },
    });
  }

  const { stage = 'unknown', type = 'generic', data, meta } = event;
  const timestamp = new Date().toISOString();

  const payload = {
    type,
    ...(meta ? { meta } : {}),
    ...(typeof data !== 'undefined' ? { data } : {}),
  };

  try {
    console.log(`[Notification][${stage}] ${timestamp}`, payload);
  } catch (error) {
    console.log(
      `[Notification][${stage}] ${timestamp} (Payload konnte nicht serialisiert werden)`,
      { type, meta: { ...meta, serializationError: true } },
    );
  }
};

export const isNotificationDebugEnabled = () => ENABLE_NOTIFICATION_DEBUG;

