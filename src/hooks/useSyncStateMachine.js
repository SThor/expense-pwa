import { useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

/**
 * State machine for coordinating YNAB and SettleUp API synchronization
 * Ensures proper sequencing and message handling without overwrites
 */
export function createSyncMachine(config = {}) {
  return createMachine(
    {
      id: "syncMachine",
      initial: "idle",
      context: {
        messages: [],
        errors: [],
        enableYNAB: false,
        enableSettleUp: false,
      },
      states: {
        idle: {
          on: {
            SUBMIT: {
              target: "preparing",
              actions: "initializeContext",
            },
          },
        },
        preparing: {
          entry: "logStateTransition",
          always: [
            { target: "syncingYNAB", guard: "shouldSyncYNAB" },
            { target: "syncingSettleUp", guard: "shouldSyncSettleUp" },
            { target: "success" }, // No syncs needed
          ],
        },
        syncingYNAB: {
          entry: "logStateTransition",
          invoke: {
            id: "ynabSync",
            src: "syncYNAB",
            onDone: {
              target: "ynabComplete",
              actions: "handleYNABSuccess",
            },
            onError: {
              target: "ynabComplete",
              actions: "handleYNABError",
            },
          },
        },
        ynabComplete: {
          entry: "logStateTransition",
          always: [
            { target: "syncingSettleUp", guard: "shouldSyncSettleUp" },
            { target: "checkResults" },
          ],
        },
        syncingSettleUp: {
          entry: "logStateTransition",
          invoke: {
            id: "settleUpSync",
            src: "syncSettleUp",
            onDone: {
              target: "checkResults",
              actions: "handleSettleUpSuccess",
            },
            onError: {
              target: "checkResults",
              actions: "handleSettleUpError",
            },
          },
        },
        checkResults: {
          entry: "logStateTransition",
          always: [
            { target: "error", guard: "hasErrors" },
            { target: "success" },
          ],
        },
        success: {
          entry: "logStateTransition",
          type: "final",
        },
        error: {
          entry: "logStateTransition",
          type: "final",
        },
      },
    },
    {
      actions: {
        initializeContext: assign(({ event }) => ({
          messages: [],
          errors: [],
          enableYNAB: event.enableYNAB || false,
          enableSettleUp: event.enableSettleUp || false,
        })),
        handleYNABSuccess: assign(({ context, event }) => ({
          messages: [...context.messages, { type: "ynab", message: event.output }],
        })),
        handleYNABError: assign(({ context, event }) => ({
          errors: [
            ...context.errors,
            { type: "ynab", message: event.error?.message || String(event.error) },
          ],
        })),
        handleSettleUpSuccess: assign(({ context, event }) => ({
          messages: [
            ...context.messages,
            { type: "settleup", message: event.output },
          ],
        })),
        handleSettleUpError: assign(({ context, event }) => ({
          errors: [
            ...context.errors,
            {
              type: "settleup",
              message: event.error?.message || String(event.error),
            },
          ],
        })),
        logStateTransition: ({ context, event }) => {
          if (config.debug) {
            console.log("[SyncMachine] State transition:", {
              event: event.type,
              context,
            });
          }
        },
      },
      guards: {
        shouldSyncYNAB: ({ context }) => context.enableYNAB === true,
        shouldSyncSettleUp: ({ context }) => context.enableSettleUp === true,
        hasErrors: ({ context }) => context.errors.length > 0,
      },
    },
  );
}

/**
 * Hook to use the sync state machine with YNAB and SettleUp handlers
 * @param {Function} onYNABSync - Async function to sync with YNAB
 * @param {Function} onSettleUpSync - Async function to sync with SettleUp
 * @param {Object} options - Configuration options
 * @returns {Object} - State machine state and helpers
 */
export function useSyncStateMachine(onYNABSync, onSettleUpSync, options = {}) {
  const machine = useMemo(
    () =>
      createSyncMachine({ debug: options.debug }).provide({
        actors: {
          syncYNAB: async () => {
            const result = await onYNABSync();
            return result;
          },
          syncSettleUp: async () => {
            const result = await onSettleUpSync();
            return result;
          },
        },
      }),
    [onYNABSync, onSettleUpSync, options.debug],
  );

  const [state, send] = useMachine(machine);

  return {
    state: state.value,
    context: state.context,
    isIdle: state.matches("idle"),
    isPreparing: state.matches("preparing"),
    isSyncingYNAB: state.matches("syncingYNAB"),
    isYNABComplete: state.matches("ynabComplete"),
    isSyncingSettleUp: state.matches("syncingSettleUp"),
    isCheckingResults: state.matches("checkResults"),
    isSuccess: state.matches("success"),
    isError: state.matches("error"),
    isLoading:
      state.matches("preparing") ||
      state.matches("syncingYNAB") ||
      state.matches("ynabComplete") ||
      state.matches("syncingSettleUp") ||
      state.matches("checkResults"),
    submit: (enableYNAB, enableSettleUp) =>
      send({ type: "SUBMIT", enableYNAB, enableSettleUp }),
  };
}
